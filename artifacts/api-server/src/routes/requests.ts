import { Router } from "express";
import { db } from "@workspace/db";
import { savedRequestsTable, requestResultsTable } from "@workspace/db";
import { eq, desc, ilike, and, isNotNull } from "drizzle-orm";
import {
  CreateRequestBody,
  UpdateRequestBody,
  GetRequestParams,
  UpdateRequestParams,
  DeleteRequestParams,
  SendRequestParams,
  GetRequestHistoryParams,
  ListRequestsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function serializeRequest(r: typeof savedRequestsTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeResult(r: typeof requestResultsTable.$inferSelect) {
  return {
    ...r,
    executedAt: r.executedAt.toISOString(),
  };
}

router.get("/requests", async (req, res) => {
  const parse = ListRequestsQueryParams.safeParse(req.query);
  const collectionId = parse.data?.collectionId ?? undefined;
  const search = parse.data?.search ?? undefined;

  let query = db.select().from(savedRequestsTable).$dynamic();
  const conditions = [];
  if (collectionId !== undefined && collectionId !== null) {
    conditions.push(eq(savedRequestsTable.collectionId, collectionId));
  }
  if (search) {
    conditions.push(ilike(savedRequestsTable.name, `%${search}%`));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  const rows = await query.orderBy(desc(savedRequestsTable.updatedAt));
  return res.json(rows.map(serializeRequest));
});

router.get("/requests/recent", async (req, res) => {
  const rows = await db
    .select()
    .from(savedRequestsTable)
    .where(isNotNull(savedRequestsTable.lastStatusCode))
    .orderBy(desc(savedRequestsTable.updatedAt))
    .limit(10);
  return res.json(rows.map(serializeRequest));
});

router.post("/requests", async (req, res) => {
  const parse = CreateRequestBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const [row] = await db.insert(savedRequestsTable).values(parse.data).returning();
  return res.status(201).json(serializeRequest(row));
});

router.get("/requests/:id", async (req, res) => {
  const parse = GetRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db.select().from(savedRequestsTable).where(eq(savedRequestsTable.id, parse.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(serializeRequest(row));
});

router.patch("/requests/:id", async (req, res) => {
  const paramParse = UpdateRequestParams.safeParse({ id: Number(req.params.id) });
  if (!paramParse.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParse = UpdateRequestBody.safeParse(req.body);
  if (!bodyParse.success) return res.status(400).json({ error: "Invalid input" });
  const [row] = await db
    .update(savedRequestsTable)
    .set({ ...bodyParse.data, updatedAt: new Date() })
    .where(eq(savedRequestsTable.id, paramParse.data.id))
    .returning();
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(serializeRequest(row));
});

router.delete("/requests/:id", async (req, res) => {
  const parse = DeleteRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(savedRequestsTable).where(eq(savedRequestsTable.id, parse.data.id));
  return res.status(204).send();
});

router.post("/requests/:id/send", async (req, res) => {
  const parse = SendRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });
  const [saved] = await db.select().from(savedRequestsTable).where(eq(savedRequestsTable.id, parse.data.id));
  if (!saved) return res.status(404).json({ error: "Not found" });

  const start = Date.now();
  try {
    const url = new URL(saved.url);
    if (saved.queryParams) {
      try {
        const params = JSON.parse(saved.queryParams) as Record<string, string>;
        Object.entries(params).forEach(([k, v]) => v && url.searchParams.append(k, v));
      } catch {}
    }
    const headers: Record<string, string> = { "User-Agent": "APExplorer/1.0" };
    if (saved.headers) {
      try {
        const parsed = JSON.parse(saved.headers) as Record<string, string>;
        Object.assign(headers, parsed);
      } catch {}
    }
    const fetchOpts: RequestInit = { method: saved.method, headers };
    if (saved.body && !["GET", "HEAD"].includes(saved.method)) {
      fetchOpts.body = saved.body;
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
    const response = await fetch(url.toString(), fetchOpts);
    const responseTime = Date.now() - start;
    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });

    const [result] = await db
      .insert(requestResultsTable)
      .values({
        requestId: saved.id,
        statusCode: response.status,
        statusText: response.statusText,
        responseHeaders: JSON.stringify(responseHeaders),
        responseBody,
        responseTime,
      })
      .returning();

    await db
      .update(savedRequestsTable)
      .set({ lastStatusCode: response.status, lastResponseTime: responseTime, updatedAt: new Date() })
      .where(eq(savedRequestsTable.id, saved.id));

    return res.json(serializeResult(result));
  } catch (err) {
    const responseTime = Date.now() - start;
    const errMsg = err instanceof Error ? err.message : String(err);
    const [result] = await db
      .insert(requestResultsTable)
      .values({
        requestId: saved.id,
        statusCode: 0,
        statusText: "Network Error",
        responseHeaders: "{}",
        responseBody: `Error: ${errMsg}`,
        responseTime,
      })
      .returning();

    await db
      .update(savedRequestsTable)
      .set({ lastStatusCode: 0, lastResponseTime: responseTime, updatedAt: new Date() })
      .where(eq(savedRequestsTable.id, saved.id));

    return res.json(serializeResult(result));
  }
});

router.get("/requests/:id/history", async (req, res) => {
  const parse = GetRequestHistoryParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });
  const rows = await db
    .select()
    .from(requestResultsTable)
    .where(eq(requestResultsTable.requestId, parse.data.id))
    .orderBy(desc(requestResultsTable.executedAt))
    .limit(20);
  return res.json(rows.map(serializeResult));
});

export default router;

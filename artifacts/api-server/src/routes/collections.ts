import { Router } from "express";
import { db } from "@workspace/db";
import { collectionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { savedRequestsTable } from "@workspace/db";
import {
  CreateCollectionBody,
  UpdateCollectionBody,
  GetCollectionParams,
  UpdateCollectionParams,
  DeleteCollectionParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/collections", async (req, res) => {
  const rows = await db.select().from(collectionsTable).orderBy(collectionsTable.createdAt);
  const counts = await db
    .select({ collectionId: savedRequestsTable.collectionId, count: sql<number>`count(*)::int` })
    .from(savedRequestsTable)
    .groupBy(savedRequestsTable.collectionId);
  const countMap = Object.fromEntries(counts.map((c) => [c.collectionId, c.count]));
  return res.json(rows.map((r) => ({ ...r, requestCount: countMap[r.id] ?? 0, createdAt: r.createdAt.toISOString() })));
});

router.post("/collections", async (req, res) => {
  const parse = CreateCollectionBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const [row] = await db.insert(collectionsTable).values(parse.data).returning();
  return res.status(201).json({ ...row, requestCount: 0, createdAt: row.createdAt.toISOString() });
});

router.get("/collections/:id", async (req, res) => {
  const parse = GetCollectionParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db.select().from(collectionsTable).where(eq(collectionsTable.id, parse.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  const [count] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(savedRequestsTable)
    .where(eq(savedRequestsTable.collectionId, parse.data.id));
  return res.json({ ...row, requestCount: count?.count ?? 0, createdAt: row.createdAt.toISOString() });
});

router.patch("/collections/:id", async (req, res) => {
  const paramParse = UpdateCollectionParams.safeParse({ id: Number(req.params.id) });
  if (!paramParse.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParse = UpdateCollectionBody.safeParse(req.body);
  if (!bodyParse.success) return res.status(400).json({ error: "Invalid input" });
  const [row] = await db
    .update(collectionsTable)
    .set(bodyParse.data)
    .where(eq(collectionsTable.id, paramParse.data.id))
    .returning();
  if (!row) return res.status(404).json({ error: "Not found" });
  const [count] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(savedRequestsTable)
    .where(eq(savedRequestsTable.collectionId, paramParse.data.id));
  return res.json({ ...row, requestCount: count?.count ?? 0, createdAt: row.createdAt.toISOString() });
});

router.delete("/collections/:id", async (req, res) => {
  const parse = DeleteCollectionParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(collectionsTable).where(eq(collectionsTable.id, parse.data.id));
  return res.status(204).send();
});

export default router;

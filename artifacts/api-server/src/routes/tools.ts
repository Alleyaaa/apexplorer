import { Router } from "express";
import { db } from "@workspace/db";
import { requestResultsTable } from "@workspace/db";
import { ParseCurlBody, SendAdhocBody } from "@workspace/api-zod";

const router = Router();

router.post("/tools/parse-curl", async (req, res) => {
  const parse = ParseCurlBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const curlStr = parse.data.curl.trim();
  const result = parseCurlCommand(curlStr);
  return res.json(result);
});

router.post("/tools/send-adhoc", async (req, res) => {
  const parse = SendAdhocBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const { method, url: rawUrl, headers: headersStr, body: bodyStr, queryParams: qpStr } = parse.data;
  const start = Date.now();

  try {
    const url = new URL(rawUrl);
    if (qpStr) {
      try {
        const params = JSON.parse(qpStr) as Record<string, string>;
        Object.entries(params).forEach(([k, v]) => v && url.searchParams.append(k, v));
      } catch {}
    }
    const headers: Record<string, string> = { "User-Agent": "APExplorer/1.0" };
    if (headersStr) {
      try {
        const parsed = JSON.parse(headersStr) as Record<string, string>;
        Object.assign(headers, parsed);
      } catch {}
    }
    const fetchOpts: RequestInit = { method, headers };
    if (bodyStr && !["GET", "HEAD"].includes(method)) {
      fetchOpts.body = bodyStr;
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
    const response = await fetch(url.toString(), fetchOpts);
    const responseTime = Date.now() - start;
    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });

    const now = new Date().toISOString();
    return res.json({
      id: 0,
      requestId: 0,
      statusCode: response.status,
      statusText: response.statusText,
      responseHeaders: JSON.stringify(responseHeaders),
      responseBody,
      responseTime,
      executedAt: now,
    });
  } catch (err) {
    const responseTime = Date.now() - start;
    const errMsg = err instanceof Error ? err.message : String(err);
    const now = new Date().toISOString();
    return res.json({
      id: 0,
      requestId: 0,
      statusCode: 0,
      statusText: "Network Error",
      responseHeaders: "{}",
      responseBody: `Error: ${errMsg}`,
      responseTime,
      executedAt: now,
    });
  }
});

function parseCurlCommand(curl: string): { method: string; url: string; headers: string; body: string; queryParams: string } {
  const method = /-X\s+([A-Z]+)/i.exec(curl)?.[1] ?? (curl.includes("-d ") || curl.includes("--data") ? "POST" : "GET");
  const urlMatch = /curl\s+(?:[^\s]+\s+)*'([^']+)'|curl\s+(?:[^\s]+\s+)*"([^"]+)"|curl\s+(?:[^\s]+\s+)*(https?:\/\/\S+)/i.exec(curl);
  let rawUrl = urlMatch?.[1] ?? urlMatch?.[2] ?? urlMatch?.[3] ?? "";

  let urlObj: URL | null = null;
  const queryParams: Record<string, string> = {};
  try {
    urlObj = new URL(rawUrl);
    urlObj.searchParams.forEach((v, k) => { queryParams[k] = v; });
    urlObj.search = "";
    rawUrl = urlObj.toString();
  } catch {}

  const headers: Record<string, string> = {};
  const headerRegex = /-H\s+'([^']+)'|-H\s+"([^"]+)"/g;
  let m;
  while ((m = headerRegex.exec(curl)) !== null) {
    const hdr = m[1] ?? m[2];
    const idx = hdr.indexOf(":");
    if (idx > 0) {
      headers[hdr.slice(0, idx).trim()] = hdr.slice(idx + 1).trim();
    }
  }

  const bodyMatch = /(?:-d|--data(?:-raw)?)\s+'([^']*)'|(?:-d|--data(?:-raw)?)\s+"([^"]*)"/i.exec(curl);
  const body = bodyMatch?.[1] ?? bodyMatch?.[2] ?? "";

  return {
    method: method.toUpperCase(),
    url: rawUrl,
    headers: JSON.stringify(headers),
    body,
    queryParams: JSON.stringify(queryParams),
  };
}

export default router;

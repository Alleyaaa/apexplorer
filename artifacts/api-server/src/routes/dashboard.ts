import { Router } from "express";
import { db } from "@workspace/db";
import { collectionsTable, savedRequestsTable, requestResultsTable, fileAnalysesTable } from "@workspace/db";
import { sql, gte } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  const [[collections], [requests], [files], [recent]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(collectionsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(savedRequestsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(fileAnalysesTable),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(requestResultsTable)
      .where(gte(requestResultsTable.executedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
  ]);

  const methodRows = await db
    .select({ method: savedRequestsTable.method, count: sql<number>`count(*)::int` })
    .from(savedRequestsTable)
    .groupBy(savedRequestsTable.method);

  const statusRows = await db
    .select({ statusCode: requestResultsTable.statusCode })
    .from(requestResultsTable);

  const statusBuckets: Record<string, number> = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, "Error": 0 };
  for (const { statusCode } of statusRows) {
    if (statusCode >= 200 && statusCode < 300) statusBuckets["2xx"]++;
    else if (statusCode >= 300 && statusCode < 400) statusBuckets["3xx"]++;
    else if (statusCode >= 400 && statusCode < 500) statusBuckets["4xx"]++;
    else if (statusCode >= 500) statusBuckets["5xx"]++;
    else statusBuckets["Error"]++;
  }

  return res.json({
    totalCollections: collections.count,
    totalRequests: requests.count,
    totalFileAnalyses: files.count,
    recentRequestCount: recent.count,
    methodBreakdown: methodRows.map((r) => ({ method: r.method, count: r.count })),
    statusBreakdown: Object.entries(statusBuckets)
      .filter(([, c]) => c > 0)
      .map(([range, count]) => ({ range, count })),
  });
});

export default router;

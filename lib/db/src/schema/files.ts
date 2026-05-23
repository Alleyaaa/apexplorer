import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fileAnalysesTable = pgTable("file_analyses", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  filesize: integer("filesize").notNull(),
  mimetype: text("mimetype").notNull(),
  md5: text("md5").notNull(),
  sha256: text("sha256").notNull(),
  entropy: real("entropy"),
  strings: text("strings"),
  hexDump: text("hex_dump"),
  metadata: text("metadata"),
  isSuspicious: boolean("is_suspicious").notNull().default(false),
  suspiciousReasons: text("suspicious_reasons"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFileAnalysisSchema = createInsertSchema(fileAnalysesTable).omit({ id: true, createdAt: true });
export type InsertFileAnalysis = z.infer<typeof insertFileAnalysisSchema>;
export type FileAnalysis = typeof fileAnalysesTable.$inferSelect;

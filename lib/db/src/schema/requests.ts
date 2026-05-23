import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { collectionsTable } from "./collections";

export const savedRequestsTable = pgTable("saved_requests", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => collectionsTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  method: text("method").notNull().default("GET"),
  url: text("url").notNull(),
  headers: text("headers"),
  body: text("body"),
  queryParams: text("query_params"),
  notes: text("notes"),
  lastStatusCode: integer("last_status_code"),
  lastResponseTime: integer("last_response_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const requestResultsTable = pgTable("request_results", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => savedRequestsTable.id, { onDelete: "cascade" }).notNull(),
  statusCode: integer("status_code").notNull(),
  statusText: text("status_text").notNull(),
  responseHeaders: text("response_headers").notNull(),
  responseBody: text("response_body").notNull(),
  responseTime: integer("response_time").notNull(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export const insertSavedRequestSchema = createInsertSchema(savedRequestsTable).omit({ id: true, createdAt: true, updatedAt: true, lastStatusCode: true, lastResponseTime: true });
export type InsertSavedRequest = z.infer<typeof insertSavedRequestSchema>;
export type SavedRequest = typeof savedRequestsTable.$inferSelect;
export type RequestResult = typeof requestResultsTable.$inferSelect;

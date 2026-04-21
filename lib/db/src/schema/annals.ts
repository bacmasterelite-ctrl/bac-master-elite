import { pgTable, text, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { subjectsTable } from "./subjects";

export const annalsTable = pgTable("annals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  serie: text("serie").notNull(),
  year: integer("year").notNull(),
  subjectId: uuid("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  pdfUrl: text("pdf_url").notNull(),
  isPremium: boolean("is_premium").notNull().default(true),
});

export type Annal = typeof annalsTable.$inferSelect;
export type InsertAnnal = typeof annalsTable.$inferInsert;

import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const subjectsTable = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  serie: text("serie").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  description: text("description"),
});

export type Subject = typeof subjectsTable.$inferSelect;
export type InsertSubject = typeof subjectsTable.$inferInsert;

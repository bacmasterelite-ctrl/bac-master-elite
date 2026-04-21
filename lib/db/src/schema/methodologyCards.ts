import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const methodologyCardsTable = pgTable("methodology_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  icon: text("icon").notNull().default("BookOpen"),
});

export type MethodologyCard = typeof methodologyCardsTable.$inferSelect;
export type InsertMethodologyCard = typeof methodologyCardsTable.$inferInsert;

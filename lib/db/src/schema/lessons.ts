import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { subjectsTable } from "./subjects";

export const lessonsTable = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subjectId: uuid("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  serie: text("serie").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  durationMinutes: integer("duration_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Lesson = typeof lessonsTable.$inferSelect;
export type InsertLesson = typeof lessonsTable.$inferInsert;

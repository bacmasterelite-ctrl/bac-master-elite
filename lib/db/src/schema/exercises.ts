import { pgTable, text, jsonb, uuid } from "drizzle-orm/pg-core";
import { subjectsTable } from "./subjects";

export interface QcmOption { id: string; text: string }
export interface QcmQuestion {
  id: string;
  prompt: string;
  options: QcmOption[];
  correctOptionId: string;
  explanation?: string | null;
}

export const exercisesTable = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subjectId: uuid("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  serie: text("serie").notNull(),
  difficulty: text("difficulty").notNull(),
  description: text("description"),
  questions: jsonb("questions").$type<QcmQuestion[]>().notNull(),
});

export type Exercise = typeof exercisesTable.$inferSelect;
export type InsertExercise = typeof exercisesTable.$inferInsert;

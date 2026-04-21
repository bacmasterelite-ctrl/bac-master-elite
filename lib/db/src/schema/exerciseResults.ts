import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { exercisesTable } from "./exercises";

export const exerciseResultsTable = pgTable("exercise_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  exerciseId: uuid("exercise_id").notNull().references(() => exercisesTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  percentage: integer("percentage").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ExerciseResult = typeof exerciseResultsTable.$inferSelect;
export type InsertExerciseResult = typeof exerciseResultsTable.$inferInsert;

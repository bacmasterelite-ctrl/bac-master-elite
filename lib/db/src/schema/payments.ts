import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => profilesTable.userId, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  method: text("method").notNull(),
  proofUrl: text("proof_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;

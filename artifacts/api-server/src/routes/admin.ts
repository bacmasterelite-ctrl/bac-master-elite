import { Router, type IRouter, type Response } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../lib/db";
import { profilesTable, paymentsTable } from "@workspace/db/schema";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth, requireAdmin);

router.get("/admin/users", async (_req, res: Response) => {
  const rows = await db.select().from(profilesTable).orderBy(desc(profilesTable.createdAt));
  res.json(rows);
});

router.get("/admin/payments", async (req, res: Response) => {
  const status = req.query.status as string | undefined;
  const rows = await db
    .select({
      id: paymentsTable.id,
      userId: paymentsTable.userId,
      userEmail: profilesTable.email,
      userName: profilesTable.fullName,
      amount: paymentsTable.amount,
      method: paymentsTable.method,
      proofUrl: paymentsTable.proofUrl,
      status: paymentsTable.status,
      createdAt: paymentsTable.createdAt,
      reviewedAt: paymentsTable.reviewedAt,
    })
    .from(paymentsTable)
    .leftJoin(profilesTable, eq(paymentsTable.userId, profilesTable.userId))
    .where(status ? eq(paymentsTable.status, status) : sql`true`)
    .orderBy(desc(paymentsTable.createdAt));
  res.json(rows);
});

router.post("/admin/payments/:id/approve", async (req, res: Response) => {
  const [payment] = await db
    .update(paymentsTable)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(paymentsTable.id, req.params.id))
    .returning();
  if (!payment) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.update(profilesTable).set({ isPremium: true }).where(eq(profilesTable.userId, payment.userId));
  res.json(payment);
});

router.post("/admin/payments/:id/reject", async (req, res: Response) => {
  const [payment] = await db
    .update(paymentsTable)
    .set({ status: "rejected", reviewedAt: new Date() })
    .where(eq(paymentsTable.id, req.params.id))
    .returning();
  if (!payment) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(payment);
});

router.get("/admin/stats", async (_req, res: Response) => {
  const [totalUsers] = await db.select({ c: sql<number>`count(*)::int` }).from(profilesTable);
  const [premiumUsers] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(profilesTable)
    .where(eq(profilesTable.isPremium, true));
  const [pendingPayments] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "pending"));

  const usersBySerie = await db
    .select({ serie: profilesTable.serie, count: sql<number>`count(*)::int` })
    .from(profilesTable)
    .groupBy(profilesTable.serie);

  const signupsByMonth = await db
    .select({
      month: sql<string>`to_char(${profilesTable.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(profilesTable)
    .groupBy(sql`to_char(${profilesTable.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${profilesTable.createdAt}, 'YYYY-MM')`);

  res.json({
    totalUsers: totalUsers?.c ?? 0,
    premiumUsers: premiumUsers?.c ?? 0,
    pendingPayments: pendingPayments?.c ?? 0,
    usersBySerie: usersBySerie.map((r) => ({ serie: r.serie ?? "N/A", count: r.count })),
    signupsByMonth,
  });
});

export default router;

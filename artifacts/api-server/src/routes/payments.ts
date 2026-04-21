import { Router, type IRouter, type Response } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { paymentsTable, profilesTable } from "@workspace/db/schema";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreatePaymentBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/payments/info", (_req, res: Response) => {
  res.json({
    price: 5000,
    currency: "XOF",
    methods: [
      { method: "wave", label: "Wave", number: "+221 77 000 00 00" },
      { method: "mtn", label: "MTN Mobile Money", number: "+225 07 00 00 00 00" },
      { method: "orange", label: "Orange Money", number: "+221 77 111 11 11" },
    ],
  });
});

router.get("/payments", requireAuth, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const rows = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId))
    .orderBy(desc(paymentsTable.createdAt));
  res.json(rows);
});

router.post("/payments", requireAuth, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [created] = await db
    .insert(paymentsTable)
    .values({
      userId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      proofUrl: parsed.data.proofUrl,
      status: "pending",
    })
    .returning();
  res.json(created);
});

export default router;

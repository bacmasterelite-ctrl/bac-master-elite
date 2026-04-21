import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "../lib/db";
import { profilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface AuthedRequest extends Request {
  userId: string;
  userEmail?: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = (auth?.sessionClaims as { userId?: string } | undefined)?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthedRequest).userId = userId;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as AuthedRequest).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profile?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

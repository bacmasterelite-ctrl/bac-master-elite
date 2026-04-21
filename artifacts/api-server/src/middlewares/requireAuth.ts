import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "../lib/db";
import { profilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface AuthedRequest extends Request {
  userId: string;
  userEmail?: string;
  userName?: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Tiny in-memory cache to avoid hitting Supabase on every request
const tokenCache = new Map<string, { exp: number; userId: string; email?: string; name?: string | null }>();
const CACHE_TTL_MS = 60_000;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const cached = tokenCache.get(token);
  if (cached && cached.exp > Date.now()) {
    (req as AuthedRequest).userId = cached.userId;
    (req as AuthedRequest).userEmail = cached.email;
    (req as AuthedRequest).userName = cached.name ?? null;
    next();
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = data.user;
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const fullName = meta.full_name || meta.name || null;

  tokenCache.set(token, {
    exp: Date.now() + CACHE_TTL_MS,
    userId: user.id,
    email: user.email ?? undefined,
    name: fullName,
  });

  (req as AuthedRequest).userId = user.id;
  (req as AuthedRequest).userEmail = user.email ?? undefined;
  (req as AuthedRequest).userName = fullName;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as AuthedRequest).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  if (!profile?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

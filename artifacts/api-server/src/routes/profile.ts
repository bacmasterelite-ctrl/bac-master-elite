import { Router, type IRouter, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { db } from "../lib/db";
import {
  profilesTable,
  exerciseResultsTable,
  exercisesTable,
  lessonsTable,
  annalsTable,
} from "@workspace/db/schema";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { UpdateMeBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureProfile(userId: string): Promise<typeof profilesTable.$inferSelect> {
  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (existing) return existing;

  let email = `${userId}@unknown.local`;
  let fullName: string | null = null;
  try {
    const user = await clerkClient.users.getUser(userId);
    email = user.emailAddresses[0]?.emailAddress || email;
    fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  } catch {
    /* fallback */
  }

  const isFirstUser =
    (await db.select({ c: sql<number>`count(*)::int` }).from(profilesTable))[0]?.c === 0;

  const [created] = await db
    .insert(profilesTable)
    .values({ userId, email, fullName, isAdmin: isFirstUser })
    .returning();
  return created;
}

router.get("/me", requireAuth, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const profile = await ensureProfile(userId);
  res.json(profile);
});

router.patch("/me", requireAuth, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  await ensureProfile(userId);
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [updated] = await db
    .update(profilesTable)
    .set(parsed.data)
    .where(eq(profilesTable.userId, userId))
    .returning();
  res.json(updated);
});

router.get("/dashboard/summary", requireAuth, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const profile = await ensureProfile(userId);

  const serieFilter = profile.serie ? eq(lessonsTable.serie, profile.serie) : undefined;

  const [lessonsCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(lessonsTable)
    .where(serieFilter ?? sql`true`);
  const [exercisesCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(exercisesTable)
    .where(profile.serie ? eq(exercisesTable.serie, profile.serie) : sql`true`);
  const [annalsCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(annalsTable)
    .where(profile.serie ? eq(annalsTable.serie, profile.serie) : sql`true`);
  const [completedCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(exerciseResultsTable)
    .where(eq(exerciseResultsTable.userId, userId));

  const recent = await db
    .select({
      id: exerciseResultsTable.id,
      exerciseId: exerciseResultsTable.exerciseId,
      exerciseTitle: exercisesTable.title,
      score: exerciseResultsTable.score,
      total: exerciseResultsTable.total,
      percentage: exerciseResultsTable.percentage,
      createdAt: exerciseResultsTable.createdAt,
    })
    .from(exerciseResultsTable)
    .leftJoin(exercisesTable, eq(exerciseResultsTable.exerciseId, exercisesTable.id))
    .where(eq(exerciseResultsTable.userId, userId))
    .orderBy(desc(exerciseResultsTable.createdAt))
    .limit(5);

  const ranking = await db
    .select({ userId: profilesTable.userId })
    .from(profilesTable)
    .where(profile.serie ? eq(profilesTable.serie, profile.serie) : sql`true`)
    .orderBy(desc(profilesTable.score));
  const rank = ranking.findIndex((r) => r.userId === userId);

  res.json({
    profile,
    totals: {
      lessons: lessonsCount?.c ?? 0,
      exercises: exercisesCount?.c ?? 0,
      annals: annalsCount?.c ?? 0,
      completedExercises: completedCount?.c ?? 0,
    },
    recentResults: recent,
    rank: rank >= 0 ? rank + 1 : null,
  });
});

export default router;

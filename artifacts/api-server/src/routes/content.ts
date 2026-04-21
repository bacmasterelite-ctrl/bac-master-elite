import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../lib/db";
import {
  subjectsTable,
  lessonsTable,
  exercisesTable,
  annalsTable,
  methodologyCardsTable,
  profilesTable,
  exerciseResultsTable,
  type QcmQuestion,
} from "@workspace/db/schema";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { SubmitExerciseBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", async (req: Request, res: Response) => {
  const serie = req.query.serie as string | undefined;
  const rows = await db
    .select()
    .from(subjectsTable)
    .where(serie ? eq(subjectsTable.serie, serie) : sql`true`);
  res.json(rows);
});

router.get("/lessons", async (req: Request, res: Response) => {
  const serie = req.query.serie as string | undefined;
  const subjectId = req.query.subjectId as string | undefined;
  const conditions = [];
  if (serie) conditions.push(eq(lessonsTable.serie, serie));
  if (subjectId) conditions.push(eq(lessonsTable.subjectId, subjectId));
  const rows = await db
    .select({
      id: lessonsTable.id,
      title: lessonsTable.title,
      subjectId: lessonsTable.subjectId,
      subjectName: subjectsTable.name,
      serie: lessonsTable.serie,
      content: lessonsTable.content,
      summary: lessonsTable.summary,
      durationMinutes: lessonsTable.durationMinutes,
      createdAt: lessonsTable.createdAt,
    })
    .from(lessonsTable)
    .leftJoin(subjectsTable, eq(lessonsTable.subjectId, subjectsTable.id))
    .where(conditions.length ? and(...conditions) : sql`true`);
  res.json(rows);
});

router.get("/lessons/:id", async (req: Request, res: Response) => {
  const [row] = await db
    .select({
      id: lessonsTable.id,
      title: lessonsTable.title,
      subjectId: lessonsTable.subjectId,
      subjectName: subjectsTable.name,
      serie: lessonsTable.serie,
      content: lessonsTable.content,
      summary: lessonsTable.summary,
      durationMinutes: lessonsTable.durationMinutes,
      createdAt: lessonsTable.createdAt,
    })
    .from(lessonsTable)
    .leftJoin(subjectsTable, eq(lessonsTable.subjectId, subjectsTable.id))
    .where(eq(lessonsTable.id, String(req.params.id)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.get("/exercises", async (req: Request, res: Response) => {
  const serie = req.query.serie as string | undefined;
  const subjectId = req.query.subjectId as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const conditions = [];
  if (serie) conditions.push(eq(exercisesTable.serie, serie));
  if (subjectId) conditions.push(eq(exercisesTable.subjectId, subjectId));
  if (difficulty) conditions.push(eq(exercisesTable.difficulty, difficulty));
  const rows = await db
    .select({
      id: exercisesTable.id,
      title: exercisesTable.title,
      subjectId: exercisesTable.subjectId,
      subjectName: subjectsTable.name,
      serie: exercisesTable.serie,
      difficulty: exercisesTable.difficulty,
      description: exercisesTable.description,
      questions: exercisesTable.questions,
    })
    .from(exercisesTable)
    .leftJoin(subjectsTable, eq(exercisesTable.subjectId, subjectsTable.id))
    .where(conditions.length ? and(...conditions) : sql`true`);
  res.json(rows);
});

router.get("/exercises/:id", async (req: Request, res: Response) => {
  const [row] = await db
    .select({
      id: exercisesTable.id,
      title: exercisesTable.title,
      subjectId: exercisesTable.subjectId,
      subjectName: subjectsTable.name,
      serie: exercisesTable.serie,
      difficulty: exercisesTable.difficulty,
      description: exercisesTable.description,
      questions: exercisesTable.questions,
    })
    .from(exercisesTable)
    .leftJoin(subjectsTable, eq(exercisesTable.subjectId, subjectsTable.id))
    .where(eq(exercisesTable.id, String(req.params.id)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.post("/exercises/:id/submit", requireAuth, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = SubmitExerciseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [exercise] = await db.select().from(exercisesTable).where(eq(exercisesTable.id, String(req.params.id))).limit(1);
  if (!exercise) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }
  const questions = exercise.questions as QcmQuestion[];
  let correct = 0;
  for (const q of questions) {
    const ans = parsed.data.answers.find((a) => a.questionId === q.id);
    if (ans && ans.optionId === q.correctOptionId) correct++;
  }
  const total = questions.length;
  const percentage = total ? Math.round((correct / total) * 100) : 0;

  const [result] = await db
    .insert(exerciseResultsTable)
    .values({ userId, exerciseId: exercise.id, score: correct, total, percentage })
    .returning();

  // Award score points = correct answers
  await db
    .update(profilesTable)
    .set({ score: sql`${profilesTable.score} + ${correct}` })
    .where(eq(profilesTable.userId, userId));

  res.json({
    id: result.id,
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    score: correct,
    total,
    percentage,
    createdAt: result.createdAt,
  });
});

router.get("/annals", async (req: Request, res: Response) => {
  const serie = req.query.serie as string | undefined;
  const yearStr = req.query.year as string | undefined;
  const subjectId = req.query.subjectId as string | undefined;
  const conditions = [];
  if (serie) conditions.push(eq(annalsTable.serie, serie));
  if (yearStr) conditions.push(eq(annalsTable.year, parseInt(yearStr, 10)));
  if (subjectId) conditions.push(eq(annalsTable.subjectId, subjectId));
  const rows = await db
    .select({
      id: annalsTable.id,
      title: annalsTable.title,
      serie: annalsTable.serie,
      year: annalsTable.year,
      subjectId: annalsTable.subjectId,
      subjectName: subjectsTable.name,
      pdfUrl: annalsTable.pdfUrl,
      isPremium: annalsTable.isPremium,
    })
    .from(annalsTable)
    .leftJoin(subjectsTable, eq(annalsTable.subjectId, subjectsTable.id))
    .where(conditions.length ? and(...conditions) : sql`true`)
    .orderBy(desc(annalsTable.year));
  res.json(rows);
});

router.get("/methodology", async (_req: Request, res: Response) => {
  const rows = await db.select().from(methodologyCardsTable);
  res.json(rows);
});

router.get("/ranking", async (req: Request, res: Response) => {
  const serie = req.query.serie as string | undefined;
  const rows = await db
    .select({
      userId: profilesTable.userId,
      fullName: profilesTable.fullName,
      email: profilesTable.email,
      score: profilesTable.score,
      serie: profilesTable.serie,
      isPremium: profilesTable.isPremium,
    })
    .from(profilesTable)
    .where(serie ? eq(profilesTable.serie, serie) : sql`true`)
    .orderBy(desc(profilesTable.score))
    .limit(50);
  res.json(
    rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      fullName: r.fullName || r.email.split("@")[0],
      score: r.score,
      serie: r.serie,
      isPremium: r.isPremium,
    })),
  );
});

export default router;

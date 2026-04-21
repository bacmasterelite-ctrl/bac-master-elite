import { Router, type IRouter, type Response } from "express";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "../lib/db";
import { profilesTable } from "@workspace/db/schema";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { AiChatBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `Tu es BAC TUTOR, un professeur expert pour les élèves de Terminale (séries A, C, D) au Bac africain.
Réponds toujours en français, de manière claire, structurée, pédagogique. Utilise des exemples concrets, des étapes numérotées,
et des formules quand utile. Sois encourageant.`;

router.post("/ai/chat", requireAuth, async (req, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  if (parsed.data.imageUrl && !profile?.isPremium) {
    res.status(403).json({ error: "L'analyse d'image est réservée aux membres Premium." });
    return;
  }

  type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
  type ChatMsg = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };

  const messages: ChatMsg[] = [{ role: "system", content: SYSTEM_PROMPT }];
  for (let i = 0; i < parsed.data.messages.length; i++) {
    const m = parsed.data.messages[i]!;
    const isLastUser = i === parsed.data.messages.length - 1 && m.role === "user";
    if (isLastUser && parsed.data.imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: m.content },
          { type: "image_url", image_url: { url: parsed.data.imageUrl } },
        ],
      });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
    });
    const reply = completion.choices[0]?.message?.content ?? "Désolé, pas de réponse.";
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ error: "AI request failed" });
  }
});

export default router;

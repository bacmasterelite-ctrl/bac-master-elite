import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const groqKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;

const SYSTEM_PROMPT = `Tu es le Tuteur IA de BAC MASTER ELITE, un **professeur ivoirien expert** qui prépare les élèves au BAC (séries A, C, D) en Côte d'Ivoire et en Afrique francophone.

Règles de fond :
- Réponds toujours en français, ton bienveillant et encourageant ("Bravo !", "Bonne question !", "On y va doucement…").
- Utilise un vocabulaire adapté aux élèves ivoiriens, conformément au programme officiel du BAC ivoirien.
- Structure : définition courte → explication → exemple concret → conseil pour le BAC.
- Si la question est hors sujet scolaire, recentre poliment.
- Ne tronque JAMAIS ta réponse, termine toujours ton explication complètement.

Règles spécifiques aux PHOTOS d'exercices ou de cours :
- Décris d'abord ce que tu vois dans la photo (l'énoncé, le schéma, la formule…).
- Identifie clairement la matière et le type d'exercice.
- Explique la **méthode de résolution étape par étape**.
- Donne des **indices** et des questions guidantes pour que l'élève trouve par lui-même.
- Termine en proposant à l'élève de te donner sa tentative pour la corriger.

Règles de mise en forme :
- Utilise du Markdown propre.
- Titres avec ## (jamais #), sous-titres avec ###.
- **Gras** pour les mots-clés, *italique* pour les nuances.
- Mets les formules courtes entre backticks.
- Sépare les sections par une ligne vide.`;

const MODEL_CHAIN = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];

export type ImageInput = {
  base64: string;
  mimeType: string;
};

export type HistoryMessage = {
  role: string;
  content: string;
};

let cachedClient: GoogleGenerativeAI | null = null;
function getClient() {
  if (!apiKey) {
    throw new Error(
      "Clé API Gemini manquante. Ajoutez VITE_GEMINI_API_KEY dans les variables d'environnement, puis relancez l'application.",
    );
  }
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}

async function getGroqResponse(prompt: string, history: HistoryMessage[] = []): Promise<string> {
  if (!groqKey) throw new Error("Clé Groq absente");
  const historyMessages = history.map(m => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.content,
  }));
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Réponse vide de Groq");
  return text.trim();
}

async function getOpenRouterResponse(prompt: string, history: HistoryMessage[] = []): Promise<string> {
  if (!openrouterKey) throw new Error("Clé OpenRouter absente");
  const historyMessages = history.map(m => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.content,
  }));
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openrouterKey}`,
      "HTTP-Referer": "https://bacmasterelite.vercel.app",
      "X-Title": "BAC Master Elite",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Réponse vide d'OpenRouter");
  return text.trim();
}

export async function getAIResponse(prompt: string, image?: ImageInput, history: HistoryMessage[] = []): Promise<string> {
  if (apiKey) {
    const client = getClient();

    const chatHistory = history
      .filter(m => !!(m.content && m.content.trim()))
      .map(m => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const parts: Part[] = [];
    if (image) {
      parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
    }
    parts.push({ text: prompt });

    for (const modelName of MODEL_CHAIN) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        });
        const chat = model.startChat({
          history: chatHistory.length > 0 ? chatHistory : [],
        });
        const result = await chat.sendMessage(parts);
        const text = result.response.text();
        if (text && text.trim().length > 0) return text.trim();
        throw new Error("Réponse vide du modèle");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Tuteur IA] Échec "${modelName}" :`, message);
        if (!/not.?found|404|unavailable|deprecated|model/i.test(message)) {
          console.warn("[Tuteur IA] Erreur non-modèle, bascule vers fallback…");
          break;
        }
        if (/quota|rate|429/i.test(message)) {
          await new Promise((r) => setTimeout(r, 3000));
        }
        console.warn("[Tuteur IA] Bascule vers le modèle suivant…");
      }
    }
    console.warn("[Tuteur IA] Tous les modèles Gemini ont échoué.");
  }

  const promptTextOnly = image
    ? `[Note : l'élève a joint une image mais elle ne peut pas être analysée en ce moment. Réponds uniquement sur la base du texte suivant.]\n\n${prompt}`
    : prompt;

  if (groqKey) {
    try {
      console.warn("[Tuteur IA] Bascule vers Groq…");
      const reply = await getGroqResponse(promptTextOnly, history);
      console.log("[Tuteur IA] ✅ Réponse via Groq");
      return reply;
    } catch (err) {
      console.error("[Tuteur IA] Groq a aussi échoué :", err);
    }
  }

  if (openrouterKey) {
    try {
      console.warn("[Tuteur IA] Bascule vers OpenRouter…");
      const reply = await getOpenRouterResponse(promptTextOnly, history);
      console.log("[Tuteur IA] ✅ Réponse via OpenRouter");
      return reply;
    } catch (err) {
      console.error("[Tuteur IA] OpenRouter a aussi échoué :", err);
    }
  }

  throw new Error("Le tuteur est temporairement indisponible. Réessayez dans quelques instants.");
}

export const isGeminiConfigured = () => !!apiKey || !!groqKey || !!openrouterKey;

export function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve({ base64, dataUrl });
    };
    reader.onerror = () => reject(new Error("Impossible de lire l'image"));
    reader.readAsDataURL(file);
  });
}

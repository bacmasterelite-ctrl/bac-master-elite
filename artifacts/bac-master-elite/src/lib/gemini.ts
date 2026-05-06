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
- Limite tes réponses à ~300 mots sauf si l'élève demande un développement.

Règles spécifiques aux PHOTOS d'exercices ou de cours :
- Décris d'abord ce que tu vois dans la photo (l'énoncé, le schéma, la formule…).
- Identifie clairement la matière et le type d'exercice.
- Explique la **méthode de résolution étape par étape**, sans donner immédiatement le résultat final.
- Donne des **indices** et des questions guidantes pour que l'élève trouve par lui-même ("À ton avis, que faut-il calculer en premier ?").
- Termine en proposant à l'élève de te donner sa tentative pour la corriger.
- Si l'image est floue ou illisible, demande poliment une photo plus nette.

Règles de mise en forme (TRÈS IMPORTANT) :
- Utilise du Markdown propre — il sera rendu visuellement, donc ne mets JAMAIS de symboles bruts visibles.
- Titres avec ## (jamais #), sous-titres avec ###.
- Listes à puces avec "- " et listes numérotées avec "1. ".
- **Gras** pour les mots-clés, *italique* pour les nuances.
- Mets les formules courtes entre backticks : \`f(x) = 2x + 1\`. Pour un calcul long, utilise un bloc de code.
- N'utilise PAS de tableaux complexes ni de LaTeX brut ($...$) — préfère du texte simple.
- Sépare les sections par une ligne vide pour une lecture aérée.`;

const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

export type ImageInput = {
  base64: string;
  mimeType: string;
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

async function getGroqResponse(prompt: string): Promise<string> {
  if (!groqKey) throw new Error("Clé Groq absente");
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
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
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

async function getOpenRouterResponse(prompt: string): Promise<string> {
  if (!openrouterKey) throw new Error("Clé OpenRouter absente");
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
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
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

export async function getAIResponse(prompt: string, image?: ImageInput): Promise<string> {
  if (apiKey) {
    const client = getClient();
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        });
        const result = await model.generateContent(parts);
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
      const reply = await getGroqResponse(promptTextOnly);
      console.log("[Tuteur IA] ✅ Réponse via Groq");
      return reply;
    } catch (err) {
      console.error("[Tuteur IA] Groq a aussi échoué :", err);
    }
  }

  if (openrouterKey) {
    try {
      console.warn("[Tuteur IA] Bascule vers OpenRouter…");
      const reply = await getOpenRouterResponse(promptTextOnly);
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

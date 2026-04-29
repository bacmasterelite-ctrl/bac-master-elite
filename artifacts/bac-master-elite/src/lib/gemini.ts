import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

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

// Models tried in order — all support vision (multimodal)
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

export type ImageInput = {
  /** Raw base64 (no data URL prefix) */
  base64: string;
  /** e.g. "image/png", "image/jpeg" */
  mimeType: string;
};

let cachedClient: GoogleGenerativeAI | null = null;
function getClient() {
  if (!apiKey) {
    console.error(
      "[Tuteur IA] VITE_GEMINI_API_KEY est ABSENTE du bundle. " +
        "Ajoutez VITE_GEMINI_API_KEY dans les Secrets de votre projet, " +
        "puis relancez l'application (les variables Vite sont injectées au build, pas au runtime).",
    );
    throw new Error(
      "Clé API Gemini manquante. Ajoutez VITE_GEMINI_API_KEY dans les variables d'environnement, puis relancez l'application.",
    );
  }
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}

export async function getAIResponse(prompt: string, image?: ImageInput): Promise<string> {
  const client = getClient();
  let lastError: unknown = null;

  const parts: Part[] = [];
  if (image) {
    parts.push({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    });
  }
  parts.push({ text: prompt });

  for (const modelName of MODEL_CHAIN) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });
      const result = await model.generateContent(parts);
      const text = result.response.text();
      if (text && text.trim().length > 0) return text.trim();
      throw new Error("Réponse vide du modèle");
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Tuteur IA] Échec du modèle "${modelName}" :`,
        { message, hasImage: !!image, promptLen: prompt.length, raw: err },
      );
      if (!/not.?found|404|unavailable|deprecated|model/i.test(message)) {
        throw new Error(humanizeError(message));
      }
      console.warn(`[Tuteur IA] Bascule vers le modèle suivant…`);
    }
  }

  console.error("[Tuteur IA] Tous les modèles Gemini ont échoué.", lastError);
  throw new Error(humanizeError(lastError instanceof Error ? lastError.message : "Erreur inconnue"));
}

function humanizeError(raw: string): string {
  if (/api.?key|API_KEY_INVALID|permission/i.test(raw)) {
    return "Clé API Gemini invalide ou expirée. Vérifiez VITE_GEMINI_API_KEY.";
  }
  if (/quota|rate|429/i.test(raw)) {
    return "Limite Gemini atteinte. Patientez quelques secondes puis réessayez.";
  }
  if (/network|fetch|failed to fetch/i.test(raw)) {
    return "Connexion à Gemini impossible. Vérifiez votre connexion internet.";
  }
  if (/image|inline.?data|mime/i.test(raw)) {
    return "Image non supportée. Utilisez un format JPG, PNG ou WebP de moins de 4 Mo.";
  }
  return `Erreur Gemini : ${raw}`;
}

export const isGeminiConfigured = () => !!apiKey;

/** Convert a File to base64 (without the `data:...;base64,` prefix). */
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

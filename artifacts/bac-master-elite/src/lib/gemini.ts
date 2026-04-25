import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const SYSTEM_PROMPT = `Tu es le Tuteur IA de BAC MASTER ELITE, une plateforme de préparation au BAC pour les élèves d'Afrique francophone (séries A, C, D).

Règles de fond :
- Réponds toujours en français, de façon claire et pédagogique.
- Structure tes réponses : définition courte, explication, exemple concret, conseil pour le BAC.
- Sois encourageant et bienveillant.
- Si la question est hors sujet scolaire, recentre poliment.
- Limite tes réponses à ~300 mots sauf si l'élève demande un développement.

Règles de mise en forme (TRÈS IMPORTANT) :
- Utilise du Markdown propre — il sera rendu visuellement, donc ne mets JAMAIS de symboles bruts visibles.
- Titres avec ## (jamais #), sous-titres avec ###.
- Listes à puces avec "- " et listes numérotées avec "1. ".
- **Gras** pour les mots-clés, *italique* pour les nuances.
- Mets les formules courtes entre backticks : \`f(x) = 2x + 1\`. Pour un calcul long, utilise un bloc de code.
- N'utilise PAS de tableaux complexes ni de LaTeX brut ($...$) — préfère du texte simple.
- Sépare les sections par une ligne vide pour une lecture aérée.`;

// Models tried in order — fall back if the first is unavailable
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

let cachedClient: GoogleGenerativeAI | null = null;
function getClient() {
  if (!apiKey) {
    throw new Error(
      "Clé API Gemini manquante. Ajoutez VITE_GEMINI_API_KEY dans les variables d'environnement.",
    );
  }
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}

export async function getAIResponse(prompt: string): Promise<string> {
  const client = getClient();
  let lastError: unknown = null;

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
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text && text.trim().length > 0) return text.trim();
      throw new Error("Réponse vide du modèle");
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      // Try the next model only on availability/not-found errors
      if (!/not.?found|404|unavailable|deprecated|model/i.test(message)) {
        throw new Error(humanizeError(message));
      }
      // else continue with next model
    }
  }

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
  return `Erreur Gemini : ${raw}`;
}

export const isGeminiConfigured = () => !!apiKey;

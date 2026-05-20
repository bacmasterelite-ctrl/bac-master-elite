import { supabase } from "@/lib/supabase";

export type Difficulty = "facile" | "moyen" | "difficile" | "extreme";

export type QuizQuestion = {
  id: string;
  lesson_id?: string;
  subject: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
  difficulty?: Difficulty;
  points: number;
};

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; questions: number; timePerQ: number; pointsPerCorrect: number; color: string; emoji: string; bg: string; border: string }
> = {
  facile:    { label: "Facile",    questions: 5,  timePerQ: 60, pointsPerCorrect: 5,  color: "text-emerald-600", emoji: "🟢", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-400" },
  moyen:     { label: "Moyen",     questions: 8,  timePerQ: 45, pointsPerCorrect: 10, color: "text-blue-600",    emoji: "🔵", bg: "bg-blue-50 dark:bg-blue-950/30",       border: "border-blue-400"    },
  difficile: { label: "Difficile", questions: 10, timePerQ: 30, pointsPerCorrect: 15, color: "text-orange-600",  emoji: "🟠", bg: "bg-orange-50 dark:bg-orange-950/30",   border: "border-orange-400"  },
  extreme:   { label: "Extrême",   questions: 12, timePerQ: 20, pointsPerCorrect: 25, color: "text-rose-600",    emoji: "🔴", bg: "bg-rose-50 dark:bg-rose-950/30",       border: "border-rose-400"    },
};

export const POINTS_PER_CORRECT = 10;

// Fallback local (anciennes questions) si Supabase est vide
const LOCAL_QUESTIONS: Record<"A" | "C" | "D", QuizQuestion[]> = {
  A: [
    { id:"A-philo-1", subject:"Philosophie", question:"Quel philosophe a écrit \"Je pense, donc je suis\" ?", choices:["Platon","Descartes","Kant","Sartre"], correctIndex:1, explanation:"Cogito, ergo sum — René Descartes, 1637.", points:10 },
    { id:"A-fr-1",    subject:"Français",    question:"Qui est l'auteur de \"Les Misérables\" ?",             choices:["Zola","Victor Hugo","Flaubert","Balzac"],  correctIndex:1, points:10 },
    { id:"A-hist-1",  subject:"Histoire-Géo",question:"En quelle année la Côte d'Ivoire a-t-elle obtenu son indépendance ?", choices:["1958","1960","1962","1966"], correctIndex:1, explanation:"7 août 1960 sous Houphouët-Boigny.", points:10 },
    { id:"A-ang-1",   subject:"Anglais",     question:"What is the past tense of \"to go\" ?",                choices:["goed","gone","went","going"],              correctIndex:2, points:10 },
    { id:"A-litt-1",  subject:"Littérature", question:"À quel mouvement appartient Léopold Sédar Senghor ?",  choices:["Surréalisme","La négritude","Romantisme","Naturalisme"], correctIndex:1, points:10 },
  ],
  C: [
    { id:"C-math-1", subject:"Mathématiques",question:"Quelle est la dérivée de f(x) = x³ ?",      choices:["3x","x²","3x²","x³/3"], correctIndex:2, explanation:"(xⁿ)'=n·xⁿ⁻¹", points:10 },
    { id:"C-phy-1",  subject:"Physique",     question:"Unité SI de la force ?",                     choices:["Joule","Watt","Newton","Pascal"],         correctIndex:2, points:10 },
    { id:"C-chim-1", subject:"Chimie",       question:"pH d'une solution neutre à 25°C ?",          choices:["0","7","10","14"],                        correctIndex:1, points:10 },
    { id:"C-math-2", subject:"Mathématiques",question:"Valeur de cos(π/3) ?",                       choices:["0","1/2","√3/2","1"],                     correctIndex:1, points:10 },
    { id:"C-svt-1",  subject:"SVT",          question:"Molécule portant l'information génétique ?", choices:["ATP","ADN","Glucose","Hémoglobine"],       correctIndex:1, points:10 },
  ],
  D: [
    { id:"D-svt-1",  subject:"SVT",          question:"Chromosomes d'une cellule humaine somatique ?", choices:["23","44","46","48"],         correctIndex:2, explanation:"23 paires = 46 chromosomes.", points:10 },
    { id:"D-chim-1", subject:"Chimie",       question:"Symbole chimique du sodium ?",                  choices:["So","Sd","Na","S"],          correctIndex:2, points:10 },
    { id:"D-phy-1",  subject:"Physique",     question:"Valeur de g (pesanteur) ?",                     choices:["1,8","9,8","98","0,98"],     correctIndex:1, points:10 },
    { id:"D-math-1", subject:"Mathématiques",question:"Solution de 2x + 6 = 0 ?",                      choices:["x=3","x=-3","x=6","x=-6"],   correctIndex:1, points:10 },
    { id:"D-philo-1",subject:"Philosophie",  question:"Pour Sartre, \"l'existence précède...\" ?",     choices:["la pensée","l'essence","la morale","la liberté"], correctIndex:1, points:10 },
  ],
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── Récupère questions depuis Supabase selon leçon + niveau ──────────────────
export async function getQuizFromSupabase(
  lessonId: string,
  difficulty: Difficulty,
): Promise<QuizQuestion[]> {
  const config = DIFFICULTY_CONFIG[difficulty];
  const { data, error } = await supabase
    .from("lesson_quiz_questions")
    .select("id, lesson_id, question, options, correct_answer, explanation, difficulty, points")
    .eq("lesson_id", lessonId)
    .eq("difficulty", difficulty);

  if (error || !data || data.length === 0) return [];

  const shuffled = shuffle(data).slice(0, config.questions);
  return shuffled.map((row) => ({
    id: row.id,
    lesson_id: row.lesson_id,
    subject: "",
    question: row.question,
    choices: Array.isArray(row.options) ? row.options : Object.values(row.options as Record<string, string>),
    correctIndex: row.correct_answer,
    explanation: row.explanation ?? undefined,
    difficulty: row.difficulty as Difficulty,
    points: row.points ?? config.pointsPerCorrect,
  }));
}

// ── Fallback local par série (rétrocompatibilité) ─────────────────────────────
export const getQuizForSerie = (
  serie: string | null | undefined,
  count = 5,
  difficulty: Difficulty = "facile",
): QuizQuestion[] => {
  const key = (serie ?? "D").toUpperCase() as "A" | "C" | "D";
  const pool = LOCAL_QUESTIONS[key] ?? LOCAL_QUESTIONS.D;
  const pts = DIFFICULTY_CONFIG[difficulty].pointsPerCorrect;
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((q) => ({ ...q, points: pts }));
};

// ── Leçons disponibles par série ──────────────────────────────────────────────
export async function getLessonsForSerie(serie: string): Promise<
  { id: string; title: string; subject: string }[]
> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, subject, serie")
    .or(`serie.eq.${serie},serie.like.%${serie}%,serie.eq.A/C/D`)
    .order("subject")
    .order("title");

  if (error || !data) return [];
  return data as { id: string; title: string; subject: string }[];
}

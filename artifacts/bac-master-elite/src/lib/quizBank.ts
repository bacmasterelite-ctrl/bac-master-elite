export type QuizQuestion = {
  id: string;
  subject: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

const QUESTIONS: Record<"A" | "C" | "D", QuizQuestion[]> = {
  A: [
    {
      id: "A-philo-1",
      subject: "Philosophie",
      question: "Quel philosophe a écrit \"Je pense, donc je suis\" ?",
      choices: ["Platon", "Descartes", "Kant", "Sartre"],
      correctIndex: 1,
      explanation: "Cogito, ergo sum est une formule de René Descartes (Discours de la méthode, 1637).",
    },
    {
      id: "A-fr-1",
      subject: "Français",
      question: "Qui est l'auteur de \"Les Misérables\" ?",
      choices: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Honoré de Balzac"],
      correctIndex: 1,
      explanation: "Victor Hugo a publié Les Misérables en 1862.",
    },
    {
      id: "A-fr-2",
      subject: "Français",
      question: "Quelle figure de style consiste à comparer sans outil de comparaison ?",
      choices: ["Comparaison", "Métaphore", "Antithèse", "Personnification"],
      correctIndex: 1,
    },
    {
      id: "A-hist-1",
      subject: "Histoire-Géo",
      question: "En quelle année la Côte d'Ivoire a-t-elle obtenu son indépendance ?",
      choices: ["1958", "1960", "1962", "1966"],
      correctIndex: 1,
      explanation: "Le 7 août 1960, sous la présidence de Félix Houphouët-Boigny.",
    },
    {
      id: "A-hist-2",
      subject: "Histoire-Géo",
      question: "Quelle organisation a remplacé la SDN après la 2e Guerre mondiale ?",
      choices: ["L'Union européenne", "L'ONU", "L'OTAN", "L'OMC"],
      correctIndex: 1,
    },
    {
      id: "A-ang-1",
      subject: "Anglais",
      question: "What is the past tense of \"to go\" ?",
      choices: ["goed", "gone", "went", "going"],
      correctIndex: 2,
    },
    {
      id: "A-philo-2",
      subject: "Philosophie",
      question: "Pour Kant, l'impératif catégorique commande d'agir selon une maxime que l'on peut...",
      choices: [
        "garder secrète",
        "ériger en loi universelle",
        "appliquer aux autres seulement",
        "négocier au cas par cas",
      ],
      correctIndex: 1,
    },
    {
      id: "A-litt-1",
      subject: "Littérature",
      question: "À quel mouvement littéraire appartient Léopold Sédar Senghor ?",
      choices: ["Le surréalisme", "La négritude", "Le romantisme", "Le naturalisme"],
      correctIndex: 1,
    },
  ],
  C: [
    {
      id: "C-math-1",
      subject: "Mathématiques",
      question: "Quelle est la dérivée de f(x) = x³ ?",
      choices: ["3x", "x²", "3x²", "x³/3"],
      correctIndex: 2,
      explanation: "(xⁿ)' = n·xⁿ⁻¹, donc (x³)' = 3x².",
    },
    {
      id: "C-math-2",
      subject: "Mathématiques",
      question: "Quelle est la valeur de cos(π/3) ?",
      choices: ["0", "1/2", "√3/2", "1"],
      correctIndex: 1,
    },
    {
      id: "C-math-3",
      subject: "Mathématiques",
      question: "L'intégrale ∫ 2x dx (sans constante) vaut...",
      choices: ["x²", "2", "x", "x²/2"],
      correctIndex: 0,
    },
    {
      id: "C-phy-1",
      subject: "Physique",
      question: "Quelle est l'unité du Système international pour la force ?",
      choices: ["Joule", "Watt", "Newton", "Pascal"],
      correctIndex: 2,
    },
    {
      id: "C-phy-2",
      subject: "Physique",
      question: "La loi d'Ohm relie U, I et R par...",
      choices: ["U = R/I", "U = R·I", "U = I/R", "U = R + I"],
      correctIndex: 1,
    },
    {
      id: "C-chim-1",
      subject: "Chimie",
      question: "Quel est le pH d'une solution neutre à 25°C ?",
      choices: ["0", "7", "10", "14"],
      correctIndex: 1,
    },
    {
      id: "C-chim-2",
      subject: "Chimie",
      question: "La masse molaire de l'eau (H₂O) est environ...",
      choices: ["10 g/mol", "16 g/mol", "18 g/mol", "32 g/mol"],
      correctIndex: 2,
    },
    {
      id: "C-svt-1",
      subject: "SVT",
      question: "Quelle molécule porte l'information génétique ?",
      choices: ["L'ATP", "L'ADN", "Le glucose", "L'hémoglobine"],
      correctIndex: 1,
    },
    {
      id: "C-philo-1",
      subject: "Philosophie",
      question: "Le fondateur de la phénoménologie est...",
      choices: ["Husserl", "Hegel", "Nietzsche", "Bergson"],
      correctIndex: 0,
    },
  ],
  D: [
    {
      id: "D-svt-1",
      subject: "SVT",
      question: "Combien de chromosomes possède une cellule humaine somatique ?",
      choices: ["23", "44", "46", "48"],
      correctIndex: 2,
      explanation: "23 paires soit 46 chromosomes au total.",
    },
    {
      id: "D-svt-2",
      subject: "SVT",
      question: "La photosynthèse a lieu principalement dans...",
      choices: ["Les mitochondries", "Le noyau", "Les chloroplastes", "Les ribosomes"],
      correctIndex: 2,
    },
    {
      id: "D-svt-3",
      subject: "SVT",
      question: "Le gaz produit par la photosynthèse est...",
      choices: ["Le CO₂", "Le N₂", "L'O₂", "Le H₂"],
      correctIndex: 2,
    },
    {
      id: "D-chim-1",
      subject: "Chimie",
      question: "Quel est le symbole chimique du sodium ?",
      choices: ["So", "Sd", "Na", "S"],
      correctIndex: 2,
    },
    {
      id: "D-chim-2",
      subject: "Chimie",
      question: "Une réaction acide-base produit...",
      choices: ["Du sel et de l'eau", "Uniquement de l'eau", "Un gaz inerte", "Un métal"],
      correctIndex: 0,
    },
    {
      id: "D-phy-1",
      subject: "Physique",
      question: "L'accélération de la pesanteur g vaut environ...",
      choices: ["1,8 m/s²", "9,8 m/s²", "98 m/s²", "0,98 m/s²"],
      correctIndex: 1,
    },
    {
      id: "D-math-1",
      subject: "Mathématiques",
      question: "Quelle est la solution de l'équation 2x + 6 = 0 ?",
      choices: ["x = 3", "x = -3", "x = 6", "x = -6"],
      correctIndex: 1,
    },
    {
      id: "D-math-2",
      subject: "Mathématiques",
      question: "ln(e) vaut...",
      choices: ["0", "1", "e", "10"],
      correctIndex: 1,
    },
    {
      id: "D-philo-1",
      subject: "Philosophie",
      question: "Pour Sartre, \"l'existence précède...\"",
      choices: ["la pensée", "l'essence", "la morale", "la liberté"],
      correctIndex: 1,
    },
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

export const getQuizForSerie = (
  serie: string | null | undefined,
  count = 5,
): QuizQuestion[] => {
  const key = (serie ?? "D").toUpperCase() as "A" | "C" | "D";
  const pool = QUESTIONS[key] ?? QUESTIONS.D;
  return shuffle(pool).slice(0, Math.min(count, pool.length));
};

export const POINTS_PER_CORRECT = 10;

import { db } from "../lib/db";
import {
  subjectsTable,
  lessonsTable,
  exercisesTable,
  annalsTable,
  methodologyCardsTable,
} from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const subjectsBySerie = {
  A: [
    { name: "Philosophie", slug: "philosophie-a", color: "#6366f1" },
    { name: "Français", slug: "francais-a", color: "#ec4899" },
    { name: "Histoire-Géo", slug: "histgeo-a", color: "#f59e0b" },
    { name: "Anglais", slug: "anglais-a", color: "#10b981" },
  ],
  C: [
    { name: "Mathématiques", slug: "maths-c", color: "#3b82f6" },
    { name: "Physique-Chimie", slug: "pc-c", color: "#8b5cf6" },
    { name: "Sciences Naturelles", slug: "svt-c", color: "#10b981" },
    { name: "Philosophie", slug: "philosophie-c", color: "#6366f1" },
  ],
  D: [
    { name: "Mathématiques", slug: "maths-d", color: "#3b82f6" },
    { name: "Sciences Naturelles", slug: "svt-d", color: "#10b981" },
    { name: "Physique-Chimie", slug: "pc-d", color: "#8b5cf6" },
    { name: "Philosophie", slug: "philosophie-d", color: "#6366f1" },
  ],
};

const lessonTemplates = [
  {
    title: "Introduction au chapitre",
    summary: "Présentation des concepts fondamentaux du chapitre avec exemples.",
    content: `# Introduction\n\nCe chapitre vous présente les bases essentielles à maîtriser pour le BAC.\n\n## Objectifs\n- Comprendre les notions clés\n- Savoir les appliquer\n- S'entraîner sur des exercices types\n\n## Plan\n1. Définitions\n2. Méthodes\n3. Exemples résolus\n4. À retenir`,
    durationMinutes: 25,
  },
  {
    title: "Méthodes et techniques",
    summary: "Approfondissement des techniques de résolution.",
    content: `# Méthodes\n\nApplication des techniques avec des cas pratiques.\n\n## Étape 1\nIdentifier le problème.\n\n## Étape 2\nChoisir la méthode adaptée.\n\n## Étape 3\nRédiger une réponse claire.`,
    durationMinutes: 35,
  },
  {
    title: "Approfondissement",
    summary: "Notions avancées et préparation au sujet du BAC.",
    content: `# Approfondissement\n\nNous allons aborder des problèmes typiques du BAC.\n\n## Exercices types\n- Type 1 : application directe\n- Type 2 : raisonnement\n- Type 3 : synthèse`,
    durationMinutes: 45,
  },
];

function makeQuestion(i: number, prompt: string, options: string[], correctIdx: number, explanation: string) {
  const opts = options.map((t, j) => ({ id: `q${i}o${j}`, text: t }));
  return {
    id: `q${i}`,
    prompt,
    options: opts,
    correctOptionId: opts[correctIdx]!.id,
    explanation,
  };
}

const exerciseTemplates = [
  {
    title: "QCM d'application",
    difficulty: "facile" as const,
    description: "Exercice d'application directe pour valider les acquis.",
    questions: [
      makeQuestion(1, "Quelle est la définition correcte ?", ["Réponse A", "Réponse B (correcte)", "Réponse C", "Réponse D"], 1, "La réponse B est la définition standard."),
      makeQuestion(2, "Quel résultat obtient-on dans ce cas ?", ["Résultat 1 (correct)", "Résultat 2", "Résultat 3", "Résultat 4"], 0, "Application directe de la formule."),
      makeQuestion(3, "Quelle méthode utiliser ?", ["Méthode A", "Méthode B", "Méthode C (correcte)", "Méthode D"], 2, "La méthode C est adaptée à ce type de problème."),
    ],
  },
  {
    title: "QCM raisonnement",
    difficulty: "moyen" as const,
    description: "Exercice nécessitant du raisonnement et plusieurs étapes.",
    questions: [
      makeQuestion(1, "Quelle hypothèse peut-on formuler ?", ["Hypothèse A", "Hypothèse B (correcte)", "Hypothèse C"], 1, "B découle logiquement des données."),
      makeQuestion(2, "Quelle est la conclusion ?", ["Conclusion 1", "Conclusion 2 (correcte)", "Conclusion 3"], 1, "On démontre par déduction."),
      makeQuestion(3, "Quel concept s'applique ?", ["Concept X (correct)", "Concept Y", "Concept Z"], 0, "Le concept X est central ici."),
      makeQuestion(4, "Quelle est l'unité ?", ["m/s", "kg (correct)", "N", "J"], 1, "L'unité internationale est le kilogramme."),
    ],
  },
  {
    title: "Sujet type BAC",
    difficulty: "difficile" as const,
    description: "Exercice complet de niveau BAC.",
    questions: [
      makeQuestion(1, "Question de synthèse — quelle proposition est correcte ?", ["A", "B", "C (correcte)", "D"], 2, "Synthèse complète."),
      makeQuestion(2, "Cas particulier — quelle solution ?", ["Solution 1", "Solution 2", "Solution 3 (correcte)"], 2, "Cas limite à connaître."),
      makeQuestion(3, "Démonstration — quelle étape ?", ["Étape A (correcte)", "Étape B", "Étape C", "Étape D"], 0, "C'est l'étape clé."),
    ],
  },
];

const methodologyCards = [
  {
    title: "Comment réussir une dissertation",
    slug: "dissertation",
    summary: "Structurer une dissertation en 3 parties claires.",
    content: "# Méthode\n\n1. Analyse du sujet (10 min)\n2. Brainstorming (10 min)\n3. Plan détaillé (15 min)\n4. Rédaction (2h)\n5. Relecture (15 min)\n\n## Astuce\nToujours définir les termes du sujet avant de commencer.",
    icon: "PenTool",
  },
  {
    title: "Méthode du commentaire composé",
    slug: "commentaire",
    summary: "Analyser un texte en deux ou trois axes structurés.",
    content: "# Étapes\n\n1. Lecture active du texte\n2. Identification des thèmes\n3. Choix des axes (2 ou 3)\n4. Sous-parties + citations\n5. Conclusion d'ouverture",
    icon: "BookOpen",
  },
  {
    title: "Résoudre un problème de maths",
    slug: "problemes-maths",
    summary: "Méthode universelle pour aborder un problème mathématique.",
    content: "# Méthode\n\n1. Lire l'énoncé deux fois\n2. Identifier les données et l'inconnue\n3. Faire un schéma si possible\n4. Choisir la méthode\n5. Calculs propres\n6. Vérification du résultat",
    icon: "Calculator",
  },
  {
    title: "Préparer une expérience en SVT/PC",
    slug: "experience-sciences",
    summary: "Démarche scientifique : observation, hypothèse, expérience, conclusion.",
    content: "# Démarche scientifique\n\n1. **Observation**\n2. **Problème**\n3. **Hypothèse**\n4. **Expérience**\n5. **Résultats**\n6. **Conclusion**",
    icon: "FlaskConical",
  },
  {
    title: "Gestion du temps en examen",
    slug: "gestion-temps",
    summary: "Planifier ses révisions et son temps le jour J.",
    content: "# Avant l'examen\n- Réviser par fiches\n- Faire des annales chronométrées\n\n# Le jour J\n- Lire tous les sujets\n- Commencer par le plus facile\n- Garder 15 min pour relire",
    icon: "Clock",
  },
  {
    title: "Mémoriser efficacement",
    slug: "memorisation",
    summary: "Techniques de mémorisation à long terme.",
    content: "# Techniques\n\n- **Cartes mentales**\n- **Répétition espacée**\n- **Enseigner à un camarade**\n- **Fiches résumées**\n\n## Conseil\nRéviser une notion 1 jour, 3 jours, 7 jours, 21 jours après.",
    icon: "Brain",
  },
];

async function main() {
  // Skip if already seeded
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(subjectsTable);
  if ((c ?? 0) > 0) {
    console.log("Already seeded — skipping");
    return;
  }

  for (const serie of ["A", "C", "D"] as const) {
    for (const subj of subjectsBySerie[serie]) {
      const [s] = await db
        .insert(subjectsTable)
        .values({ name: subj.name, slug: subj.slug, color: subj.color, serie, description: `Cours et exercices de ${subj.name} — Série ${serie}` })
        .returning();

      for (const lt of lessonTemplates) {
        await db.insert(lessonsTable).values({
          title: `${lt.title} — ${subj.name}`,
          subjectId: s.id,
          serie,
          content: lt.content,
          summary: lt.summary,
          durationMinutes: lt.durationMinutes,
        });
      }

      for (const et of exerciseTemplates) {
        await db.insert(exercisesTable).values({
          title: `${et.title} — ${subj.name}`,
          subjectId: s.id,
          serie,
          difficulty: et.difficulty,
          description: et.description,
          questions: et.questions,
        });
      }

      for (const year of [2024, 2023, 2022]) {
        await db.insert(annalsTable).values({
          title: `BAC ${year} ${serie} — ${subj.name}`,
          serie,
          year,
          subjectId: s.id,
          pdfUrl: `https://example.com/annals/${serie.toLowerCase()}-${subj.slug}-${year}.pdf`,
          isPremium: year < 2024,
        });
      }
    }
  }

  for (const card of methodologyCards) {
    await db.insert(methodologyCardsTable).values(card);
  }

  console.log("Seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

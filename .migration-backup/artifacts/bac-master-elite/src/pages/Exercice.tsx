import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, CheckCircle2, Clock, Eye, Loader2, PenLine, Star } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useExercises, type Exercise } from "@/lib/queries";

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

const difficultyColor: Record<string, string> = {
  facile: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  moyen: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  difficile: "bg-rose-500/10 text-rose-700 border-rose-500/20",
};

export default function Exercice() {
  const params = useParams<{ id: string }>();
  const exerciseId = params.id;
  const { data: exercises = [], isLoading } = useExercises();
  const [showSolution, setShowSolution] = useState(false);

  const exercise = useMemo<Exercise | undefined>(
    () => exercises.find((e) => String(e.id) === String(exerciseId)),
    [exercises, exerciseId],
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!exercise) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Exercice introuvable</h1>
          <p className="text-sm text-muted-foreground">
            Cet exercice n'existe plus ou n'est pas accessible avec votre série actuelle.
          </p>
          <Link href="/dashboard/exercices">
            <Button className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux exercices
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const r = exercise as Record<string, unknown>;
  const title = pickString(r, "titre", "title") || "Exercice";
  const subject = pickString(r, "matiere", "subject") || "Général";
  const difficulty = (pickString(r, "difficulty", "difficulte") || "Moyen").toLowerCase();
  const points = pickNumber(r, "points") ?? 10;
  const duration = pickString(r, "duration", "duree") || "15 min";
  const statement = pickString(r, "enonce", "statement", "question", "consigne", "description");
  const solution = pickString(r, "corrige", "correction", "solution", "answer", "reponse");

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/exercices">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tous les exercices
            </Button>
          </Link>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              difficultyColor[difficulty] ?? difficultyColor.moyen
            }`}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{subject}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~{duration}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              {points} pts
            </span>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <PenLine className="h-4 w-4" />
              Énoncé
            </h2>
            {statement ? (
              <article className="prose prose-sm max-w-none dark:prose-invert sm:prose-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{statement}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">
                L'énoncé détaillé de cet exercice sera bientôt disponible.
              </p>
            )}
          </div>

          <div className="mt-8">
            {showSolution ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Corrigé détaillé
                </h2>
                {solution ? (
                  <article className="prose prose-sm max-w-none dark:prose-invert sm:prose-base">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{solution}</ReactMarkdown>
                  </article>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Le corrigé sera publié prochainement.
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 rounded-full"
                  onClick={() => setShowSolution(false)}
                >
                  Masquer le corrigé
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowSolution(true)}
                className="w-full rounded-full bg-hero-gradient text-white hover:opacity-90 sm:w-auto"
                data-testid="button-show-solution"
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir le corrigé
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

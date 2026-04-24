import { motion } from "framer-motion";
import { PenLine, CheckCircle2, Clock, ArrowRight, Star } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useExercises } from "@/lib/queries";

const fallback = [
  { titre: "Étude d'une fonction polynôme", matiere: "Mathématiques", difficulty: "Moyen", done: true, points: 15 },
  { titre: "Réaction acide-base", matiere: "Chimie", difficulty: "Difficile", done: false, points: 20 },
  { titre: "Génétique — croisements", matiere: "SVT", difficulty: "Moyen", done: true, points: 12 },
  { titre: "Dissertation — La conscience", matiere: "Philosophie", difficulty: "Difficile", done: false, points: 25 },
  { titre: "Chute libre", matiere: "Physique", difficulty: "Facile", done: true, points: 8 },
  { titre: "Le poète et la modernité", matiere: "Français", difficulty: "Moyen", done: false, points: 15 },
];

const difficultyColor: Record<string, string> = {
  Facile: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  Moyen: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Difficile: "bg-rose-500/10 text-rose-700 border-rose-500/20",
};

export default function Exercices() {
  const { data: exercises = [], isLoading } = useExercises();

  const items =
    exercises.length > 0
      ? exercises.map((e) => {
          const r = e as Record<string, unknown>;
          return {
            titre: (r.title as string) ?? (r.titre as string) ?? "Exercice",
            matiere: (r.subject as string) ?? (r.matiere as string) ?? "Général",
            difficulty: (r.difficulty as string) ?? (r.difficulte as string) ?? "Moyen",
            done: Boolean(r.completed ?? r.done ?? false),
            points: (r.points as number) ?? 10,
          };
        })
      : fallback;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Entraînement</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Exercices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plus de 1 000 exercices corrigés, classés par difficulté et matière.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((ex, i) => (
              <motion.div
                key={ex.titre + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm hover-elevate sm:flex-row sm:items-center"
                data-testid={`card-exercise-${i}`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${ex.done ? "bg-emerald-500/15 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
                  {ex.done ? <CheckCircle2 className="h-5 w-5" /> : <PenLine className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{ex.titre}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyColor[ex.difficulty] ?? difficultyColor.Moyen}`}>
                      {ex.difficulty}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{ex.matiere}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~15 min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      {ex.points} pts
                    </span>
                  </div>
                </div>
                <Button size="sm" variant={ex.done ? "outline" : "default"} className={ex.done ? "" : "bg-hero-gradient text-white hover:opacity-90"}>
                  {ex.done ? "Revoir" : "Commencer"}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

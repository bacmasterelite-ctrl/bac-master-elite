import { motion } from "framer-motion";
import { Link } from "wouter";
import { PenLine, CheckCircle2, Clock, ArrowRight, Star } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useExercises, useProfile } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";

type DisplayItem = {
  id: string | null;
  titre: string;
  matiere: string;
  difficulty: string;
  done: boolean;
  points: number;
};

const difficultyColor: Record<string, string> = {
  Facile: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  Moyen: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Difficile: "bg-rose-500/10 text-rose-700 border-rose-500/20",
};

export default function Exercices() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: exercises = [], isLoading } = useExercises();

  const serie = (profile?.serie ?? "D").toUpperCase();

  const items: DisplayItem[] = exercises
    .filter((e) => {
      const r = e as Record<string, unknown>;
      const lessonSerie = ((r.serie as string) ?? "").toUpperCase();
      return !lessonSerie || lessonSerie.includes(serie);
    })
    .map((e) => {
      const r = e as Record<string, unknown>;
      return {
        id: r.id != null ? String(r.id) : null,
        titre: (r.title as string) ?? (r.titre as string) ?? "Exercice",
        matiere: (r.subject as string) ?? (r.matiere as string) ?? "General",
        difficulty: (r.difficulty as string) ?? (r.difficulte as string) ?? "Moyen",
        done: Boolean(r.completed ?? r.done ?? false),
        points: (r.points as number) ?? 10,
      };
    });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Entrainement</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Exercices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Exercices corriges, classes par difficulte et matiere.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">Aucun exercice trouve.</p>
        ) : (
          <div className="grid gap-3">
            {items.map((ex, i) => {
              const ctaLabel = ex.done ? "Revoir" : "Commencer";
              const ctaClasses = ex.done
                ? "border border-border bg-background text-foreground"
                : "bg-hero-gradient text-white";
              const inner = (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
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
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />~15 min</span>
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" />{ex.points} pts</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center justify-center gap-1 rounded-full px-4 py-2 text-xs font-semibold ${ctaClasses}`}>
                    {ctaLabel}<ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </motion.div>
              );

              if (!ex.id) return <div key={ex.titre + i} className="opacity-80">{inner}</div>;

              return (
                <Link key={ex.id} href={`/dashboard/exercice/${ex.id}`} className="block">
                  {inner}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { PenLine, CheckCircle2, Clock, ArrowRight, Star, BookOpen, ChevronLeft } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useExercises, useProfile } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { subjectsForSerie, styleForSubject } from "@/lib/subjects";

const difficultyColor: Record<string, string> = {
  facile: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  moyen: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  difficile: "bg-rose-500/10 text-rose-700 border-rose-500/20",
};

export default function Exercices() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: exercises = [], isLoading } = useExercises();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Tous les exercices filtrés par série
  const allItems = useMemo(() => {
    return exercises
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
          matiere: (r.subject as string) ?? (r.matiere as string) ?? "Général",
          difficulty: ((r.difficulty as string) ?? (r.difficulte as string) ?? "Moyen").toLowerCase(),
          done: Boolean(r.completed ?? r.done ?? false),
          points: (r.points as number) ?? 10,
        };
      });
  }, [exercises, serie]);

  // Nombre d'exercices par matière
  const countBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    allItems.forEach((ex) => {
      const mat = ex.matiere;
      map[mat] = (map[mat] ?? 0) + 1;
    });
    return map;
  }, [allItems]);

  // Exercices de la matière active
  const filteredItems = useMemo(() => {
    if (!activeSubject) return [];
    return allItems.filter((ex) =>
      normalize(ex.matiere).includes(normalize(activeSubject)) ||
      normalize(activeSubject).includes(normalize(ex.matiere))
    );
  }, [allItems, activeSubject]);

  // Vue matières
  if (!activeSubject) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Entraînement</p>
            <h1 className="mt-1 text-2xl font-bold">Exercices — Série {serie}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choisissez une matière pour commencer.</p>
          </div>
          {isLoading ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              {allowedSubjects.map((m, i) => {
                const s = styleForSubject(m);
                const count = countBySubject[m] ?? 0;
                return (
                  <motion.button
                    key={m}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActiveSubject(m)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border border-border ${s.border} border-l-4 bg-card p-4 text-center shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-6 w-6 ${s.text}`} />
                    </div>
                    <p className="text-sm font-bold">{m}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {count} exercice{count > 1 ? "s" : ""}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Vue exercices d'une matière
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Retour */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubject(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Matières
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold">{activeSubject}</h1>
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">Aucun exercice trouvé.</p>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map((ex, i) => {
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
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyColor[ex.difficulty] ?? difficultyColor.moyen}`}>
                        {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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

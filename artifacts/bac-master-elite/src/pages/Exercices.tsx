import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { PenLine, CheckCircle2, Clock, ArrowRight, Star, BookOpen, ChevronLeft, Zap, Target, Flame, Skull } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useExercises, useProfile } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { supabase } from "@/lib/supabase";
import { subjectsForSerie, styleForSubject } from "@/lib/subjects";

const LEVELS = [
  {
    key: "facile",
    label: "Facile",
    description: "Notions de base, questions directes",
    icon: Zap,
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  {
    key: "moyen",
    label: "Moyen",
    description: "Approfondissement, raisonnement",
    icon: Target,
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  {
    key: "difficile",
    label: "Difficile",
    description: "Niveau BAC, analyse et synthèse",
    icon: Flame,
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-500/30",
    badge: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  },
  {
    key: "extreme",
    label: "Extrême",
    description: "QCM + questions ouvertes — Réservé Premium",
    icon: Skull,
    bg: "bg-purple-500/10",
    text: "text-purple-600",
    border: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  },
] as const;

type Level = "facile" | "moyen" | "difficile" | "extreme";

const difficultyColor: Record<string, string> = {
  facile: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  moyen: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  difficile: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  extreme: "bg-purple-500/10 text-purple-700 border-purple-500/20",
};

export default function Exercices() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: exercises = [], isLoading } = useExercises();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, "in_progress" | "completed">>({});

  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_exercise_progress")
      .select("exercise_id, status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, "in_progress" | "completed"> = {};
        data.forEach((row) => {
          map[String(row.exercise_id)] = row.status ?? "in_progress";
        });
        setProgressMap(map);
      });
  }, [user?.id]);

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const allItems = useMemo(() => {
    return exercises
      .filter((e) => {
        const r = e as Record<string, unknown>;
        const exSerie = ((r.serie as string) ?? "").toUpperCase();
        if (!exSerie) return true;
        return exSerie.split("/").map((s) => s.trim()).includes(serie);
      })
      .map((e) => {
        const r = e as Record<string, unknown>;
        const id = r.id != null ? String(r.id) : null;
        const status = id ? progressMap[id] : undefined;
        return {
          id,
          titre: (r.title as string) ?? (r.titre as string) ?? "Exercice",
          matiere: (r.subject as string) ?? (r.matiere as string) ?? "Général",
          difficulty: ((r.difficulty as string) ?? (r.difficulte as string) ?? "moyen").toLowerCase() as Level,
          status,
          points: (r.points as number) ?? 10,
          is_premium: (r.is_premium as boolean) ?? false,
        };
      });
  }, [exercises, serie, progressMap]);

  const countBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    allItems.forEach((ex) => { map[ex.matiere] = (map[ex.matiere] ?? 0) + 1; });
    return map;
  }, [allItems]);

  const itemsBySubject = useMemo(() => {
    if (!activeSubject) return [];
    return allItems.filter((ex) =>
      normalize(ex.matiere).includes(normalize(activeSubject)) ||
      normalize(activeSubject).includes(normalize(ex.matiere))
    );
  }, [allItems, activeSubject]);

  const countByLevel = useMemo(() => {
    const map: Record<string, number> = {};
    itemsBySubject.forEach((ex) => { map[ex.difficulty] = (map[ex.difficulty] ?? 0) + 1; });
    return map;
  }, [itemsBySubject]);

  const filteredItems = useMemo(() => {
    if (!activeSubject || !activeLevel) return [];
    return itemsBySubject.filter((ex) => ex.difficulty === activeLevel);
  }, [itemsBySubject, activeSubject, activeLevel]);

  // ── ÉCRAN 1 : Matières
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
                    onClick={() => { setActiveSubject(m); setActiveLevel(null); }}
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

  // ── ÉCRAN 2 : Niveaux
  if (!activeLevel) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubject(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Matières
            </button>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-bold">{activeSubject}</h1>
          </div>
          <p className="text-sm text-muted-foreground">Choisissez votre niveau de difficulté.</p>
          <div className="grid gap-4">
            {LEVELS.map((level, i) => {
              const count = countByLevel[level.key] ?? 0;
              const Icon = level.icon;
              const isExtreme = level.key === "extreme";
              return (
                <motion.button
                  key={level.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setActiveLevel(level.key as Level)}
                  disabled={count === 0}
                  className={`flex items-center gap-4 rounded-2xl border-2 bg-card p-5 text-left shadow-sm transition-all
                    ${count === 0
                      ? "opacity-40 cursor-not-allowed border-border"
                      : `hover:shadow-md hover:scale-[1.01] ${level.border} cursor-pointer`
                    }`}
                >
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${level.bg}`}>
                    <Icon className={`h-7 w-7 ${level.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base">{level.label}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${level.badge}`}>
                        {level.key}
                      </span>
                      {isExtreme && (
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          👑 Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{level.description}</p>
                    <p className={`text-xs font-semibold mt-1 ${count === 0 ? "text-muted-foreground" : level.text}`}>
                      {count === 0 ? "Aucun exercice disponible" : `${count} exercice${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  {count > 0 && <ArrowRight className={`h-5 w-5 shrink-0 ${level.text}`} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── ÉCRAN 3 : Exercices
  const currentLevel = LEVELS.find((l) => l.key === activeLevel)!;
  const LevelIcon = currentLevel.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setActiveSubject(null); setActiveLevel(null); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Matières
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            onClick={() => setActiveLevel(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {activeSubject}
          </button>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-1.5">
            <LevelIcon className={`h-4 w-4 ${currentLevel.text}`} />
            <h1 className="text-sm font-bold">{currentLevel.label}</h1>
          </div>
        </div>

        <div className={`flex items-center gap-3 rounded-xl border ${currentLevel.border} ${currentLevel.bg} p-4`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${currentLevel.bg}`}>
            <LevelIcon className={`h-5 w-5 ${currentLevel.text}`} />
          </div>
          <div>
            <p className={`text-sm font-bold ${currentLevel.text}`}>{currentLevel.label}</p>
            <p className="text-xs text-muted-foreground">{currentLevel.description}</p>
          </div>
          <span className={`ml-auto text-xs font-bold ${currentLevel.text}`}>
            {filteredItems.length} exercice{filteredItems.length > 1 ? "s" : ""}
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">Aucun exercice trouvé.</p>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map((ex, i) => {
              const isCompleted = ex.status === "completed";
              const isInProgress = ex.status === "in_progress";
              const ctaLabel = isCompleted ? "Revoir" : isInProgress ? "Continuer" : "Commencer";
              const ctaClasses = isCompleted
                ? "border border-emerald-500 bg-emerald-500/10 text-emerald-700"
                : isInProgress
                ? "border border-amber-500 bg-amber-500/10 text-amber-700"
                : activeLevel === "extreme"
                ? "bg-purple-600 text-white"
                : "bg-hero-gradient text-white";

              const inner = (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isCompleted ? "bg-emerald-500/15 text-emerald-600" : currentLevel.bg + " " + currentLevel.text}`}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <PenLine className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{ex.titre}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyColor[ex.difficulty] ?? difficultyColor.moyen}`}>
                        {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                      </span>
                      {ex.is_premium && (
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          👑 Premium
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      
                      
                      {isInProgress && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                          <Clock className="h-3 w-3" /> En cours
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Terminé
                        </span>
                      )}
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

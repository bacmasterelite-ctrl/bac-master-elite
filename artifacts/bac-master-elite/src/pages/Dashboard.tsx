import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BookOpen,
  PenLine,
  Trophy,
  Target,
  ArrowUp,
  ArrowRight,
  Flame,
  Clock,
  Brain,
} from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DefiChallengeBanner from "@/components/DefiChallengeBanner";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import {
  useExercises,
  useLessons,
  useAnnals,
  useProfile,
  type Course,
  type Exercise,
  type Annal,
} from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { styleForSubject, subjectsForSerie } from "@/lib/subjects";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function matchesSerie(item: Record<string, unknown>, serie: string): boolean {
  const value = ((item.serie as string) ?? (item.series as string) ?? "").toUpperCase();
  if (!value) return true;
  return value.includes(serie.toUpperCase());
}

function matchesSubjectAllowed(item: Record<string, unknown>, allowed: string[]): boolean {
  const subj = ((item.subject as string) ?? (item.matiere as string) ?? "").toLowerCase();
  if (!subj) return true;
  return allowed.some((s) => s.toLowerCase().includes(subj) || subj.includes(s.toLowerCase()));
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: lessonsRaw = [] } = useLessons();
  const { data: exercisesRaw = [] } = useExercises();
  const { data: annalsRaw = [] } = useAnnals();

  const serie = (profile?.serie ?? "D").toUpperCase();

  // Vraies données utilisateur
  const [coursCount, setCoursCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exercicesCount, setExercicesCount] = useState(0);
  const [annalsCount, setAnnalsCount] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [progressData, setProgressData] = useState<{ semaine: string; score: number }[]>([
    { semaine: "S1", score: 0 }, { semaine: "S2", score: 0 }, { semaine: "S3", score: 0 },
    { semaine: "S4", score: 0 }, { semaine: "S5", score: 0 }, { semaine: "S6", score: 0 },
    { semaine: "S7", score: 0 },
  ]);
  const [repartitionData, setRepartitionData] = useState([
    { name: "Cours", value: 33, color: "#1e40af" },
    { name: "Exercices", value: 34, color: "#10b981" },
    { name: "Annales", value: 33, color: "#f59e0b" },
  ]);
  const [matieresData, setMatieresData] = useState<{ matiere: string; score: number }[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Cours suivis (progress > 0)
    supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .select("id")
      .then(({ count }) => setCoursCount(count ?? 0));

    // Exercices complétés
    supabase
      .from("user_exercise_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      
      .then(({ count }) => setExercicesCount(count ?? 0));

    // Annales consultées
    supabase
      .from("annal_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setAnnalsCount(count ?? 0));

    // Score moyen cette semaine
    // Score moyen global (leçons + exercices)
    Promise.all([
      supabase.from("lesson_progress").select("quiz_score")
        .eq("user_id", user.id).select("id").not("quiz_score", "is", null),
      supabase.from("user_exercise_progress").select("score")
        .eq("user_id", user.id).not("score", "is", null),
    ]).then(([lessons, exos]) => {
      const all = [
        ...(lessons.data ?? []).map((r) => r.quiz_score ?? 0),
        ...(exos.data ?? []).map((r) => r.score ?? 0),
      ];
      if (all.length > 0) setWeeklyProgress(Math.round(all.reduce((a,b) => a+b,0) / all.length));
    });

    // Progression hebdomadaire (7 semaines)
    const weeks = Array.from({ length: 7 }, (_, i) => {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return { label: `S${7 - i}`, start: start.toISOString(), end: end.toISOString() };
    }).reverse();

    Promise.all(
      weeks.map(({ label, start, end }) =>
        supabase
          .from("user_exercise_progress")
          .select("score")
          .eq("user_id", user.id)
          .gte("completed_at", start)
          .lt("completed_at", end)
          .then(({ data }) => {
            const avg = data && data.length > 0
              ? Math.round(data.reduce((a, b) => a + (b.score ?? 0), 0) / data.length)
              : 0;
            return { semaine: label, score: avg };
          })
      )
    ).then((results) => {
      if (results.some((r) => r.score > 0)) setProgressData(results);
    });

    // Répartition du temps (cours / exercices / annales cette semaine)
    Promise.all([
      supabase.from("lesson_progress").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).gte("updated_at", weekAgo.toISOString()),
      supabase.from("user_exercise_progress").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).gte("completed_at", weekAgo.toISOString()),
      supabase.from("annal_progress").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).gte("viewed_at", weekAgo.toISOString()),
    ]).then(([cours, exos, annales]) => {
      const total = (cours.count ?? 0) + (exos.count ?? 0) + (annales.count ?? 0);
      if (total > 0) {
        setRepartitionData([
          { name: "Cours", value: Math.round(((cours.count ?? 0) / total) * 100), color: "#1e40af" },
          { name: "Exercices", value: Math.round(((exos.count ?? 0) / total) * 100), color: "#10b981" },
          { name: "Annales", value: Math.round(((annales.count ?? 0) / total) * 100), color: "#f59e0b" },
        ]);
      }
    });

    // Performance par matière - deux requêtes séparées
    supabase
      .from("user_exercise_progress")
      .select("score, exercise_id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .then(async ({ data: progData }) => {
        if (!progData || progData.length === 0) return;
        const ids = [...new Set(progData.map((r: any) => r.exercise_id).filter(Boolean))];
        const { data: exData } = await supabase
          .from("exercises")
          .select("id, subject")
          .in("id", ids);
        if (!exData) return;
        const subjectMap: Record<string, string> = {};
        exData.forEach((e: any) => { subjectMap[e.id] = e.subject ?? "Autre"; });
        const bySubject: Record<string, number[]> = {};
        progData.forEach((row: any) => {
          const subj = subjectMap[row.exercise_id] ?? "Autre";
          if (!bySubject[subj]) bySubject[subj] = [];
          bySubject[subj].push(row.score ?? 0);
        });
        const result = Object.entries(bySubject).slice(0, 5).map(([subj, scores]) => ({
          matiere: subj.length > 8 ? subj.slice(0, 8) + "." : subj,
          score: Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length),
        }));
        setMatieresData(result);
      });
  }, [user?.id, refreshKey]);

  // Rafraîchir à chaque fois que la page devient visible
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) setRefreshKey(k => k + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Rafraîchir quand la page devient visible
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        supabase.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).select("id").then(({ count }) => setCoursCount(count ?? 0));
        supabase.from("user_exercise_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true).then(({ count }) => setExercicesCount(count ?? 0));
        supabase.from("annal_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setAnnalsCount(count ?? 0));
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) handleFocus(); });
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?.id]);
  const allowedSubjects = subjectsForSerie(serie);

  const lessons = lessonsRaw.filter((l) => matchesSerie(l as Record<string, unknown>, serie) && matchesSubjectAllowed(l as Record<string, unknown>, allowedSubjects));
  const exercises = exercisesRaw.filter((e) => matchesSerie(e as Record<string, unknown>, serie) && matchesSubjectAllowed(e as Record<string, unknown>, allowedSubjects));
  const annals = annalsRaw.filter((a) => matchesSerie(a as Record<string, unknown>, serie) && matchesSubjectAllowed(a as Record<string, unknown>, allowedSubjects));

  // matieresData est maintenant dans le state (voir useEffect)

  // progressData et repartitionData sont maintenant dans le state (voir useEffect)

  const stats = [
    {
      label: "Cours suivis",
      value: coursCount,
      total: lessons.length || null,
      icon: BookOpen,
      color: "from-blue-600 to-blue-500",
      delta: coursCount > 0 ? `${coursCount} cours terminés` : null,
    },
    {
      label: "Exercices résolus",
      value: exercicesCount,
      total: exercises.length || null,
      icon: PenLine,
      color: "from-emerald-600 to-emerald-500",
      delta: exercicesCount > 0 ? `${exercicesCount} complétés` : null,
    },
    {
      label: "Annales travaillées",
      value: annalsCount ?? 0,
      total: annals.length || null,
      icon: Trophy,
      color: "from-amber-500 to-orange-500",
      delta: null,
    },
    {
      label: "Score moyen",
      value: weeklyProgress,
      suffix: "%",
      icon: Target,
      color: "from-violet-600 to-fuchsia-500",
      delta: weeklyProgress > 0 ? `${weeklyProgress}% cette semaine` : null,
    },
    {
      label: "Points gagnés",
      value: profile?.points ?? 0,
      suffix: " pts",
      icon: Brain,
      color: "from-rose-500 to-pink-500",
      delta: (profile?.points ?? 0) > 0 ? `${profile?.points} pts accumulés` : null,
    },
  ];

  const goal = Math.max(exercises.length, 10);
  const done = exercicesCount;

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <DefiChallengeBanner />
        {/* Hero */}
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl bg-hero-gradient p-6 text-white sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  <Flame className="h-3.5 w-3.5" />
                  Série en cours : 7 jours
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                  Série {serie}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Continuez sur votre lancée
                {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} !
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/85">
                Vous avez accompli {done}% de votre objectif hebdomadaire. Encore quelques exercices et c'est dans la poche.
              </p>
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between text-xs text-white/85">
                  <span>Progression hebdomadaire</span>
                  <span className="font-bold">{done} / {goal}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(done / goal) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/cours">
                <Button className="rounded-full bg-white text-blue-700 hover:bg-white/90" data-testid="button-continue-course">
                  Reprendre un cours
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/tuteur-ia">
                <Button variant="outline" className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <Brain className="mr-2 h-4 w-4" />
                  Demander à l'IA
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Subjects (filtered by série) */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <h2 className="mb-3 text-base font-bold">Mes matières — Série {serie}</h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {allowedSubjects.map((m, i) => {
              const s = styleForSubject(m);
              return (
                <Link key={m} href={`/dashboard/cours?subject=${encodeURIComponent(m)}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border border-border ${s.border} border-l-4 bg-card p-3 text-center shadow-sm hover-elevate`}
                    data-testid={`subject-tile-${m}`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.text}`} />
                    </div>
                    <p className="text-xs font-bold">{m}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm hover-elevate"
              data-testid={`card-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md`}>
                  <s.icon className="h-5 w-5" />
                </div>
                {s.delta && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    <ArrowUp className="h-3 w-3" />
                    {s.delta}
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-3xl font-extrabold">
                {s.value}
                {s.suffix ? <span className="text-base text-muted-foreground">{s.suffix}</span> : null}
                {s.total ? <span className="text-sm font-semibold text-muted-foreground"> / {s.total}</span> : null}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold">Progression hebdomadaire</h3>
                <p className="text-xs text-muted-foreground">Score moyen sur 100</p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600">
                +24 pts
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e40af" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="semaine" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#1e40af" strokeWidth={2.5} fill="url(#scoreGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-bold">Répartition du temps</h3>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartitionData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3}>
                    {repartitionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {repartitionData.map((r) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                    <span className="font-medium">{r.name}</span>
                  </div>
                  <span className="text-muted-foreground">{r.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Subjects performance & schedule */}
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold">Performance par matière</h3>
            <p className="text-xs text-muted-foreground">Vos 5 dernières évaluations — Série {serie}</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={matieresData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="matiere" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-bold">Objectifs du jour</h3>
            <p className="text-xs text-muted-foreground">Votre planning intelligent</p>
            <div className="mt-4 space-y-4">
              {[
                { label: `Terminer 1 leçon en ${allowedSubjects[0] ?? ""}`, progress: Math.min(coursCount * 100, 100), time: "30 min" },
                { label: `Résoudre 1 exercice en ${allowedSubjects[1] ?? allowedSubjects[0] ?? ""}`, progress: Math.min(exercicesCount * 100, 100), time: "20 min" },
                { label: `Consulter 1 annale`, progress: Math.min(annalsCount * 100, 100), time: "1h" },
              ].map((g) => (
                <div key={g.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{g.label}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {g.time}
                    </span>
                  </div>
                  <Progress value={g.progress} className="mt-2 h-1.5" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Témoignages communauté */}
        <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <TestimonialsCarousel variant="dashboard" showForm={true} />
        </div>
      </div>
    </DashboardLayout>
  );
}

// Suppress unused import warnings (types reused for hooks)
export type _ReExportTypes = Course | Exercise | Annal;
// Sat May  9 09:49:13 AM UTC 2026

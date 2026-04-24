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
import { useExercises, useLessons, useAnnals } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";

const progressData = [
  { semaine: "S1", score: 42 },
  { semaine: "S2", score: 51 },
  { semaine: "S3", score: 58 },
  { semaine: "S4", score: 64 },
  { semaine: "S5", score: 71 },
  { semaine: "S6", score: 78 },
  { semaine: "S7", score: 84 },
];

const matieresData = [
  { matiere: "Maths", score: 82 },
  { matiere: "Physique", score: 74 },
  { matiere: "SVT", score: 68 },
  { matiere: "Français", score: 79 },
  { matiere: "Philo", score: 65 },
];

const repartitionData = [
  { name: "Cours", value: 45, color: "#1e40af" },
  { name: "Exercices", value: 35, color: "#10b981" },
  { name: "Annales", value: 20, color: "#f59e0b" },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: lessons = [] } = useLessons();
  const { data: exercises = [] } = useExercises();
  const { data: annals = [] } = useAnnals();

  const stats = [
    {
      label: "Cours suivis",
      value: lessons.length || 12,
      total: lessons.length ? null : 50,
      icon: BookOpen,
      color: "from-blue-600 to-blue-500",
      delta: "+3 cette semaine",
    },
    {
      label: "Exercices résolus",
      value: exercises.length || 47,
      total: exercises.length ? null : 200,
      icon: PenLine,
      color: "from-emerald-600 to-emerald-500",
      delta: "+12 cette semaine",
    },
    {
      label: "Annales travaillées",
      value: annals.length || 8,
      total: annals.length ? null : 30,
      icon: Trophy,
      color: "from-amber-500 to-orange-500",
      delta: "+2 cette semaine",
    },
    {
      label: "Score moyen",
      value: 78,
      suffix: "%",
      icon: Target,
      color: "from-violet-600 to-fuchsia-500",
      delta: "+6 pts ce mois",
    },
  ];

  const goal = 100;
  const done = 78;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero card */}
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl bg-hero-gradient p-6 text-white sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <Flame className="h-3.5 w-3.5" />
                <span>Série en cours : 7 jours</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Continuez sur votre lancée
                {(user?.user_metadata?.full_name as string | undefined)
                  ? `, ${(user?.user_metadata?.full_name as string).split(" ")[0]}`
                  : ""}{" "}
                !
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/85">
                Vous avez déjà accompli {done}% de votre objectif hebdomadaire. Encore quelques exercices et c'est dans la poche.
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
                <Button className="bg-white text-blue-700 hover:bg-white/90" data-testid="button-continue-course">
                  Reprendre un cours
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/tuteur-ia">
                <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <Brain className="mr-2 h-4 w-4" />
                  Demander à l'IA
                </Button>
              </Link>
            </div>
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
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  <ArrowUp className="h-3 w-3" />
                  {s.delta}
                </span>
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

        {/* Subjects & schedule */}
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold">Performance par matière</h3>
            <p className="text-xs text-muted-foreground">Vos 5 dernières évaluations</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={matieresData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="matiere" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
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
                { label: "Réviser la dérivation", progress: 80, time: "30 min" },
                { label: "Exercices SVT — Génétique", progress: 45, time: "20 min" },
                { label: "Annale Philo 2024", progress: 10, time: "1h" },
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
      </div>
    </DashboardLayout>
  );
}

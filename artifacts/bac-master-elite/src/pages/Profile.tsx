import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Mail,
  GraduationCap,
  Crown,
  Trophy,
  Award,
  Star,
  Flame,
  Brain,
  BookOpen,
  Target,
  ArrowRight,
  Settings,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile, usePremiumStatus } from "@/lib/queries";
import { cn } from "@/lib/utils";

const ALL_BADGES = [
  { id: "first-step", label: "Premier pas", desc: "Inscription validée", icon: GraduationCap, color: "from-blue-500 to-blue-600", earnedAt: 0 },
  { id: "streak-7", label: "Série de 7 jours", desc: "7 jours d'affilée", icon: Flame, color: "from-orange-500 to-red-500", earnedAt: 50 },
  { id: "10-courses", label: "10 cours", desc: "10 cours suivis", icon: BookOpen, color: "from-emerald-500 to-teal-500", earnedAt: 100 },
  { id: "exam-master", label: "Maître des annales", desc: "5 annales", icon: Trophy, color: "from-amber-500 to-orange-500", earnedAt: 200 },
  { id: "ai-friend", label: "Ami de l'IA", desc: "20 questions", icon: Brain, color: "from-violet-500 to-fuchsia-500", earnedAt: 300 },
  { id: "perfect-score", label: "Score parfait", desc: "100% à un quiz", icon: Star, color: "from-yellow-400 to-amber-500", earnedAt: 500 },
  { id: "top-10", label: "Top 10", desc: "Top 10 du classement", icon: Award, color: "from-pink-500 to-rose-500", earnedAt: 1000 },
  { id: "expert", label: "Expert BAC", desc: "Mention TB", icon: Target, color: "from-indigo-500 to-purple-600", earnedAt: 2000 },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isPremium } = usePremiumStatus(user?.id);

  const fullName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "Élève";
  const email = profile?.email ?? user?.email ?? "";
  const serie = profile?.serie ?? (user?.user_metadata?.serie as string | undefined) ?? "D";
  const points = profile?.points ?? 0;

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
        >
          <div className="relative h-28 bg-hero-gradient">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_60%)]" />
          </div>
          <div className="relative px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-card bg-hero-gradient text-2xl font-extrabold text-white shadow-lg">
                  {initials}
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {email}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pb-2">
                {isPremium ? (
                  <motion.span
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3.5 py-1 text-xs font-bold text-amber-950 shadow-md shadow-amber-500/30"
                    data-testid="badge-status"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <Crown className="h-3.5 w-3.5 drop-shadow-sm" />
                    <span className="relative">Premium</span>
                  </motion.span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground"
                    data-testid="badge-status"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Gratuit
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-700">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Série {serie}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border-l-4 border-l-blue-600 border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Série</p>
                <p className="mt-1 text-xl font-bold">{serie}</p>
              </div>
              <div className="rounded-2xl border-l-4 border-l-emerald-500 border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Points</p>
                <p className="mt-1 text-xl font-bold">{points.toLocaleString("fr-FR")}</p>
              </div>
              <div className="rounded-2xl border-l-4 border-l-amber-500 border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Badges</p>
                <p className="mt-1 text-xl font-bold">
                  {ALL_BADGES.filter((b) => points >= b.earnedAt).length} / {ALL_BADGES.length}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {!isPremium && (
                <Link href="/dashboard/upgrade">
                  <Button className="rounded-full bg-hero-gradient text-white hover:opacity-90" data-testid="button-go-premium">
                    <Crown className="mr-1.5 h-4 w-4" />
                    Passer Premium
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="rounded-full" disabled>
                <Settings className="mr-1.5 h-4 w-4" />
                Paramètres
              </Button>
              <Button variant="outline" className="rounded-full" onClick={signOut} data-testid="button-logout">
                Déconnexion
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Mes badges</h2>
              <p className="text-xs text-muted-foreground">Continuez à apprendre pour les débloquer tous</p>
            </div>
            <Link href="/dashboard/leaderboard">
              <Button variant="ghost" size="sm" className="rounded-full">
                Classement
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ALL_BADGES.map((b, i) => {
              const earned = points >= b.earnedAt;
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-center transition-all",
                    earned
                      ? "border-blue-200 bg-card hover-elevate dark:border-blue-900"
                      : "border-dashed border-border bg-muted/30 opacity-60",
                  )}
                  data-testid={`badge-${b.id}`}
                >
                  <div
                    className={cn(
                      "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white",
                      earned ? `bg-gradient-to-br ${b.color} shadow-md` : "bg-muted",
                    )}
                  >
                    <b.icon className={cn("h-5 w-5", earned ? "" : "text-muted-foreground")} />
                  </div>
                  <p className="mt-3 text-sm font-bold">{b.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{b.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

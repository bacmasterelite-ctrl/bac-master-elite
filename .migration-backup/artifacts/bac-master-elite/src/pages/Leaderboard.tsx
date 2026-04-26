import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Search } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useLeaderboard } from "@/lib/queries";
import { cn } from "@/lib/utils";

const fallback = [
  { id: "1", full_name: "Aïcha Koné", serie: "D", points: 2450, is_premium: true },
  { id: "2", full_name: "Mamadou Diop", serie: "C", points: 2210, is_premium: true },
  { id: "3", full_name: "Fatou Touré", serie: "A", points: 2080, is_premium: false },
  { id: "4", full_name: "Ibrahim Sy", serie: "D", points: 1890, is_premium: true },
  { id: "5", full_name: "Kadidia Bah", serie: "C", points: 1720, is_premium: false },
  { id: "6", full_name: "Yao Konan", serie: "D", points: 1590, is_premium: false },
  { id: "7", full_name: "Awa Sall", serie: "A", points: 1410, is_premium: true },
  { id: "8", full_name: "Salif Camara", serie: "C", points: 1300, is_premium: false },
];

const initials = (name?: string | null, email?: string | null) => {
  if (name) return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return email?.[0]?.toUpperCase() ?? "?";
};

const rankIcon = (rank: number) => {
  if (rank === 1) return { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/40" };
  if (rank === 2) return { icon: Medal, color: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" };
  if (rank === 3) return { icon: Medal, color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/40" };
  return null;
};

export default function Leaderboard() {
  const { user } = useAuth();
  const { data, isLoading } = useLeaderboard();
  const [q, setQ] = useState("");

  const list = (data && data.length > 0 ? data : fallback) as typeof fallback;
  const filtered = list.filter((u) =>
    (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
            Classement
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Top des élèves
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gagnez des points à chaque exercice et grimpez le classement.
          </p>
        </div>

        {/* Top 3 podium */}
        {top3.length === 3 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[top3[1], top3[0], top3[2]].map((u, i) => {
              const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const r = rankIcon(realRank)!;
              const heightClass = realRank === 1 ? "sm:h-56" : "sm:h-48";
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "flex flex-col items-center justify-end rounded-2xl border-2 bg-card p-5 shadow-sm",
                    realRank === 1 ? "border-yellow-400" : "border-border",
                    heightClass,
                  )}
                  data-testid={`podium-${realRank}`}
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", r.bg)}>
                    <r.icon className={cn("h-5 w-5", r.color)} />
                  </div>
                  <div className="mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-hero-gradient text-lg font-extrabold text-white">
                    {initials(u.full_name)}
                  </div>
                  <p className="mt-3 text-center text-sm font-bold">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">Série {u.serie}</p>
                  <p className="mt-2 text-lg font-extrabold text-blue-600">
                    {u.points.toLocaleString("fr-FR")}{" "}
                    <span className="text-xs font-semibold text-muted-foreground">pts</span>
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un élève..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            data-testid="input-search-leaderboard"
          />
        </div>

        {/* Full list */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(top3.length === 3 ? rest : filtered).map((u, i) => {
                const rank = (top3.length === 3 ? 4 : 1) + i;
                const isMe = user?.id === u.id;
                return (
                  <motion.li
                    key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "flex items-center gap-4 p-4 transition-colors",
                      isMe ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-muted/40",
                    )}
                    data-testid={`row-rank-${rank}`}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        isMe ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {rank}
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-gradient text-sm font-bold text-white">
                      {initials(u.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{u.full_name}</p>
                        {isMe && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            Vous
                          </span>
                        )}
                        {u.is_premium && (
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Série {u.serie}</p>
                    </div>
                    <p className="text-base font-extrabold text-blue-600">
                      {u.points.toLocaleString("fr-FR")}
                      <span className="ml-1 text-xs font-semibold text-muted-foreground">pts</span>
                    </p>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { motion } from "framer-motion";
import {
  BookOpen,
  PenSquare,
  FileText,
  CheckCircle2,
  Trophy,
  Crown,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STAT_CARDS = [
  { key: "lessons" as const, label: "Cours", icon: BookOpen, color: "from-blue-500 to-blue-600" },
  { key: "exercises" as const, label: "Exercices", icon: PenSquare, color: "from-indigo-500 to-indigo-600" },
  { key: "annals" as const, label: "Annales", icon: FileText, color: "from-purple-500 to-purple-600" },
  { key: "completedExercises" as const, label: "Exos faits", icon: CheckCircle2, color: "from-emerald-500 to-emerald-600" },
];

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardSummary();

  return (
    <div>
      <PageHeader
        title={`Salut ${data?.profile.fullName?.split(" ")[0] || "👋"}`}
        subtitle={`Bienvenue sur BAC MASTER ELITE — Série ${data?.profile.serie ?? "—"}.`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((s, i) => {
          const Icon = s.icon;
          const value = data?.totals[s.key] ?? 0;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 rounded-2xl border-0 shadow-sm hover-elevate" data-testid={`card-stat-${s.key}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{isLoading ? "—" : value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 rounded-2xl border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Derniers exercices</h2>
            <Link href="/exercises"><a className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline">Voir tout <ArrowRight className="w-3.5 h-3.5"/></a></Link>
          </div>
          {data?.recentResults.length ? (
            <div className="space-y-3">
              {data.recentResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{r.exerciseTitle}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {r.score}/{r.total} bonnes réponses
                    </div>
                  </div>
                  <Badge className={`shrink-0 ${r.percentage >= 70 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : r.percentage >= 50 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-red-100 text-red-700 hover:bg-red-100"}`}>
                    {r.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-500">
              Aucun exercice fait pour le moment. <Link href="/exercises"><a className="text-blue-600 font-medium hover:underline">Commence !</a></Link>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
            <Trophy className="w-8 h-8 mb-3" />
            <div className="text-3xl font-bold">{data?.profile.score ?? 0} pts</div>
            <div className="text-sm text-blue-100 mt-1">
              {data?.rank ? `${data.rank}ᵉ au classement` : "Pas encore classé"}
            </div>
            <Link href="/ranking">
              <Button variant="secondary" size="sm" className="mt-4 rounded-lg" data-testid="button-see-ranking">
                Voir le classement
              </Button>
            </Link>
          </Card>

          {!data?.profile.isPremium && (
            <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <Crown className="w-8 h-8 mb-3" />
              <div className="text-lg font-bold">Passe Premium</div>
              <div className="text-sm text-amber-50 mt-1">
                Annales complètes, tuteur IA avec image, et plus.
              </div>
              <Link href="/premium">
                <Button variant="secondary" size="sm" className="mt-4 rounded-lg" data-testid="button-upgrade-premium">
                  Découvrir
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

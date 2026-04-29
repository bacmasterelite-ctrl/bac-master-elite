import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  Brain,
  Coffee,
  HeartPulse,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const tips: {
  icon: LucideIcon;
  titre: string;
  desc: string;
  border: string;
  iconBg: string;
}[] = [
  {
    icon: Clock,
    titre: "Gestion du temps",
    desc: "Pendant l'épreuve, divisez le temps total par le nombre de questions et gardez 15 minutes pour la relecture finale.",
    border: "border-l-blue-600",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Brain,
    titre: "Révisions actives",
    desc: "Au lieu de relire passivement, refaites les exercices sans regarder la correction et expliquez le cours à voix haute.",
    border: "border-l-violet-600",
    iconBg: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: HeartPulse,
    titre: "Sommeil & hydratation",
    desc: "8 heures de sommeil la veille et 1,5 L d'eau le jour J — un cerveau bien hydraté retient 25% de mieux.",
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Coffee,
    titre: "Pauses Pomodoro",
    desc: "25 minutes de travail intense suivies de 5 minutes de pause. Toutes les 4 sessions, faites une pause de 20 minutes.",
    border: "border-l-amber-500",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Sparkles,
    titre: "Fiches de synthèse",
    desc: "Créez une fiche A4 par chapitre avec mots-clés, schémas et formules. Relisez-les la veille de l'examen.",
    border: "border-l-pink-500",
    iconBg: "bg-pink-500/10 text-pink-600",
  },
  {
    icon: Trophy,
    titre: "Le jour J",
    desc: "Lisez TOUS les sujets avant de commencer, choisissez celui où vous êtes le plus à l'aise, et soignez votre écriture.",
    border: "border-l-indigo-500",
    iconBg: "bg-indigo-500/10 text-indigo-600",
  },
];

export default function AstucesBAC() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Conseils</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Astuces BAC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les meilleurs conseils de nos professeurs pour aborder l'examen sereinement.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((t, i) => (
            <motion.div
              key={t.titre}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border border-border ${t.border} border-l-4 bg-card p-5 shadow-sm hover-elevate`}
              data-testid={`card-tip-${i}`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.iconBg}`}>
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{t.titre}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

import { motion } from "framer-motion";
import { GraduationCap, Award, BookOpen } from "lucide-react";

type Teacher = {
  name: string;
  subject: string;
  serie: string;
  message: string;
  experience: string;
  accent: string;
};

const TEACHERS: Teacher[] = [
  {
    name: "M. Konan Yao",
    subject: "Mathématiques",
    serie: "C / D",
    experience: "18 ans d'expérience — Lycée Sainte-Marie",
    message:
      "BAC MASTER ELITE est l'outil que je conseille à tous mes élèves. Les exercices sont calibrés sur les attentes réelles du jury.",
    accent: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  },
  {
    name: "Mme Aminata Touré",
    subject: "Philosophie",
    serie: "A / D",
    experience: "12 ans d'expérience — Lycée Classique d'Abidjan",
    message:
      "Le Tuteur IA aide vraiment mes élèves à structurer leur pensée. Une dissertation propre commence par un plan clair, et la plateforme l'enseigne bien.",
    accent: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
  },
  {
    name: "M. Ibrahim Coulibaly",
    subject: "SVT",
    serie: "D",
    experience: "15 ans d'expérience — Lycée Mamie Adjoua",
    message:
      "Les schémas et corrigés détaillés font la différence. Mes élèves qui s'entraînent ici décrochent leurs mentions.",
    accent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
  },
  {
    name: "Mme Adjoa Brou",
    subject: "Français & Littérature",
    serie: "A",
    experience: "20 ans d'expérience — Lycée Sainte-Foi",
    message:
      "Une ressource précieuse. Les annales sont fidèles aux sujets posés ces dernières années en Côte d'Ivoire.",
    accent: "from-rose-500/20 to-pink-500/10 border-rose-500/30",
  },
];

export default function TeachersSection() {
  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Recommandé par
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Les professeurs en parlent
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Des enseignants ivoiriens conseillent BAC MASTER ELITE à leurs élèves.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEACHERS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${t.accent} p-5 backdrop-blur-sm`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-card">
                <GraduationCap className="h-6 w-6 text-blue-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold">{t.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-foreground/70">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> {t.subject}
                  </span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold dark:bg-background/40">
                    Série {t.serie}
                  </span>
                </div>
              </div>
              <Award className="h-5 w-5 shrink-0 text-amber-500" />
            </div>
            <p className="mt-4 text-sm italic text-foreground/85">"{t.message}"</p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              {t.experience}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

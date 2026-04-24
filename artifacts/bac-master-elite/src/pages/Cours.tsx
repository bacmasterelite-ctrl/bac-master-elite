import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, Clock, ArrowRight, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLessons, useSubjects } from "@/lib/queries";

const fallbackCourses = [
  { titre: "Dérivation et études de fonctions", matiere: "Mathématiques", serie: "C/D", duree: "45 min", progression: 80 },
  { titre: "Génétique mendélienne", matiere: "SVT", serie: "D", duree: "1h", progression: 45 },
  { titre: "L'inconscient — Freud", matiere: "Philosophie", serie: "A/C/D", duree: "30 min", progression: 100 },
  { titre: "Champ électrique", matiere: "Physique", serie: "C/D", duree: "55 min", progression: 20 },
  { titre: "Le Romantisme", matiere: "Français", serie: "A", duree: "40 min", progression: 0 },
  { titre: "Probabilités conditionnelles", matiere: "Mathématiques", serie: "C/D", duree: "35 min", progression: 60 },
];

export default function Cours() {
  const [q, setQ] = useState("");
  const { data: lessons = [], isLoading } = useLessons();
  const { data: subjects = [] } = useSubjects();

  const courses =
    lessons.length > 0
      ? lessons.map((l) => {
          const rec = l as Record<string, unknown>;
          return {
            titre: (rec.title as string) ?? (rec.titre as string) ?? "Cours",
            matiere: (rec.subject as string) ?? (rec.matiere as string) ?? "Général",
            serie: (rec.serie as string) ?? "A/C/D",
            duree: (rec.duration as string) ?? "45 min",
            progression: (rec.progress as number) ?? 0,
          };
        })
      : fallbackCourses;

  const filtered = courses.filter(
    (c) =>
      c.titre.toLowerCase().includes(q.toLowerCase()) ||
      c.matiere.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Bibliothèque</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Cours</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Parcourez tous vos cours par matière et par série.
            {subjects.length > 0 && ` ${subjects.length} matières disponibles.`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un cours, une matière..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
              data-testid="input-search-courses"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtrer
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <motion.div
                key={c.titre + i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm hover-elevate"
                data-testid={`card-course-${i}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Série {c.serie}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold leading-tight">{c.titre}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.matiere}</p>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Progression</span>
                    <span className="font-semibold text-foreground">{c.progression}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${c.progression}%` }} />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {c.duree}
                  </span>
                  <Button size="sm" variant="ghost" className="group-hover:bg-blue-50 group-hover:text-blue-700">
                    {c.progression === 0 ? "Commencer" : c.progression === 100 ? "Revoir" : "Continuer"}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

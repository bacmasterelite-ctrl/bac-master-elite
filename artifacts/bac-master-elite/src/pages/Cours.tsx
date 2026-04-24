import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Clock, ArrowRight, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLessons, useProfile } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import {
  styleForSubject,
  subjectsForSerie,
  SUBJECTS_BY_SERIE,
} from "@/lib/subjects";
import { cn } from "@/lib/utils";

type CourseRow = {
  titre: string;
  matiere: string;
  serie: string;
  duree: string;
  progression: number;
};

const fallbackBySubject = (matiere: string, serie: string): CourseRow[] => {
  const baseTitles: Record<string, string[]> = {
    Mathématiques: ["Dérivation et études", "Probabilités", "Suites & limites", "Géométrie dans l'espace"],
    Physique: ["Champ électrique", "Mécanique du point", "Ondes", "Électromagnétisme"],
    Chimie: ["Acide-base", "Cinétique", "Solutions ioniques", "Réactions d'oxydoréduction"],
    SVT: ["Génétique mendélienne", "Reproduction", "Système nerveux", "Évolution"],
    Philosophie: ["L'inconscient — Freud", "La conscience", "Le travail", "La justice"],
    Français: ["Le Romantisme", "Poésie moderne", "Le théâtre classique", "L'argumentation"],
    "Histoire-Géo": ["La décolonisation", "La guerre froide", "Les ODD", "L'Afrique post-coloniale"],
    Anglais: ["Compréhension écrite", "Expression écrite", "Grammaire avancée", "Idiomes"],
    Littérature: ["Genres littéraires", "L'écriture poétique", "Roman moderne", "Tragédie"],
  };
  const titles = baseTitles[matiere] ?? [`${matiere} — Chapitre 1`, `${matiere} — Chapitre 2`];
  return titles.map((t, i) => ({
    titre: t,
    matiere,
    serie,
    duree: ["30 min", "45 min", "55 min", "1h"][i % 4],
    progression: [80, 45, 100, 0, 60, 20][i % 6],
  }));
};

function matchesSerie(row: Record<string, unknown>, serie: string): boolean {
  const v = ((row.serie as string) ?? "").toUpperCase();
  if (!v) return true;
  return v.includes(serie.toUpperCase());
}

export default function Cours() {
  const [q, setQ] = useState("");
  const [activeMatiere, setActiveMatiere] = useState<string>("Toutes");
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  const { data: lessons = [], isLoading } = useLessons();

  const courses: CourseRow[] = useMemo(() => {
    const real = lessons
      .filter((l) => matchesSerie(l as Record<string, unknown>, serie))
      .map((l) => {
        const r = l as Record<string, unknown>;
        const matiere = (r.subject as string) ?? (r.matiere as string) ?? "Général";
        return {
          titre: (r.title as string) ?? (r.titre as string) ?? "Cours",
          matiere,
          serie: (r.serie as string) ?? serie,
          duree: (r.duration as string) ?? "45 min",
          progression: typeof r.progress === "number" ? r.progress : 0,
        };
      })
      .filter((c) =>
        allowedSubjects.some(
          (s) => s.toLowerCase() === c.matiere.toLowerCase() || c.matiere.toLowerCase().includes(s.toLowerCase()),
        ),
      );

    if (real.length > 0) return real;
    return allowedSubjects.flatMap((m) => fallbackBySubject(m, serie));
  }, [lessons, serie, allowedSubjects]);

  const filtered = courses.filter((c) => {
    const matchesText =
      c.titre.toLowerCase().includes(q.toLowerCase()) ||
      c.matiere.toLowerCase().includes(q.toLowerCase());
    const matchesMatiere = activeMatiere === "Toutes" || c.matiere === activeMatiere;
    return matchesText && matchesMatiere;
  });

  const matiereChips = ["Toutes", ...allowedSubjects];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Bibliothèque</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Cours <span className="text-muted-foreground">— Série {serie}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filtrés automatiquement pour votre série. Matières disponibles :{" "}
            {SUBJECTS_BY_SERIE[serie]?.join(" • ")}
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
          <Button variant="outline" className="rounded-full">
            <Filter className="mr-2 h-4 w-4" />
            Filtrer
          </Button>
        </div>

        {/* Matiere chips */}
        <div className="flex flex-wrap gap-2">
          {matiereChips.map((m) => {
            const active = activeMatiere === m;
            const s = m === "Toutes" ? null : styleForSubject(m);
            return (
              <button
                key={m}
                onClick={() => setActiveMatiere(m)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover-elevate",
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-border bg-card text-foreground",
                )}
                data-testid={`chip-matiere-${m}`}
              >
                {s && <s.icon className={cn("h-3.5 w-3.5", active ? "text-white" : s.text)} />}
                {m}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => {
              const s = styleForSubject(c.matiere);
              return (
                <motion.div
                  key={c.titre + i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`group flex flex-col rounded-2xl border border-border ${s.border} border-l-4 bg-card p-5 shadow-sm hover-elevate`}
                  data-testid={`card-course-${i}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.text}`} />
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
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                        style={{ width: `${c.progression}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {c.duree}
                    </span>
                    <Button size="sm" className="rounded-full bg-blue-600 text-white hover:bg-blue-700">
                      {c.progression === 0 ? "Commencer" : c.progression === 100 ? "Revoir" : "Continuer"}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Aucun cours ne correspond à votre recherche.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

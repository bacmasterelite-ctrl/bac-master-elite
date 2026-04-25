import { useLocation } from "wouter";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Search,
  Clock,
  ArrowRight,
  Filter,
  Lock,
  Crown,
  Download,
  X,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLessons, useProfile, usePremiumStatus } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import {
  styleForSubject,
  subjectsForSerie,
  SUBJECTS_BY_SERIE,
} from "@/lib/subjects";
import { downloadCourseAsPDF } from "@/lib/pdf";
import { cn } from "@/lib/utils";

type CourseRow = {
  titre: string;
  matiere: string;
  serie: string;
  duree: string;
  progression: number;
  is_free: boolean;
  content?: string;
};

const fallbackBody = (titre: string, matiere: string) => `## Introduction

Ce chapitre de ${matiere.toLowerCase()} aborde "${titre}", un thème central du programme officiel du BAC.

## Notions essentielles

- Définition rigoureuse du concept et son importance dans le programme.
- Liens avec les chapitres précédents et le reste du programme de Terminale.
- Points fréquemment évalués au BAC ces dernières années.

## Méthode pas à pas

1. Identifier les données et la question posée.
2. Rappeler les formules ou les règles applicables.
3. Construire un raisonnement structuré et rédigé.
4. Vérifier la cohérence du résultat.

## Exemple traité

Étudions un cas concret tiré d'une annale BAC : nous appliquons la méthode point par point pour aboutir à une rédaction claire et exemplaire.

## Conseils pour le BAC

- Soigner la rédaction et justifier chaque étape.
- Utiliser le vocabulaire propre à la matière.
- S'entraîner avec les annales pour automatiser la méthode.`;

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
    is_free: i === 0, // first course of each subject is free as a teaser
    content: fallbackBody(t, matiere),
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
  const [openCourse, setOpenCourse] = useState<CourseRow | null>(null);
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isPremium } = usePremiumStatus(user?.id);
  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  const { data: lessons = [], isLoading } = useLessons();

  const courses: CourseRow[] = useMemo(() => {
    const real = lessons
      .filter((l) => matchesSerie(l as Record<string, unknown>, serie))
      .map((l) => {
        const r = l as Record<string, unknown>;
        const matiere = (r.subject as string) ?? (r.matiere as string) ?? "Général";
        const titre = (r.title as string) ?? (r.titre as string) ?? "Cours";
        return {
          titre,
          matiere,
          serie: (r.serie as string) ?? serie,
          duree: (r.duration as string) ?? "45 min",
          progression: typeof r.progress === "number" ? r.progress : 0,
          is_free: r.is_free === true,
          content: (r.content as string) ?? fallbackBody(titre, matiere),
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

  const params = new URLSearchParams(window.location.search);
  const selectedSubject = params.get("subject");
  const params = new URLSearchParams(window.location.search);
  const selectedSubject = params.get("subject");
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const selectedSubject = params.get("subject");

  const filtered = courses.filter((c) => {
    const matchesText = c.titre.toLowerCase().includes(query.toLowerCase());
    const matchesSelected = !selectedSubject || c.matiere.toLowerCase() === selectedSubject.toLowerCase();
    return matchesText && matchesSelected;
  });

  const matiereChips = ["Toutes", ...allowedSubjects];

  const canAccess = (c: CourseRow) => isPremium || c.is_free;

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

        {!isPremium && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Débloquez l'intégralité des cours</p>
                <p className="text-xs text-muted-foreground">
                  Avec Premium : tous les chapitres, l'export PDF et le tuteur IA en illimité.
                </p>
              </div>
            </div>
            <Link href="/dashboard/upgrade">
              <Button className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Devenir Premium
              </Button>
            </Link>
          </div>
        )}

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
              const locked = !canAccess(c);
              return (
                <motion.button
                  type="button"
                  key={c.titre + i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setOpenCourse(c)}
                  className={cn(
                    "group relative flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm hover-elevate",
                    `${s.border} border-l-4`,
                  )}
                  data-testid={`card-course-${i}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.text}`} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          <Crown className="h-3 w-3" />
                          Premium
                        </span>
                      ) : c.is_free ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Gratuit
                        </span>
                      ) : null}
                      <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Série {c.serie}
                      </span>
                    </div>
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
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white",
                        locked
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : "bg-blue-600 group-hover:bg-blue-700",
                      )}
                    >
                      {locked ? (
                        <>
                          <Lock className="h-3 w-3" />
                          Débloquer
                        </>
                      ) : (
                        <>
                          {c.progression === 0 ? "Commencer" : c.progression === 100 ? "Revoir" : "Continuer"}
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                    </span>
                  </div>
                </motion.button>
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

      <CourseDialog
        course={openCourse}
        open={!!openCourse}
        onClose={() => setOpenCourse(null)}
        isPremium={isPremium}
        studentName={profile?.full_name ?? undefined}
      />
    </DashboardLayout>
  );
}

function CourseDialog({
  course,
  open,
  onClose,
  isPremium,
  studentName,
}: {
  course: CourseRow | null;
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
  studentName?: string;
}) {
  if (!course) return null;
  const locked = !isPremium && !course.is_free;
  const s = styleForSubject(course.matiere);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="space-y-3 border-b border-border bg-gradient-to-br from-blue-600 to-emerald-500 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  {course.matiere} · Série {course.serie}
                </p>
                <DialogTitle className="text-left text-xl font-bold text-white">
                  {course.titre}
                </DialogTitle>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/15"
              aria-label="Fermer"
              data-testid="button-close-course"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {locked ? (
            <PremiumLockScreen />
          ) : (
            <div
              className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-bold prose-h2:mt-4 prose-h2:text-base
                prose-p:leading-relaxed prose-li:my-0.5"
            >
              {(course.content ?? "").split(/\n{2,}/).map((para, i) => {
                if (para.startsWith("## ")) {
                  return <h2 key={i}>{para.slice(3)}</h2>;
                }
                if (/^\d+\.\s/.test(para)) {
                  return (
                    <ol key={i}>
                      {para.split("\n").map((li, j) => (
                        <li key={j}>{li.replace(/^\d+\.\s/, "")}</li>
                      ))}
                    </ol>
                  );
                }
                if (para.startsWith("- ")) {
                  return (
                    <ul key={i}>
                      {para.split("\n").map((li, j) => (
                        <li key={j}>{li.replace(/^-\s/, "")}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={i}>{para}</p>;
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {course.duree}
          </div>
          <div className="flex gap-2">
            {isPremium ? (
              <Button
                onClick={() =>
                  downloadCourseAsPDF(
                    {
                      titre: course.titre,
                      matiere: course.matiere,
                      serie: course.serie,
                      duree: course.duree,
                      content: course.content,
                    },
                    studentName,
                  )
                }
                className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-download-pdf"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Télécharger en PDF
              </Button>
            ) : locked ? (
              <Link href="/dashboard/upgrade">
                <Button
                  className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  data-testid="button-upgrade-from-course"
                >
                  <Crown className="mr-1.5 h-4 w-4" />
                  Devenir Premium
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/upgrade">
                <Button
                  variant="outline"
                  className="rounded-full"
                  data-testid="button-pdf-locked"
                  title="Le téléchargement PDF est réservé aux membres Premium"
                >
                  <Lock className="mr-1.5 h-4 w-4" />
                  PDF — Premium
                </Button>
              </Link>
            )}
            <Button onClick={onClose} variant="outline" className="rounded-full">
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PremiumLockScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-amber-400/30 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
          <Lock className="h-9 w-9" />
        </div>
      </div>
      <h3 className="mt-6 text-xl font-bold">Contenu réservé aux membres Premium</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ce cours fait partie du contenu approfondi de BAC MASTER ELITE. Passez Premium pour
        accéder à tous les chapitres, télécharger les cours en PDF et utiliser le tuteur IA
        en illimité.
      </p>
      <div className="mt-6 grid gap-2 text-left text-sm sm:grid-cols-3">
        {[
          "Tous les cours débloqués",
          "Tuteur IA illimité + photos",
          "Téléchargement PDF",
        ].map((perk) => (
          <div
            key={perk}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
          >
            <Crown className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{perk}</span>
          </div>
        ))}
      </div>
      <Link href="/dashboard/upgrade">
        <Button
          className="mt-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-white shadow-md hover:opacity-90"
          data-testid="button-upgrade-from-lock"
        >
          <Crown className="mr-1.5 h-4 w-4" />
          Devenir Premium
        </Button>
      </Link>
    </div>
  );
}

import { useSearch, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { useLessons, useProfile } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { supabase } from "@/lib/supabase";
import { subjectsForSerie, styleForSubject } from "@/lib/subjects";

export default function Cours() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: lessons = [], isLoading } = useLessons();
  const [query, setQuery] = useState("");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const search = useSearch();
  const params = new URLSearchParams(search);
  const subjectFromUrl = params.get("subject");

  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Toutes les leçons filtrées par série
  const allFiltered = useMemo(() => {
    return lessons.filter((l) => {
      const matiere = (l.matiere ?? l.subject ?? "").toLowerCase();
      const lessonSerie = (l.serie ?? "").toUpperCase();
      const matchesSerie = !lessonSerie || lessonSerie.includes(serie);
      const matchesAllowed = allowedSubjects.some(
        (s) => normalize(s) === normalize(matiere) || normalize(matiere).includes(normalize(s))
      );
      return matchesSerie && matchesAllowed;
    });
  }, [lessons, serie, allowedSubjects]);

  // Nombre de leçons par matière
  const countBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    allFiltered.forEach((l) => {
      const mat = l.matiere ?? l.subject ?? "Autre";
      map[mat] = (map[mat] ?? 0) + 1;
    });
    return map;
  }, [allFiltered]);

  // Matière active (URL ou state)
  const currentSubject = subjectFromUrl ?? activeSubject;

  // Leçons de la matière active filtrées par recherche
  const filteredLessons = useMemo(() => {
    if (!currentSubject) return [];
    return allFiltered.filter((l) => {
      const matiere = l.matiere ?? l.subject ?? "";
      const titre = (l.titre ?? l.title ?? "").toLowerCase();
      const matchesSubject =
        normalize(matiere).includes(normalize(currentSubject)) ||
        normalize(currentSubject).includes(normalize(matiere));
      const matchesText = titre.includes(query.toLowerCase());
      return matchesSubject && matchesText;
    });
  }, [allFiltered, currentSubject, query]);

  // Vue matières (accueil)
  if (!currentSubject) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-10">
          <h1 className="text-2xl font-bold">Cours — Série {serie}</h1>
          {isLoading ? (
            <p className="text-center py-10 text-muted-foreground">Chargement...</p>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              {allowedSubjects.map((m, i) => {
                const s = styleForSubject(m);
                const count = countBySubject[m] ?? 0;
                return (
                  <motion.button
                    key={m}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActiveSubject(m)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border border-border ${s.border} border-l-4 bg-card p-4 text-center shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-6 w-6 ${s.text}`} />
                    </div>
                    <p className="text-sm font-bold">{m}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {count} leçon{count > 1 ? "s" : ""}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Vue leçons d'une matière
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Header retour */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubject(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Matières
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold">{currentSubject}</h1>
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={`Rechercher dans ${currentSubject}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Liste leçons */}
        <div className="grid gap-3">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson, i) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-4 border rounded-xl bg-card shadow-sm"
              >
                <h3 className="font-bold mb-3">{lesson.titre ?? lesson.title ?? "Sans titre"}</h3>
                <Link
                  href={`/dashboard/lecon/${lesson.id}`}
                  onClick={() => {
                    if (user?.id) {
                      supabase.from("lesson_progress").upsert({
                        user_id: user.id,
                        lesson_id: lesson.id,
                        progress: 1,
                        updated_at: new Date().toISOString(),
                      });
                    }
                  }}
                >
                  <Button className="w-full justify-between">
                    Commencer <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            ))
          ) : (
            <p className="text-center py-10 text-muted-foreground">Aucune leçon trouvée.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

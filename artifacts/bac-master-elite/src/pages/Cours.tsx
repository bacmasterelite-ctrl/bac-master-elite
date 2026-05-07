import { useSearch } from "wouter";
import { useState, useMemo, useEffect } from "react";
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
  const [lastLessonId, setLastLessonId] = useState<string | null>(null);
  const [lastLessonTitle, setLastLessonTitle] = useState<string | null>(null);
  const search = useSearch();
  const params = new URLSearchParams(search);
  const subjectFromUrl = params.get("subject");

  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("lesson_progress")
      .select("lesson_id, lessons(titre, title)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.lesson_id) {
          setLastLessonId(String(data.lesson_id));
          const l = data.lessons as any;
          setLastLessonTitle(l?.titre ?? l?.title ?? "Reprendre le cours");
        }
      });
  }, [user?.id]);

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

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

  const countBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    allFiltered.forEach((l) => {
      const mat = l.matiere ?? l.subject ?? "Autre";
      map[mat] = (map[mat] ?? 0) + 1;
    });
    return map;
  }, [allFiltered]);

  const currentSubject = subjectFromUrl ?? activeSubject;

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

  if (!currentSubject) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-10">
          <h1 className="text-2xl font-bold">Cours — Série {serie}</h1>

          {/* Bannière reprendre */}
          {lastLessonId && (
            <Link href={`/dashboard/lecon/${lastLessonId}`}>
              <div className="flex items-center gap-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 hover:bg-blue-500/15 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Reprendre où vous vous êtes arrêté</p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{lastLessonTitle}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-blue-600 shrink-0" />
              </div>
            </Link>
          )}

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

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (subjectFromUrl) {
                window.history.pushState({}, "", "/dashboard/cours");
              }
              setActiveSubject(null);
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Matières
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold">{currentSubject}</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={`Rechercher dans ${currentSubject}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

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

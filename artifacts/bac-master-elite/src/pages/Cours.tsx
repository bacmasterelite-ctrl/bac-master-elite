import { useSearch } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { useLessons, useProfile } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, ChevronLeft, BookOpen, CheckCircle2, Clock, Layers } from "lucide-react";
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
  const [activeTheme, setActiveTheme] = useState<{ id: string; name: string } | null>(null);
  const [themes, setThemes] = useState<{ id: string; name: string; order_index: number }[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [lastLessonId, setLastLessonId] = useState<string | null>(null);
  const [lastLessonTitle, setLastLessonTitle] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, "in_progress" | "completed">>({});
  const search = useSearch();
  const params = new URLSearchParams(search);
  const subjectFromUrl = params.get("subject");

  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("lesson_progress")
      .select("lesson_id, lessons(title)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.lesson_id) {
          setLastLessonId(String(data.lesson_id));
          const l = data.lessons as any;
          setLastLessonTitle(l?.title ?? "Reprendre le cours");
        }
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, "in_progress" | "completed"> = {};
        data.forEach((row) => {
          map[String(row.lesson_id)] = row.status ?? "in_progress";
        });
        setProgressMap(map);
      });
  }, [user?.id]);

  useEffect(() => {
    const subject = subjectFromUrl ?? activeSubject;
    if (!subject) { setThemes([]); return; }
    setThemesLoading(true);
    supabase
      .from("subjects").select("id").eq("title", subject).then(({ data: subjectRows }) => {
      const ids = subjectRows.map((r: any) => r.id);
      supabase.from("themes").select("id, name, order_index").in("subject", ids).order("order_index").then(({ data }) => {
        setThemes(data ?? []);
        setThemesLoading(false);
      }).catch(() => { setThemes([]); setThemesLoading(false); });
    });
  }, [activeSubject, subjectFromUrl]);

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

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

  const countByTheme = useMemo(() => {
    const map: Record<string, number> = {};
    lessons.forEach((l: any) => {
      if (l.theme_id) map[l.theme_id] = (map[l.theme_id] ?? 0) + 1;
    });
    return map;
  }, [lessons]);

  const currentSubject = subjectFromUrl ?? activeSubject;

  const filteredLessons = useMemo(() => {
    if (!currentSubject || !activeTheme) return [];
    return lessons.filter((l: any) => {
      const titre = (l.titre ?? l.title ?? "").toLowerCase();
      return l.theme_id === activeTheme.id && titre.includes(query.toLowerCase());
    });
  }, [lessons, activeTheme, query, currentSubject]);

  // Écran 1 : Matières
  if (!currentSubject) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-10">
          <h1 className="text-2xl font-bold">Cours — Série {serie}</h1>
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
                    onClick={() => { setActiveSubject(m); setActiveTheme(null); }}
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

  // Écran 2 : Thèmes
  if (!activeTheme) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (subjectFromUrl) window.history.pushState({}, "", "/dashboard/cours");
                setActiveSubject(null);
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Matières
            </button>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-bold">{currentSubject}</h1>
          </div>
          {themesLoading ? (
            <p className="text-center py-10 text-muted-foreground">Chargement des thèmes...</p>
          ) : themes.length > 0 ? (
            <div className="grid gap-3">
              {themes.map((theme, i) => {
                const count = countByTheme[theme.id] ?? 0;
                return (
                  <motion.button
                    key={theme.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActiveTheme(theme)}
                    className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                      <Layers className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{theme.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{count} leçon{count > 1 ? "s" : ""}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground">Aucun thème trouvé.</p>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Écran 3 : Leçons
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              window.history.pushState({}, "", "/dashboard/cours");
              setActiveSubject(null);
              setActiveTheme(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Matières
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            onClick={() => setActiveTheme(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {currentSubject}
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-bold">{activeTheme.name}</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={`Rechercher dans ${activeTheme.name}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson, i) => {
              const status = progressMap[String(lesson.id)];
              const isCompleted = status === "completed";
              const isInProgress = status === "in_progress";
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 border rounded-xl bg-card shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold">{lesson.titre ?? lesson.title ?? "Sans titre"}</h3>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 shrink-0 ml-2">
                        <CheckCircle2 className="h-3 w-3" /> Terminé
                      </span>
                    )}
                    {isInProgress && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 shrink-0 ml-2">
                        <Clock className="h-3 w-3" /> En cours
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/lecon/${lesson.id}`}
                    onClick={() => {
                      if (user?.id) {
                        supabase.from("lesson_progress").upsert({
                          user_id: user.id,
                          lesson_id: lesson.id,
                          progress: 1,
                          status: isCompleted ? "completed" : "in_progress",
                          updated_at: new Date().toISOString(),
                        }, { onConflict: "user_id,lesson_id" });
                      }
                    }}
                  >
                    <Button className={`w-full justify-between ${isCompleted ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
                      {isCompleted ? "Revoir" : isInProgress ? "Continuer" : "Commencer"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <p className="text-center py-10 text-muted-foreground">Aucune leçon trouvée.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
import { useSearch } from "wouter";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLessons, useProfile } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { subjectsForSerie } from "@/lib/subjects";

export default function Cours() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: lessons = [], isLoading } = useLessons();
  const [query, setQuery] = useState("");
  const search = useSearch();
  const params = new URLSearchParams(search);
  const selectedSubject = params.get("subject");

  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      const titre = (l.titre ?? l.title ?? "").toLowerCase();
      const matiere = (l.matiere ?? l.subject ?? "").toLowerCase();
      const lessonSerie = (l.serie ?? "").toUpperCase();

      // Filtre par série : la leçon doit correspondre à la série de l'user
      const matchesSerie = !lessonSerie || lessonSerie.includes(serie);

      // Filtre par matière autorisée pour cette série
      const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const matchesAllowed = allowedSubjects.some(
        (s) => normalize(s) === normalize(matiere) || normalize(matiere).includes(normalize(s))
      );

      // Filtre par matière sélectionnée depuis le dashboard
      const matchesSubject = !selectedSubject || matiere.includes(selectedSubject.toLowerCase()) || selectedSubject.toLowerCase().includes(matiere);

      // Filtre par recherche texte
      const matchesText = titre.includes(query.toLowerCase());

      return matchesSerie && matchesAllowed && matchesSubject && matchesText;
    });
  }, [lessons, query, selectedSubject, serie, allowedSubjects]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <h1 className="text-2xl font-bold">
          {selectedSubject ? `Cours de ${selectedSubject}` : `Tous les cours — Série ${serie}`}
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Rechercher une leçon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid gap-4">
          {isLoading ? (
            <p className="text-center py-10 text-muted-foreground">Chargement...</p>
          ) : filtered.length > 0 ? (
            filtered.map((lesson) => (
              <div key={lesson.id} className="p-4 border rounded-xl bg-card shadow-sm">
                <div className="text-xs font-bold text-primary uppercase mb-1">
                  {lesson.matiere ?? lesson.subject ?? "—"}
                </div>
                <h3 className="font-bold mb-3">{lesson.titre ?? lesson.title ?? "Sans titre"}</h3>
                <Link href={`/dashboard/lecon/${lesson.id}`}>
                  <Button className="w-full justify-between">
                    Commencer <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-center py-10 text-muted-foreground">Aucun cours trouvé.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

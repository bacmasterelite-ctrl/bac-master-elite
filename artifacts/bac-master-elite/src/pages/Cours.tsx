import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLessons } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Cours() {
  const { data: lessons = [], isLoading } = useLessons();
  const [query, setQuery] = useState("");
  const [location] = useLocation();
  
  const params = new URLSearchParams(window.location.search);
  const selectedSubject = params.get("subject");

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      const matchesText = l.titre.toLowerCase().includes(query.toLowerCase());
      const matchesSubject = !selectedSubject || l.matiere.toLowerCase() === selectedSubject.toLowerCase();
      return matchesText && matchesSubject;
    });
  }, [lessons, query, selectedSubject]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {selectedSubject ? `Cours de ${selectedSubject}` : "Tous mes cours"}
          </h1>
          <p className="text-muted-foreground">Révisez vos leçons pour le BAC MASTER ELITE.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            className="pl-10" 
            placeholder="Rechercher une leçon..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">Chargement...</div>
        ) : (
          <div className="grid gap-4">
            {filtered.length > 0 ? (
              filtered.map((lesson) => (
                <div key={lesson.id} className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-xs font-semibold uppercase">
                        {lesson.matiere}
                      </div>
                      <h3 className="font-bold text-lg leading-none">{lesson.titre}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 45 min</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Gratuit</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Link href={`/dashboard/lecon/${lesson.id}`}>
                      <Button className="w-full justify-between rounded-xl">
                        Commencer la leçon <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                Aucun cours trouvé.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

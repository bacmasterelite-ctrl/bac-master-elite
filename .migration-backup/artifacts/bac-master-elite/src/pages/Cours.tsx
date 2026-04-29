import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLessons } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
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
      <div className="space-y-6 pb-10">
        <h1 className="text-2xl font-bold">{selectedSubject ? `Cours de ${selectedSubject}` : "Tous les cours"}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Rechercher une leçon..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="grid gap-4">
          {filtered.length > 0 ? (
            filtered.map((lesson) => (
              <div key={lesson.id} className="p-4 border rounded-xl bg-card shadow-sm">
                <div className="text-xs font-bold text-primary uppercase mb-1">{lesson.matiere}</div>
                <h3 className="font-bold mb-3">{lesson.titre}</h3>
                <Link href={`/dashboard/lecon/${lesson.id}`}>
                  <Button className="w-full justify-between">Commencer <ChevronRight className="h-4 w-4" /></Button>
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

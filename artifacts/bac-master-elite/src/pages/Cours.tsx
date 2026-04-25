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
        <h1 className="text-2xl font-bold">{selectedSubject ? `Cours : ${selectedSubject}` : "Tous les cours"}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Rechercher..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="grid gap-4">
          {filtered.map((lesson) => (
            <div key={lesson.id} className="p-5 border rounded-2xl bg-card">
              <div className="text-xs font-bold uppercase text-primary mb-2">{lesson.matiere}</div>
              <h3 className="font-bold text-lg mb-4">{lesson.titre}</h3>
              <Link href={`/dashboard/lecon/${lesson.id}`}>
                <Button className="w-full justify-between">Commencer <ChevronRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

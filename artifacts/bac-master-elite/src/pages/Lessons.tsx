import { useEffect, useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { GraduationCap, Lock } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function LessonsPage() {
  const search = useSearch();
  const initialSubject = useMemo(() => new URLSearchParams(search).get("subjectId") ?? "all", [search]);
  const [subjectId, setSubjectId] = useState(initialSubject);
  
  const [userSerie, setUserSerie] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // 1. Récupérer l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // 2. Récupérer la série depuis les métadonnées
      const serie = user.user_metadata?.serie || "";
      setUserSerie(serie);
      
      // 3. Vérifier si l'utilisateur est premium
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      
      const premium = profile?.is_premium === true;
      setIsPremium(premium);
      
      if (!serie) {
        setIsLoading(false);
        return;
      }
      
      // 4. Récupérer l'ID de la série
      const { data: serieData } = await supabase
        .from("series")
        .select("id")
        .eq("name", `Série ${serie}`)
        .single();
      
      if (!serieData) {
        setIsLoading(false);
        return;
      }
      
      // 5. Récupérer les matières de la série
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("serie_id", serieData.id);
      
      setSubjects(subjectsData || []);
      
      // 6. Récupérer les leçons filtrées par matière ET par statut premium
      let query = supabase
        .from("lessons")
        .select(`
          id,
          title,
          content,
          subject_id,
          is_premium_only,
          subjects (title)
        `);
      
      // Filtrer par matière
      if (subjectId !== "all") {
        query = query.eq("subject_id", subjectId);
      }
      
      // Si l'utilisateur n'est PAS premium, cacher les leçons premium
      if (!premium) {
        query = query.eq("is_premium_only", false);
      }
      
      const { data: lessonsData } = await query;
      
      // Formater les leçons
      const formatted = (lessonsData || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        content: l.content,
        subjectName: l.subjects?.title || "Matière inconnue",
        summary: l.content?.substring(0, 100) + "..." || "",
        isPremiumOnly: l.is_premium_only,
      }));
      
      setLessons(formatted);
      setIsLoading(false);
    }
    
    loadData();
  }, [subjectId]);

  return (
    <div>
      <PageHeader
        title="Cours"
        subtitle={`Tous les cours de la série ${userSerie}`}
        action={
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="w-56 rounded-xl">
              <SelectValue placeholder="Toutes les matières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <div className="text-sm text-gray-500 text-center py-12">Chargement des cours...</div>
      ) : lessons.length === 0 ? (
        <div className="text-sm text-gray-500 py-12 text-center">Aucun cours disponible.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((l) => (
            <Link key={l.id} href={`/lessons/${l.id}`}>
              <Card className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer h-full relative">
                {l.isPremiumOnly && !isPremium && (
                  <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 rounded-full p-1.5">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {l.subjectName}
                </div>
                <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{l.title}</div>
                <div className="text-sm text-gray-500 line-clamp-2">{l.summary}</div>
                {l.isPremiumOnly && !isPremium && (
                  <div className="mt-3 text-xs text-amber-600 font-medium">
                    🔒 Contenu premium
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
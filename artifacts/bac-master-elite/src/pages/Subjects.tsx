import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serieName, setSerieName] = useState("");

  useEffect(() => {
    async function loadSubjects() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      const userSerie = user.user_metadata?.serie;
      
      if (!userSerie) {
        setLoading(false);
        return;
      }
      
      setSerieName(`Série ${userSerie}`);
      
      const { data: serie } = await supabase
        .from("series")
        .select("id")
        .eq("name", `Série ${userSerie}`)
        .single();
      
      if (!serie) {
        setLoading(false);
        return;
      }
      
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("serie_id", serie.id);
      
      setSubjects(subjectsData || []);
      setLoading(false);
    }
    
    loadSubjects();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Matières</h1>
        <p className="text-gray-500 mt-1">{serieName}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <Link key={s.id} href={`/lessons?subjectId=${s.id}`}>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-3"
                style={{ backgroundColor: s.color_code || '#3b82f6' }}
              >
                {s.title?.charAt(0) || '?'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm text-blue-600 mt-2">Voir les cours →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
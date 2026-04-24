import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Download, Lock, Eye, Star, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Annal {
  id: string;
  year: number;
  subject_name: string;
  subject_id: string;
  pdf_url: string;
  is_premium_only: boolean;
  description?: string;
}

export default function AnnalsPage() {
  const [annals, setAnnals] = useState<Annal[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [subjects, setSubjects] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();
        setIsPremium(profile?.is_premium === true);
      }
      
      const userSerie = user?.user_metadata?.serie || "A";
      
      const { data: serieData } = await supabase
        .from("series")
        .select("id")
        .eq("name", `Série ${userSerie}`)
        .single();
      
      if (serieData) {
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("id, title")
          .eq("serie_id", serieData.id);
        setSubjects(subjectsData || []);
        
        let query = supabase
          .from("annals")
          .select(`
            id,
            year,
            pdf_url,
            is_premium_only,
            description,
            subjects (id, title)
          `)
          .in("subject_id", subjectsData?.map(s => s.id) || []);
        
        if (selectedSubject !== "all") {
          query = query.eq("subject_id", selectedSubject);
        }
        
        const { data: annalsData } = await query;
        
        const formatted = (annalsData || []).map((a: any) => ({
          id: a.id,
          year: a.year,
          pdf_url: a.pdf_url,
          is_premium_only: a.is_premium_only || false,
          description: a.description,
          subject_name: a.subjects?.title || "Matière inconnue",
          subject_id: a.subjects?.id
        }));
        
        setAnnals(formatted);
      }
      
      setLoading(false);
    }
    
    loadData();
  }, [selectedSubject]);

  const handleView = (annal: Annal) => {
    if (annal.is_premium_only && !isPremium) {
      toast({ title: "Contenu premium", description: "Upgrade ton compte pour accéder à cette annales", variant: "destructive" });
      return;
    }
    if (annal.pdf_url) {
      window.open(annal.pdf_url, "_blank");
    } else {
      toast({ title: "PDF non disponible", description: "Cette annales sera bientôt disponible", variant: "destructive" });
    }
  };

  const handleDownload = (annal: Annal) => {
    if (annal.is_premium_only && !isPremium) {
      toast({ title: "Téléchargement premium", description: "Deviens premium pour télécharger cette annales", variant: "destructive" });
      return;
    }
    if (annal.pdf_url) {
      window.open(annal.pdf_url, "_blank");
    } else {
      toast({ title: "PDF non disponible", description: "Cette annales sera bientôt disponible", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Annales"
        subtitle="Sujets d'examen des années précédentes"
        action={
          <select className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="all">Toutes les matières</option>
            {subjects.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
          </select>
        }
      />

      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /><span className="text-amber-700 text-sm">Les annales premium te permettent de télécharger les corrigés détaillés.</span></div>
          <Link href="/premium"><Button size="sm" className="bg-amber-500 hover:bg-amber-600">Devenir premium</Button></Link>
        </div>
      )}

      {annals.length === 0 ? (
        <Card className="p-12 text-center"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune annales disponible pour le moment.</p></Card>
      ) : (
        <div className="grid gap-4">
          {annals.map((annal) => {
            const isLocked = annal.is_premium_only && !isPremium;
            return (
              <Card key={annal.id} className="p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{annal.subject_name}</span>
                      {annal.is_premium_only && (<span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" /> Premium</span>)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mt-2">Bac {annal.year}</h3>
                    {annal.description && <p className="text-sm text-gray-500 mt-1">{annal.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleView(annal)} className="flex items-center gap-2"><Eye className="w-4 h-4" /> Voir</Button>
                    <Button onClick={() => handleDownload(annal)} className={`flex items-center gap-2 ${isLocked ? "bg-gray-400" : "bg-blue-600"}`} disabled={isLocked}>
                      {isLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />} Télécharger
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
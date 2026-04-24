import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Download, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LessonDetailPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Récupérer l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      
      // 2. Vérifier si premium
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();
        setIsPremium(profile?.is_premium === true);
      }
      
      // 3. Récupérer la leçon
      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*, subjects(title)")
        .eq("id", id)
        .single();
      
      setLesson(lessonData);
      setLoading(false);
    }
    
    if (id) loadData();
  }, [id]);

  const handleDownload = () => {
    if (!isPremium && lesson?.is_premium_only) {
      alert("🔒 Cette ressource est réservée aux membres premium. Upgrade ton compte !");
      return;
    }
    
    if (lesson?.pdf_url) {
      window.open(lesson.pdf_url, "_blank");
    } else {
      alert("📄 PDF non disponible pour le moment.");
    }
  };

  if (loading) return <div className="p-6 text-center">Chargement...</div>;
  
  if (!lesson) return <div className="p-6 text-center">Leçon non trouvée</div>;

  // Bloquer l'accès si premium et non premium
  if (lesson.is_premium_only && !isPremium) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="bg-amber-50 rounded-2xl p-12 border border-amber-200">
          <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contenu Premium</h1>
          <p className="text-gray-600 mb-6">
            Cette leçon est réservée aux membres premium.
          </p>
          <Link href="/premium">
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Star className="w-4 h-4 mr-2" /> Devenir premium
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPdfRestricted = lesson.is_premium_only && !isPremium;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/lessons" className="text-blue-600 flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour aux cours
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-white">
          <div className="text-sm text-blue-600 mb-2">{lesson.subjects?.title}</div>
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          
          {lesson.is_premium_only && (
            <div className="inline-flex items-center gap-1 mt-3 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
              <Star className="w-3.5 h-3.5" /> Contenu Premium
            </div>
          )}
        </div>
        
        <div className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content || "Contenu non disponible" }} />
        
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Fichier PDF
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {!lesson.pdf_url ? "📄 Aucun PDF associé" :
                  lesson.is_premium_only 
                    ? "⭐ Réservé aux membres Premium" 
                    : "📥 Téléchargement gratuit"}
              </p>
            </div>
            
            {lesson.pdf_url ? (
              <Button
                onClick={handleDownload}
                className={`flex items-center gap-2 ${
                  isPdfRestricted 
                    ? "bg-gray-500 hover:bg-gray-600" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isPdfRestricted ? (
                  <><Lock className="w-4 h-4" /> Débloquer avec Premium</>
                ) : (
                  <><Download className="w-4 h-4" /> Télécharger le PDF</>
                )}
              </Button>
            ) : (
              <Button disabled className="bg-gray-300 cursor-not-allowed flex items-center gap-2">
                <Download className="w-4 h-4" /> PDF indisponible
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
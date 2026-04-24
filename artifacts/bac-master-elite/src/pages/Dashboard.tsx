import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  CheckCircle, 
  FileText, 
  GraduationCap,
  TrendingUp,
  Clock,
  Award,
  BrainCircuit
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalExercises: 0,
    totalAnnals: 0,
    completedExercises: 0,
    progress: 0
  });
  const [userName, setUserName] = useState("");
  const [userSerie, setUserSerie] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Élève");
      const userSerieLetter = user.user_metadata?.serie || "A";
      setUserSerie(userSerieLetter);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, completed_exercises")
        .eq("id", user.id)
        .single();
      
      setIsPremium(profile?.is_premium === true);
      
      const { data: serieData } = await supabase
        .from("series")
        .select("id")
        .eq("name", `Série ${userSerieLetter}`)
        .single();
      
      if (serieData) {
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("id")
          .eq("serie_id", serieData.id);
        
        const subjectIds = subjectsData?.map(s => s.id) || [];
        
        const { count: lessonsCount } = await supabase
          .from("lessons")
          .select("*", { count: 'exact', head: true })
          .in("subject_id", subjectIds);
        
        const { count: exercisesCount } = await supabase
          .from("exercises")
          .select("*", { count: 'exact', head: true })
          .in("subject_id", subjectIds);
        
        const { count: annalsCount } = await supabase
          .from("annals")
          .select("*", { count: 'exact', head: true })
          .in("subject_id", subjectIds);
        
        const { data: completedData } = await supabase
          .from("user_exercise_progress")
          .select("exercise_id")
          .eq("user_id", user.id)
          .eq("completed", true);
        
        const completedCount = completedData?.length || 0;
        const totalExercises = exercisesCount || 1;
        const progressPercent = Math.round((completedCount / totalExercises) * 100);
        
        setStats({
          totalLessons: lessonsCount || 0,
          totalExercises: exercisesCount || 0,
          totalAnnals: annalsCount || 0,
          completedExercises: completedCount,
          progress: progressPercent
        });
      }
      
      const { data: recent } = await supabase
        .from("lessons")
        .select("id, title")
        .limit(3);
      
      setRecentLessons(recent || []);
      setLoading(false);
    }
    
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Cours disponibles", value: stats.totalLessons, icon: BookOpen, color: "bg-blue-500", link: "/lessons", linkText: "Voir les cours" },
    { title: "Exercices", value: stats.totalExercises, icon: CheckCircle, color: "bg-green-500", link: "/exercises", linkText: "Commencer" },
    { title: "Annales", value: stats.totalAnnals, icon: FileText, color: "bg-purple-500", link: "/annals", linkText: "Télécharger" },
    { title: "Exos faits", value: stats.completedExercises, icon: TrendingUp, color: "bg-orange-500", link: "/profile", linkText: "Voir progression" }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Bonjour, {userName} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Série {userSerie} · {isPremium ? "🏆 Compte Premium" : "📖 Compte Gratuit"}
          </p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 self-start">
          <Award className="w-4 h-4" />
          {stats.progress}% de complétion
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <Link href={stat.link}>
                  <Button variant="link" className="p-0 h-auto mt-2 text-blue-600">
                    {stat.linkText} →
                  </Button>
                </Link>
              </div>
              <div className={`${stat.color} p-3 rounded-2xl text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Section rapide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers cours */}
        <Card className="p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Derniers cours
            </h2>
            <Link href="/lessons">
              <Button variant="ghost" size="sm">Voir tout →</Button>
            </Link>
          </div>
          {recentLessons.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun cours disponible</p>
          ) : (
            <div className="space-y-3">
              {recentLessons.map((lesson) => (
                <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                  <div className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all cursor-pointer">
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500 mt-1">Clique pour lire →</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Tuteur IA */}
        <Card className="p-5 rounded-2xl shadow-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" />
              Tuteur IA
            </h2>
          </div>
          <p className="text-white/80 text-sm mb-4">
            Pose tes questions sur les cours, obtiens des explications personnalisées.
          </p>
          <Link href="/ai-tutor">
            <Button className="bg-white text-indigo-600 hover:bg-gray-100">
              Poser une question
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
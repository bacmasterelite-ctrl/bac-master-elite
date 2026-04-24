import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Clock, 
  Brain, 
  Calendar,
  Target,
  BookOpen,
  TrendingUp,
  Star,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

interface Tip {
  id: number;
  title: string;
  content: string;
  icon: string;
  category: string;
  premium?: boolean;
}

const tips: Tip[] = [
  {
    id: 1,
    title: "Planifie tes révisions",
    content: "Établis un calendrier de révisions sur 3 mois. Alterne les matières et prévois des pauses régulières. 2h de révision efficace valent mieux que 4h de travail non structuré.",
    icon: "calendar",
    category: "organisation"
  },
  {
    id: 2,
    title: "La méthode des 3 temps",
    content: "Pour chaque leçon : 1) Lis et comprends le cours (30min), 2) Fais des exercices d'application (30min), 3) Révise avec des flashcards ou résumés (15min).",
    icon: "clock",
    category: "methode"
  },
  {
    id: 3,
    title: "Maîtrise la dissertation",
    content: "Structure : Introduction (amorce, problématique, plan), Développement (3 parties avec exemples), Conclusion (synthèse, ouverture). Entraîne-toi sur des sujets d'annales.",
    icon: "target",
    category: "francais"
  },
  {
    id: 4,
    title: "Gère ton stress",
    content: "Respire profondément avant l'examen. Dors au moins 7h la veille. Mange léger mais équilibré. Arrive 30min en avance pour t'installer calmement.",
    icon: "brain",
    category: "bienetre"
  },
  {
    id: 5,
    title: "Apprends à synthétiser",
    content: "Utilise des mind maps (cartes mentales) pour visualiser les concepts. Résume chaque chapitre en 10 lignes maximum. Enseigne à un camarade pour vérifier ta compréhension.",
    icon: "bookopen",
    category: "methode"
  },
  {
    id: 6,
    title: "Entraîne-toi sur les annales",
    content: "Fais au moins 5 sujets complets par matière. Chronomètre-toi (4h pour les épreuves écrites). Analyse tes erreurs et corrige-les avec le corrigé officiel.",
    icon: "trendingup",
    category: "entrainement"
  },
  {
    id: 7,
    title: "Adopte une routine matinale",
    content: "Lève-toi 1h avant l'examen. Fais une courte révision des formules clés. Évite les écrans. Petit-déjeuner énergétique (protéines, glucides lents).",
    icon: "calendar",
    category: "bienetre"
  },
  {
    id: 8,
    title: "Pour les matières scientifiques",
    content: "Refais les démonstrations de formules. Crée une fiche des formules clés. Entraîne-toi sur les exercices types. Vérifie toujours tes unités.",
    icon: "target",
    category: "sciences"
  },
  {
    id: 9,
    title: "La relecture gagne des points",
    content: "Garde 15-20min à la fin pour relire ta copie. Corrige les fautes d'orthographe, vérifie les calculs, complète les oublis. Une copie propre rapporte plus.",
    icon: "checkcircle",
    category: "entrainement",
    premium: true
  },
  {
    id: 10,
    title: "Technique de mémorisation",
    content: "Utilise la technique des loci (palais mental) pour retenir les dates, formules ou citations. Associe chaque information à un endroit familier.",
    icon: "brain",
    category: "methode",
    premium: true
  }
];

const iconMap: Record<string, React.ReactNode> = {
  calendar: <Calendar className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  brain: <Brain className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  bookopen: <BookOpen className="w-5 h-5" />,
  trendingup: <TrendingUp className="w-5 h-5" />,
  lightbulb: <Lightbulb className="w-5 h-5" />,
  checkcircle: <CheckCircle className="w-5 h-5" />,
};

export default function MethodologyPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userSerie, setUserSerie] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    async function getUserInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserSerie(user.user_metadata?.serie || "A");
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();
        setIsPremium(profile?.is_premium === true);
      }
    }
    getUserInfo();
  }, []);

  const categories = [
    { id: "all", name: "Tous" },
    { id: "organisation", name: "Organisation" },
    { id: "methode", name: "Méthodes" },
    { id: "entrainement", name: "Entraînement" },
    { id: "bienetre", name: "Bien-être" },
    { id: "francais", name: "Français/Dissertation" },
    { id: "sciences", name: "Sciences" }
  ];

  const filteredTips = tips.filter(tip => {
    if (selectedCategory !== "all" && tip.category !== selectedCategory) return false;
    if (tip.premium && !isPremium) return false;
    return true;
  });

  const premiumTipsCount = tips.filter(t => t.premium).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <Star className="w-4 h-4" />
          Méthode et astuces
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Comment réussir son BAC ?
        </h1>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
          Découvre nos conseils, techniques et astuces pour maximiser tes chances de réussite.
        </p>
        <div className="mt-3 text-sm text-gray-400">
          Série {userSerie} · {isPremium ? "🏆 Premium - Accès illimité" : `📖 Gratuit - ${filteredTips.length}/${tips.length} conseils visibles`}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat.id)}
            className="rounded-full px-4 py-1 text-sm"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Astuces */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredTips.map((tip) => (
          <Card key={tip.id} className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3 rounded-2xl text-amber-600 group-hover:scale-105 transition-transform">
                {iconMap[tip.icon] || <Lightbulb className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{tip.title}</h3>
                <p className="text-gray-600 mt-2 leading-relaxed">{tip.content}</p>
                {tip.premium && !isPremium && (
                  <div className="mt-3 inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">
                    <Star className="w-3 h-3" /> Conseil premium
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Section premium si non premium */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-500" />
              <div>
                <h3 className="font-bold text-gray-900">Débloque plus de conseils</h3>
                <p className="text-sm text-gray-600">{premiumTipsCount} conseils exclusifs réservés aux membres premium</p>
              </div>
            </div>
            <Link href="/premium">
              <Button className="bg-amber-500 hover:bg-amber-600">
                Devenir premium <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Section dernière minute */}
      <Card className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">Le jour de l'examen</h3>
              <p className="text-white/80 text-sm">Vérifie ton matériel la veille. Gère ton temps (10% lecture, 70% rédaction, 20% relecture). Relis-toi !</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">⚡</p>
            <p className="text-xs text-white/70">Confiance en toi</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
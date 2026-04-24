import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  GraduationCap, 
  Crown, 
  TrendingUp, 
  Award,
  Medal,
  Star,
  Trophy,
  Camera,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

interface Profile {
  id: string;
  full_name: string;
  serie: string;
  is_premium: boolean;
  points: number;
  completed_exercises: number;
  avatar_url: string | null;
  created_at: string;
}

interface Badge {
  id: number;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [serie, setSerie] = useState("");
  const { toast } = useToast();

  // Badges disponibles
  const badges: Badge[] = [
    { id: 1, name: "Débutant", icon: "🌱", description: "Premier exercice complété", earned: false },
    { id: 2, name: "Apprenti", icon: "📚", description: "10 exercices complétés", earned: false },
    { id: 3, name: "Confirmé", icon: "⭐", description: "50 exercices complétés", earned: false },
    { id: 4, name: "Expert", icon: "🏆", description: "100 exercices complétés", earned: false },
    { id: 5, name: "Premium", icon: "👑", description: "Abonnement premium actif", earned: false },
    { id: 6, name: "Persévérant", icon: "🔥", description: "7 jours de connexion consécutifs", earned: false }
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    // Récupérer le profil
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || "");
      setSerie(profileData.serie || user.user_metadata?.serie || "");
    } else {
      // Créer un profil si inexistant
      const newProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || "",
        serie: user.user_metadata?.serie || "A",
        is_premium: false,
        points: 0,
        completed_exercises: 0,
        avatar_url: null,
        created_at: new Date().toISOString()
      };
      await supabase.from("profiles").insert(newProfile);
      setProfile(newProfile);
      setFullName(newProfile.full_name);
      setSerie(newProfile.serie);
    }
    
    setLoading(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, serie })
      .eq("id", profile.id);
    
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Profil mis à jour" });
      setProfile({ ...profile, full_name: fullName, serie });
    }
    setSaving(false);
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    
    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);
    
    if (uploadError) {
      toast({ title: "Erreur", description: "Impossible d'uploader l'image", variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      
      if (updateError) {
        toast({ title: "Erreur", description: "Impossible de mettre à jour l'avatar", variant: "destructive" });
      } else {
        setProfile({ ...profile, avatar_url: publicUrl });
        toast({ title: "Succès", description: "Photo de profil mise à jour" });
      }
    }
    
    setUploading(false);
  }

  // Calculer les badges obtenus
  const earnedBadges = badges.map(badge => {
    if (badge.name === "Débutant" && (profile?.completed_exercises || 0) >= 1) badge.earned = true;
    if (badge.name === "Apprenti" && (profile?.completed_exercises || 0) >= 10) badge.earned = true;
    if (badge.name === "Confirmé" && (profile?.completed_exercises || 0) >= 50) badge.earned = true;
    if (badge.name === "Expert" && (profile?.completed_exercises || 0) >= 100) badge.earned = true;
    if (badge.name === "Premium" && profile?.is_premium) badge.earned = true;
    return badge;
  });

  const progressPercentage = Math.min(100, Math.round(((profile?.completed_exercises || 0) / 100) * 100));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500">Gère tes informations personnelles</p>
      </div>

      {/* Carte principale */}
      <Card className="p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-blue-500" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            {uploading && <p className="text-xs text-gray-500">Upload...</p>}
            
            {/* Badge premium */}
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${profile?.is_premium ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
              {profile?.is_premium ? <Crown className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              {profile?.is_premium ? "Premium" : "Gratuit"}
            </div>
          </div>

          {/* Formulaire */}
          <div className="flex-1 space-y-4">
            <div>
              <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> Email</Label>
              <Input value={profile?.id || ""} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Nom complet</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ton nom" />
            </div>
            <div>
              <Label className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-gray-400" /> Série</Label>
              <select value={serie} onChange={(e) => setSerie(e.target.value)} className="w-full p-2 rounded-xl border">
                <option value="A">Série A</option>
                <option value="C">Série C</option>
                <option value="D">Série D</option>
              </select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <Card className="p-6 rounded-2xl shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5" /> Ma progression</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{profile?.completed_exercises || 0}</p>
            <p className="text-xs text-white/70">Exos faits</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{Math.floor((profile?.completed_exercises || 0) / 10)}</p>
            <p className="text-xs text-white/70">Badges</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{profile?.points || 0}</p>
            <p className="text-xs text-white/70">Points</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{progressPercentage}%</p>
            <p className="text-xs text-white/70">Complétion</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div className="bg-white rounded-full h-2" style={{ width: `${progressPercentage}%` }} />
        </div>
      </Card>

      {/* Badges et médailles */}
      <Card className="p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-amber-500" /> Badges et médailles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {earnedBadges.map((badge) => (
            <div key={badge.id} className={`text-center p-3 rounded-xl transition-all ${badge.earned ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 opacity-50'}`}>
              <div className="text-3xl mb-1">{badge.icon}</div>
              <p className="text-xs font-medium text-gray-900">{badge.name}</p>
              <p className="text-[10px] text-gray-500 mt-1">{badge.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Classement */}
      <Card className="p-6 rounded-2xl shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Classement général</h2>
              <p className="text-sm text-gray-600">Voir où tu te situes parmi les élèves</p>
            </div>
          </div>
          <Link href="/ranking">
            <Button className="bg-amber-500 hover:bg-amber-600">
              Voir le classement →
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
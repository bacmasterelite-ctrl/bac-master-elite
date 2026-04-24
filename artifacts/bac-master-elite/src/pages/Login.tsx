import { useState } from "react";
import { GraduationCap, Loader2, Mail, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const SERIES = [
  { id: "A", title: "Série A", desc: "Lettres, philosophie, langues" },
  { id: "C", title: "Série C", desc: "Maths, physique, sciences" },
  { id: "D", title: "Série D", desc: "Sciences naturelles, biologie" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedSerie, setSelectedSerie] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const { toast } = useToast();

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSerie) {
      toast({ title: "Série manquante", description: "Choisis ta série", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    
    // Inscription avec la série dans les métadonnées
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          serie: selectedSerie   // ← la série est stockée ici !
        }
      },
    });
    
    setLoading(false);
    
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    
    if (data.user && !data.session) {
      setNeedsConfirm(true);
      toast({ title: "Vérifie ton email", description: "Clique sur le lien reçu par email" });
      return;
    }
    
    if (data.user && data.session) {
      // Connexion directe
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">BAC MASTER</h1>
              <p className="text-sm text-blue-100 -mt-1">ELITE</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Réussis ton BAC avec confiance.
          </h2>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 rounded-3xl shadow-xl border-0">
          {needsConfirm ? (
            <div className="text-center py-6">
              <Mail className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">Vérifie ton email</h2>
              <p className="text-sm text-gray-500 mt-2">Clique sur le lien reçu à <br/><strong>{email}</strong></p>
              <Button variant="ghost" onClick={() => setNeedsConfirm(false)} className="mt-4">Retour</Button>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid grid-cols-2 w-full rounded-xl mb-6">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={onSignIn} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Mot de passe</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={onSignUp} className="space-y-4">
                  <div>
                    <Label>Nom complet</Label>
                    <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Mot de passe (6 caractères min)</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div>
                    <Label>Ta série</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {SERIES.map((s) => (
                        <Button
                          key={s.id}
                          type="button"
                          variant={selectedSerie === s.id ? "default" : "outline"}
                          onClick={() => setSelectedSerie(s.id)}
                          className="text-sm"
                        >
                          {s.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" disabled={loading || !selectedSerie} className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer mon compte"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
}
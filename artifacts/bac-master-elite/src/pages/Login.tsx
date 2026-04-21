import { useState } from "react";
import { GraduationCap, Loader2, Mail, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const { toast } = useToast();

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur de connexion", description: error.message, variant: "destructive" });
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur d'inscription", description: error.message, variant: "destructive" });
      return;
    }
    if (data.user && !data.session) {
      setNeedsConfirm(true);
      toast({ title: "Compte créé", description: "Vérifie tes emails pour confirmer ton inscription." });
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
          <p className="text-blue-100 text-lg leading-relaxed">
            Cours, exercices interactifs, annales, tuteur IA et méthodologie —
            tout ce qu'il te faut pour décrocher la meilleure mention. Séries A, C, D.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { n: "1000+", l: "Exercices" },
              { n: "300+", l: "Cours" },
              { n: "24/7", l: "Tuteur IA" },
            ].map((s) => (
              <div key={s.l} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{s.n}</div>
                <div className="text-xs text-blue-100 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 rounded-3xl shadow-xl border-0">
          <div className="lg:hidden flex items-center gap-2.5 mb-6 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">BAC MASTER</div>
              <div className="text-[10px] text-gray-500 -mt-0.5 tracking-wider">ELITE</div>
            </div>
          </div>

          {needsConfirm ? (
            <div className="text-center py-6">
              <Mail className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">Vérifie ton email</h2>
              <p className="text-sm text-gray-500 mt-2">
                Nous avons envoyé un lien de confirmation à <br/><strong>{email}</strong>.
                Clique dessus puis reviens te connecter.
              </p>
              <Button
                variant="ghost"
                onClick={() => setNeedsConfirm(false)}
                className="mt-4"
                data-testid="button-back-to-login"
              >
                Retour
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid grid-cols-2 w-full rounded-xl mb-6">
                <TabsTrigger value="signin" data-testid="tab-signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={onSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="email-in">Email</Label>
                    <Input
                      id="email-in"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ton@email.com"
                      className="mt-1.5 rounded-xl"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-in">Mot de passe</Label>
                    <Input
                      id="password-in"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="mt-1.5 rounded-xl"
                      data-testid="input-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl h-11"
                    data-testid="button-signin"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={onSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="name-up">Nom complet</Label>
                    <Input
                      id="name-up"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Aïcha Diop"
                      className="mt-1.5 rounded-xl"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-up">Email</Label>
                    <Input
                      id="email-up"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ton@email.com"
                      className="mt-1.5 rounded-xl"
                      data-testid="input-email-signup"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-up">Mot de passe</Label>
                    <Input
                      id="password-up"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="6 caractères minimum"
                      className="mt-1.5 rounded-xl"
                      data-testid="input-password-signup"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl h-11"
                    data-testid="button-signup"
                  >
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

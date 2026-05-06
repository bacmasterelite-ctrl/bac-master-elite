import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    const target = forgotEmail.trim() || email.trim();
    if (!target) {
      toast({
        title: "Email manquant",
        description: "Saisissez votre adresse email.",
        variant: "destructive",
      });
      return;
    }
    setForgotSending(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo,
    });
    setForgotSending(false);
    if (error) {
      toast({
        title: "Envoi impossible",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Email envoyé",
      description:
        "Vérifiez votre boîte mail (et les spams) pour le lien de réinitialisation.",
    });
    setForgotOpen(false);
    setForgotEmail("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      const msg = typeof error === "string" ? error.toLowerCase() : "";
      const isEmailErr =
        msg.includes("invalid login") ||
        msg.includes("user not found") ||
        msg.includes("email");
      toast({
        title: isEmailErr ? "Email incorrect" : "Mot de passe incorrect",
        description: isEmailErr
          ? "Aucun compte trouvé pour cet email."
          : "Le mot de passe saisi est incorrect.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Bienvenue !", description: "Connexion réussie." });
    setLocation("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-hero-gradient lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">BAC MASTER ELITE</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-bold leading-tight">"Avec BAC MASTER ELITE, j'ai obtenu une mention Très Bien."</h2>
            <p className="mt-4 text-white/80">— Aïcha K., Bachelière série D, 2025</p>
          </motion.div>
          <p className="text-sm text-white/70">© {new Date().getFullYear()} BAC MASTER ELITE</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">BAC MASTER ELITE</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Bon retour parmi nous</h1>
          <p className="mt-2 text-muted-foreground">Connectez-vous pour reprendre votre préparation.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="pl-9"
                  data-testid="input-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-xs font-medium text-blue-600 hover:underline"
                  data-testid="link-forgot-password"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  data-testid="input-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full bg-hero-gradient text-white hover:opacity-90"
              data-testid="button-submit-login"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
              Créer un compte gratuitement
            </Link>
          </p>
        </motion.div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Mot de passe oublié
            </DialogTitle>
            <DialogDescription>
              Recevez un lien par email pour choisir un nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Adresse email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="pl-9"
                  data-testid="input-forgot-email"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotOpen(false)}
                disabled={forgotSending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={forgotSending}
                className="bg-hero-gradient text-white hover:opacity-90"
                data-testid="button-send-reset-email"
              >
                {forgotSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Envoyer le lien"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

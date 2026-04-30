import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, Lock, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  // Supabase ouvre une session "recovery" en lisant le token du hash de l'URL.
  // On vérifie qu'on a bien une session avant d'autoriser le changement.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasRecoverySession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasRecoverySession(!!session);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Échec de la mise à jour",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Mot de passe mis à jour",
      description: "Vous pouvez maintenant vous connecter.",
    });
    // On signe out la session "recovery" puis on renvoie vers login
    await supabase.auth.signOut();
    setLocation("/login");
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ShieldCheck className="mb-4 h-10 w-10 text-white/90" />
            <h2 className="text-3xl font-bold leading-tight">
              Choisissez un nouveau mot de passe
            </h2>
            <p className="mt-3 text-white/80">
              Pour protéger votre compte, utilisez au moins 6 caractères et
              évitez les mots de passe trop simples.
            </p>
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

          <h1 className="text-3xl font-bold tracking-tight">
            Réinitialiser le mot de passe
          </h1>
          <p className="mt-2 text-muted-foreground">
            Saisissez votre nouveau mot de passe ci-dessous.
          </p>

          {hasRecoverySession === false && (
            <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">Lien expiré ou invalide</p>
              <p className="mt-1">
                Le lien de réinitialisation a expiré ou a déjà été utilisé.{" "}
                <Link
                  href="/login"
                  className="font-semibold text-amber-900 underline dark:text-amber-100"
                >
                  Demandez-en un nouveau
                </Link>
                .
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  className="pl-9"
                  data-testid="input-new-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Retapez votre mot de passe"
                  className="pl-9"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting || hasRecoverySession === false}
              className="w-full bg-hero-gradient text-white hover:opacity-90"
              data-testid="button-submit-reset"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  Mettre à jour
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

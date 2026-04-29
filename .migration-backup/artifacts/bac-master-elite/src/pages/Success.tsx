import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Crown, Sparkles, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function Success() {
  const qc = useQueryClient();

  // Le webhook GeniusPay met à jour Supabase de façon asynchrone : on
  // refetch le profil quelques fois pour voir le statut Premium passer.
  useEffect(() => {
    const intervals = [1500, 4000, 8000];
    const timers = intervals.map((ms) =>
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["payments"] });
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [qc]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/30 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15"
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </motion.div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
          Paiement confirmé !
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Merci pour votre abonnement à <strong>BAC MASTER ELITE</strong>.
          Votre accès <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700">
            <Crown className="h-3 w-3" />
            Premium
          </span>{" "}
          est en cours d'activation.
        </p>

        <div className="mt-6 grid gap-2 rounded-2xl bg-muted/40 p-4 text-left text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Ce qui vous attend :
          </p>
          <ul className="space-y-1 pl-6 text-muted-foreground">
            <li>• Tous les cours, exercices et annales débloqués</li>
            <li>• Tuteur IA disponible sans limite</li>
            <li>• PDF téléchargeables hors ligne</li>
          </ul>
        </div>

        <Link href="/dashboard">
          <Button
            size="lg"
            className="mt-6 w-full rounded-full bg-hero-gradient text-white hover:opacity-90"
            data-testid="button-success-dashboard"
          >
            Aller au tableau de bord
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        <p className="mt-4 text-xs text-muted-foreground">
          L'activation est généralement instantanée. Si rien ne s'affiche d'ici
          1 minute, rafraîchissez la page.
        </p>
      </motion.div>
    </div>
  );
}

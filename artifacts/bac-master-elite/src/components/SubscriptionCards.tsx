import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartCheckout } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Plan = "mensuel" | "annuel";

const FEATURES: string[] = [
  "Accès illimité à tous les cours",
  "Toutes les annales corrigées en PDF",
  "Tuteur IA Gemini sans limite (24/7)",
  "Méthodologie & exemples premium",
  "Suivi de progression avancé",
  "Support prioritaire",
];

const PLANS: Array<{
  id: Plan;
  title: string;
  price: number;
  pricePerMonth: string;
  badge?: string;
  highlight?: boolean;
  cta: string;
}> = [
  {
    id: "mensuel",
    title: "Premium Mensuel",
    price: 1499,
    pricePerMonth: "1 499 XOF / mois",
    cta: "Choisir mensuel",
  },
  {
    id: "annuel",
    title: "Premium Annuel",
    price: 10499,
    pricePerMonth: "≈ 875 XOF / mois",
    badge: "Économisez 42%",
    highlight: true,
    cta: "Choisir annuel",
  },
];

export default function SubscriptionCards() {
  const { mutateAsync: startCheckout, isPending } = useStartCheckout();
  const { toast } = useToast();
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);

  const handleSelect = async (plan: Plan) => {
    setPendingPlan(plan);
    try {
      await startCheckout(plan);
      // window.location.href is handled inside the mutation
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Paiement indisponible.";
      toast({
        title: "Impossible de démarrer le paiement",
        description: message,
        variant: "destructive",
      });
      setPendingPlan(null);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {PLANS.map((p, i) => {
        const loading = isPending && pendingPlan === p.id;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-7",
              p.highlight
                ? "border-amber-400/50 ring-2 ring-amber-400/30"
                : "border-border",
            )}
            data-testid={`plan-${p.id}`}
          >
            {p.highlight && (
              <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                <Sparkles className="h-3 w-3" />
                {p.badge ?? "Le plus choisi"}
              </span>
            )}

            <div className="mb-4 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl",
                  p.highlight
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                    : "bg-blue-500/10 text-blue-600",
                )}
              >
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.pricePerMonth}</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-4xl font-extrabold tracking-tight">
                {p.price.toLocaleString("fr-FR")}
                <span className="ml-1 text-base font-semibold text-muted-foreground">
                  XOF
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {p.id === "mensuel"
                  ? "Renouvelé chaque mois"
                  : "Renouvelé chaque année"}
              </p>
            </div>

            <ul className="mb-6 flex-1 space-y-2.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSelect(p.id)}
              disabled={isPending}
              size="lg"
              className={cn(
                "w-full rounded-full",
                p.highlight
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                  : "bg-hero-gradient text-white hover:opacity-90",
              )}
              data-testid={`button-checkout-${p.id}`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection vers GeniusPay…
                </>
              ) : (
                p.cta
              )}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

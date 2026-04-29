import { motion } from "framer-motion";
import { Crown, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import SubscriptionCards from "@/components/SubscriptionCards";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useMyPayments, usePremiumStatus } from "@/lib/queries";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  initie: { label: "Initié", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  succes: { label: "Réussi", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  echec: { label: "Échec", cls: "bg-rose-500/15 text-rose-700 border-rose-500/30" },
  rembourse: { label: "Remboursé", cls: "bg-slate-500/15 text-slate-700 border-slate-500/30" },
};

export default function Upgrade() {
  const { user } = useAuth();
  const { isPremium, expiresAt, plan } = usePremiumStatus(user?.id);
  const { data: payments = [] } = useMyPayments(user?.id);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-hero-gradient p-6 text-white sm:p-8"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <Crown className="h-3.5 w-3.5" />
                Abonnement Premium
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Débloquez tout le potentiel de BAC MASTER ELITE
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/85">
                Paiement 100% automatique via GeniusPay (Wave, Orange Money, MTN MoMo).
                Accès activé instantanément, sans capture d'écran à envoyer.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs">
                <ShieldCheck className="h-3 w-3" />
                Sécurisé
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs">
                <Zap className="h-3 w-3" />
                Activation instantanée
              </div>
            </div>
          </div>
        </motion.div>

        {isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border-l-4 border-l-emerald-500 border border-border bg-card p-5 shadow-sm"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-semibold">Vous êtes Premium ✨</p>
              <p className="text-sm text-muted-foreground">
                {plan ? `Plan ${plan} actif. ` : ""}
                {expiresAt
                  ? `Renouvellement nécessaire le ${new Date(expiresAt).toLocaleDateString("fr-FR")}.`
                  : "Profitez de toutes les ressources."}
              </p>
            </div>
          </motion.div>
        )}

        <SubscriptionCards />

        {payments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">Mes paiements</h2>
            <div className="mt-4 space-y-2">
              {payments.map((p) => {
                const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.initie;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                    data-testid={`row-payment-${p.id}`}
                  >
                    <div>
                      <p className="text-sm font-semibold capitalize">
                        {p.plan} • {p.amount.toLocaleString("fr-FR")} {p.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString("fr-FR")} • Réf. {p.provider_ref}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

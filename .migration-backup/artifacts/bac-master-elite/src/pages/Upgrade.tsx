import { useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Check,
  Upload,
  Loader2,
  Copy,
  Sparkles,
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import {
  useMySubscriptions,
  useProfile,
  useSubmitPaymentProof,
} from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PHONE_NUMBER = "+225 07 00 00 00 00";
const AMOUNT = 5000;

const METHODS = [
  {
    id: "wave" as const,
    name: "Wave",
    color: "from-cyan-400 to-blue-500",
    bg: "bg-blue-500",
    initial: "W",
    desc: "Transfert gratuit",
  },
  {
    id: "mtn" as const,
    name: "MTN MoMo",
    color: "from-yellow-400 to-amber-500",
    bg: "bg-yellow-400",
    initial: "M",
    desc: "Mobile Money MTN",
  },
  {
    id: "orange" as const,
    name: "Orange Money",
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-500",
    initial: "O",
    desc: "Orange Money",
  },
];

const FEATURES = [
  "Accès illimité à tous les cours",
  "Toutes les annales corrigées",
  "Tuteur IA disponible 24/7",
  "Suivi de progression avancé",
  "Méthodologie premium",
  "Support prioritaire",
];

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  en_attente: { label: "En attente", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Clock },
  valide: { label: "Validé", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: CheckCircle2 },
  rejete: { label: "Rejeté", cls: "bg-rose-500/15 text-rose-700 border-rose-500/30", icon: XCircle },
};

export default function Upgrade() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: subs = [] } = useMySubscriptions(user?.id);
  const { mutateAsync: submitProof, isPending } = useSubmitPaymentProof();
  const { toast } = useToast();

  const [method, setMethod] = useState<"wave" | "mtn" | "orange" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isPremium = profile?.is_premium === true;

  const copy = () => {
    navigator.clipboard.writeText(PHONE_NUMBER);
    toast({ title: "Numéro copié", description: PHONE_NUMBER });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!method) {
      toast({ title: "Choisissez un moyen de paiement", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Capture d'écran requise", description: "Joignez la preuve de paiement.", variant: "destructive" });
      return;
    }
    try {
      await submitProof({ userId: user.id, file, paymentMethod: method, amount: AMOUNT, plan: "premium_mensuel" });
      toast({
        title: "Preuve envoyée !",
        description: "Votre paiement sera vérifié sous 24h.",
      });
      setFile(null);
      setMethod(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast({
        title: "Erreur d'envoi",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-hero-gradient p-6 text-white sm:p-8"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <Crown className="h-3.5 w-3.5" />
                <span>Plan Premium</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Passez à Premium
              </h1>
              <p className="mt-2 max-w-lg text-sm text-white/85">
                Accédez à toutes les ressources illimitées et boostez votre préparation au BAC.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-white/70">À partir de</p>
              <p className="text-3xl font-extrabold">5 000 <span className="text-base font-semibold">FCFA</span></p>
              <p className="text-xs text-white/80">/ mois</p>
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
              <p className="font-semibold">Vous êtes déjà Premium ✨</p>
              <p className="text-sm text-muted-foreground">
                Profitez pleinement de toutes les ressources disponibles.
              </p>
            </div>
          </motion.div>
        )}

        {/* Features card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border border-l-4 border-l-blue-600 bg-card p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Ce que vous obtenez
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Payment instructions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border border-l-4 border-l-emerald-500 bg-card p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Smartphone className="h-5 w-5 text-emerald-500" />
            Paiement Mobile Money
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Effectuez un transfert au numéro ci-dessous, puis envoyez la capture d'écran.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover-elevate",
                  method === m.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                    : "border-border bg-card",
                )}
                data-testid={`payment-${m.id}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${m.color} text-lg font-extrabold text-white shadow-sm`}>
                  {m.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.desc}</p>
                </div>
                {method === m.id && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-muted/40 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Numéro de transfert
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-2xl font-bold tracking-wider">{PHONE_NUMBER}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={copy}
                className="rounded-full"
                data-testid="button-copy-number"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copier
              </Button>
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-card p-3">
                <p className="text-xs text-muted-foreground">Montant</p>
                <p className="font-bold">5 000 FCFA</p>
              </div>
              <div className="rounded-xl bg-card p-3">
                <p className="text-xs text-muted-foreground">Bénéficiaire</p>
                <p className="font-bold">BAC MASTER ELITE</p>
              </div>
              <div className="rounded-xl bg-card p-3">
                <p className="text-xs text-muted-foreground">Validation</p>
                <p className="font-bold">Sous 24h</p>
              </div>
            </div>
          </div>

          {/* Proof upload */}
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold">Capture d'écran de paiement</label>
              <div className="mt-2">
                <label
                  htmlFor="proof"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center hover-elevate"
                >
                  <Upload className="h-6 w-6 text-blue-600" />
                  {file ? (
                    <>
                      <p className="text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} Ko • Cliquer pour changer
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold">Cliquer pour téléverser</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG jusqu'à 5 Mo</p>
                    </>
                  )}
                </label>
                <input
                  ref={fileRef}
                  id="proof"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  data-testid="input-proof"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full rounded-full bg-hero-gradient text-white hover:opacity-90"
              data-testid="button-submit-proof"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi de la preuve...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Envoyer la preuve de paiement
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Past requests */}
        {subs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">Mes demandes</h2>
            <div className="mt-4 space-y-2">
              {subs.map((s) => {
                const st = STATUS_STYLES[s.status] ?? STATUS_STYLES.en_attente;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3"
                    data-testid={`row-sub-${s.id}`}
                  >
                    <div>
                      <p className="text-sm font-semibold capitalize">
                        {s.payment_method ?? "—"} • {s.amount.toLocaleString("fr-FR")} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", st.cls)}>
                      <st.icon className="h-3 w-3" />
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

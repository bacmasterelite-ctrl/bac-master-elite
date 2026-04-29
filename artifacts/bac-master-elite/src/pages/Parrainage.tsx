import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Copy,
  Share2,
  Sparkles,
  MousePointerClick,
  Trophy,
  CheckCircle2,
  Loader2,
  Gift,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { useMyInvitation, useEnsureInvitation } from "@/lib/extensions";

const POINTS_PER_CLICK = 10;

export default function Parrainage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: invitation, isLoading } = useMyInvitation(user?.id);
  const ensureInvitation = useEnsureInvitation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || isLoading) return;
    if (!invitation) {
      ensureInvitation.mutate(user.id);
    }
  }, [user, invitation, isLoading, ensureInvitation]);

  const code = invitation?.invitation_code ?? "";
  const clicks = invitation?.clicks ?? 0;
  const earned = clicks * POINTS_PER_CLICK;

  const inviteUrl = useMemo(() => {
    if (!code || typeof window === "undefined") return "";
    const origin = window.location.origin;
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    return `${origin}${base}/?ref=${code}`;
  }, [code]);

  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: "Lien copié", description: "Partagez-le sur WhatsApp, TikTok…" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copie impossible",
        description: "Sélectionnez et copiez le lien manuellement.",
        variant: "destructive",
      });
    }
  };

  const shareNative = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins-moi sur BAC MASTER ELITE",
          text: `Prépare ton BAC avec moi sur BAC MASTER ELITE — cours, exercices, Tuteur IA.`,
          url: inviteUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      void copyLink();
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-600">
            Parrainage
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Invitez vos amis, gagnez des points
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            +{POINTS_PER_CLICK} points ajoutés à votre profil pour chaque clic
            sur votre lien d'invitation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MousePointerClick className="h-3.5 w-3.5" />
              Clics
            </div>
            <p className="mt-2 text-3xl font-extrabold text-blue-600">{clicks}</p>
            <p className="text-xs text-muted-foreground">amis ont cliqué</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Points gagnés
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">
              +{earned}
            </p>
            <p className="text-xs text-muted-foreground">via le parrainage</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" />
              Vos points totaux
            </div>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">
              {(profile?.points ?? 0).toLocaleString("fr-FR")}
            </p>
            <p className="text-xs text-muted-foreground">tous gains confondus</p>
          </motion.div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hero-gradient">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-base font-bold">Votre lien d'invitation</p>
              <p className="text-sm text-muted-foreground">
                Partagez-le avec vos camarades de classe.
              </p>
            </div>
          </div>

          {!user || isLoading || !invitation ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Préparation de votre code…
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 font-mono text-xs"
                  data-testid="input-invite-link"
                />
                <Button
                  onClick={copyLink}
                  variant="outline"
                  className="rounded-full"
                  data-testid="button-copy-link"
                >
                  {copied ? (
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? "Copié" : "Copier"}
                </Button>
                <Button
                  onClick={shareNative}
                  className="rounded-full bg-hero-gradient text-white hover:opacity-90"
                  data-testid="button-share-link"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </Button>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-mono">
                <span className="text-muted-foreground">Code :</span>
                <span className="font-bold tracking-wider">{code}</span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold">Comment ça marche</p>
          <ol className="mt-3 space-y-3">
            {[
              {
                icon: Users,
                title: "Partagez votre lien",
                desc: "WhatsApp, TikTok, Instagram, SMS — tout fonctionne.",
              },
              {
                icon: MousePointerClick,
                title: "Vos amis cliquent",
                desc: "Chaque clic est compté automatiquement.",
              },
              {
                icon: Sparkles,
                title: `+${POINTS_PER_CLICK} points par clic`,
                desc: "Vos points sont ajoutés instantanément à votre profil.",
              },
              {
                icon: Trophy,
                title: "Grimpez au classement",
                desc: "Plus de points = meilleur rang sur le leaderboard.",
              },
            ].map((step, i) => (
              <li key={step.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                  <step.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {i + 1}. {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}

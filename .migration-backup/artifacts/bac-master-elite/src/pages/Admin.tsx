import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Redirect } from "wouter";
import {
  ShieldCheck,
  Check,
  X,
  Loader2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import {
  getProofSignedUrl,
  usePendingSubscriptions,
  useProfile,
  useValidateSubscription,
} from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Admin() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: pending = [], isLoading } = usePendingSubscriptions();
  const { mutateAsync: validate, isPending: validating } = useValidateSubscription();
  const { toast } = useToast();

  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewPath) {
      setPreviewUrl(null);
      return;
    }
    let active = true;
    getProofSignedUrl(previewPath).then((url) => {
      if (active) setPreviewUrl(url);
    });
    return () => {
      active = false;
    };
  }, [previewPath]);

  if (loading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile?.is_admin) {
    return <Redirect to="/dashboard" />;
  }

  const onDecide = async (subscriptionId: string, userId: string, approve: boolean) => {
    try {
      await validate({ subscriptionId, userId, approve });
      toast({
        title: approve ? "Paiement validé" : "Paiement rejeté",
        description: approve
          ? "L'utilisateur est passé en Premium."
          : "La demande a été marquée comme rejetée.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Réessayez.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Administration
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
              Validation des paiements
            </h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border border-l-4 border-l-amber-500 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">En attente</p>
                <p className="text-2xl font-extrabold">{pending.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border border-l-4 border-l-emerald-500 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Action</p>
                <p className="text-base font-bold">Vérifier les preuves</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border border-l-4 border-l-rose-500 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Rejeter</p>
                <p className="text-base font-bold">Si non valable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-bold">Aucune demande en attente</h3>
            <p className="text-sm text-muted-foreground">Les nouvelles preuves de paiement apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border border-l-4 border-l-blue-600 bg-card p-5 shadow-sm"
                data-testid={`row-pending-${s.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hero-gradient text-sm font-bold text-white">
                      {(s.profile?.full_name ?? s.profile?.email ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">{s.profile?.full_name ?? "Élève"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.profile?.email} • Série {s.profile?.serie ?? "?"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold capitalize">
                          {s.payment_method ?? "—"}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                          {s.amount.toLocaleString("fr-FR")} FCFA
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          {new Date(s.created_at).toLocaleString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {s.proof_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setPreviewPath(s.proof_url!)}
                        data-testid={`button-view-${s.id}`}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Voir la preuve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-rose-200 text-rose-700 hover:bg-rose-50"
                      disabled={validating}
                      onClick={() => onDecide(s.id, s.user_id, false)}
                      data-testid={`button-reject-${s.id}`}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Rejeter
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={validating}
                      onClick={() => onDecide(s.id, s.user_id, true)}
                      data-testid={`button-validate-${s.id}`}
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Valider
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!previewPath} onOpenChange={(open) => !open && setPreviewPath(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Capture d'écran de paiement</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex max-h-[70vh] items-center justify-center overflow-auto rounded-xl bg-muted/40 p-2">
            {previewUrl ? (
              <img src={previewUrl} alt="Preuve de paiement" className="max-h-[65vh] rounded-lg" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

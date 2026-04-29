import { motion } from "framer-motion";
import { Redirect } from "wouter";
import { ShieldCheck, Activity, ReceiptText, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Payment } from "@/lib/queries";

function useAllPayments() {
  return useQuery({
    queryKey: ["payments", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, profile:profiles(id, full_name, email, serie)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.warn("[supabase] payments admin:", error.message);
        return [];
      }
      return (data ?? []) as (Payment & {
        profile?: { id: string; full_name?: string; email?: string; serie?: string };
      })[];
    },
  });
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  initie: { label: "Initié", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  succes: { label: "Réussi", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  echec: { label: "Échec", cls: "bg-rose-500/15 text-rose-700 border-rose-500/30" },
  rembourse: { label: "Remboursé", cls: "bg-slate-500/15 text-slate-700 border-slate-500/30" },
};

export default function Admin() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: payments = [], isLoading } = useAllPayments();

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }
  if (!profile?.is_admin) return <Redirect to="/dashboard" />;

  const totalRevenue = payments
    .filter((p) => p.status === "succes")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-l-4 border-l-emerald-500 border border-border bg-card p-5"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-semibold">Validation manuelle désactivée</p>
              <p className="text-sm text-muted-foreground">
                Les paiements sont désormais 100% automatiques via GeniusPay.
                Le webhook met à jour <code>profiles.plan_expires_at</code> et
                insère la transaction dans <code>payments</code> sans intervention.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <ReceiptText className="h-3.5 w-3.5" />
              Transactions
            </div>
            <p className="mt-2 text-2xl font-bold">{payments.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Réussies
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {payments.filter((p) => p.status === "succes").length}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Revenu (XOF)
            </div>
            <p className="mt-2 text-2xl font-bold">
              {totalRevenue.toLocaleString("fr-FR")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold">Derniers paiements</h2>

          {isLoading ? (
            <div className="mt-6 flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : payments.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Aucun paiement enregistré pour le moment.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Élève</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Montant</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2">Réf.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => {
                    const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.initie;
                    return (
                      <tr key={p.id} data-testid={`row-admin-payment-${p.id}`}>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-2">
                          <p className="font-semibold">
                            {p.profile?.full_name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.profile?.email ?? p.user_id}
                          </p>
                        </td>
                        <td className="px-4 py-2 capitalize">{p.plan}</td>
                        <td className="px-4 py-2 font-semibold">
                          {p.amount.toLocaleString("fr-FR")} {p.currency}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">
                          {p.provider_ref}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import {
  useAdminListPayments,
  useAdminApprovePayment,
  useAdminRejectPayment,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, ExternalLink } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const { data, isLoading } = useAdminListPayments({ status });
  const queryClient = useQueryClient();
  const approve = useAdminApprovePayment({
    mutation: { onSuccess: () => queryClient.invalidateQueries() },
  });
  const reject = useAdminRejectPayment({
    mutation: { onSuccess: () => queryClient.invalidateQueries() },
  });

  return (
    <div>
      <PageHeader title="Paiements" subtitle="Valide ou rejette les demandes Premium." />
      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)} className="mb-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="pending" data-testid="tab-pending">En attente</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Validés</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">Rejetés</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid sm:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="text-sm text-gray-500">Chargement...</div>
        ) : (
          data?.map((p) => (
            <Card key={p.id} className="p-5 rounded-2xl border-0 shadow-sm" data-testid={`card-payment-${p.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{p.userName || p.userEmail}</div>
                  <div className="text-xs text-gray-500">{p.userEmail}</div>
                </div>
                <Badge className={`${STATUS_COLOR[p.status]} hover:${STATUS_COLOR[p.status]}`}>{p.status}</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">{p.amount} XOF</div>
              <div className="text-xs text-gray-500 mb-3">{p.method.toUpperCase()} · {new Date(p.createdAt).toLocaleString("fr-FR")}</div>
              {p.proofUrl && (
                <a href={`/api/storage${p.proofUrl}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 inline-flex items-center gap-1 hover:underline mb-3">
                  Voir la preuve <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {p.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => approve.mutate({ id: p.id })}
                    disabled={approve.isPending}
                    data-testid={`button-approve-${p.id}`}
                  >
                    <Check className="w-4 h-4 mr-1"/>Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-lg text-red-600 hover:text-red-700"
                    onClick={() => reject.mutate({ id: p.id })}
                    disabled={reject.isPending}
                    data-testid={`button-reject-${p.id}`}
                  >
                    <X className="w-4 h-4 mr-1"/>Rejeter
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
        {!isLoading && !data?.length && (
          <div className="text-sm text-gray-500 col-span-full text-center py-12">Aucun paiement.</div>
        )}
      </div>
    </div>
  );
}

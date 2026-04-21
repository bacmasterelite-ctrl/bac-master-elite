import { useState, useRef } from "react";
import {
  useGetMe,
  useGetPaymentInfo,
  useListMyPayments,
  useCreatePayment,
  useRequestUploadUrl,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Crown, CheckCircle2, Loader2, Upload, Phone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const FEATURES = [
  "Toutes les annales corrigées (toutes années)",
  "Tuteur IA avec analyse d'images",
  "Téléchargement PDF illimité",
  "Statistiques détaillées de progression",
  "Badge Premium dans le classement",
];

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Validé",
  rejected: "Rejeté",
};

export default function PremiumPage() {
  const { data: profile } = useGetMe();
  const { data: info } = useGetPaymentInfo();
  const { data: myPayments } = useListMyPayments();
  const [method, setMethod] = useState<"wave" | "mtn" | "orange">("wave");
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const requestUpload = useRequestUploadUrl();
  const createPayment = useCreatePayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast({ title: "Paiement envoyé", description: "Un admin va valider sous 24h." });
        setProofUrl(null);
      },
    },
  });

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await requestUpload.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type },
      });
      await fetch(res.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setProofUrl(res.objectPath);
    } catch (e) {
      toast({ title: "Erreur", description: "Upload impossible.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (!info || !proofUrl) return;
    createPayment.mutate({
      data: { amount: info.price, method, proofUrl },
    });
  };

  if (profile?.isPremium) {
    return (
      <div>
        <PageHeader title="Premium" />
        <Card className="p-8 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 max-w-xl">
          <Crown className="w-12 h-12 text-amber-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">Tu es membre Premium !</div>
          <div className="text-gray-600 mt-1">Profite de tous les avantages sans limite.</div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Passe Premium" subtitle="Débloque tout le potentiel de BAC MASTER ELITE." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <Crown className="w-10 h-10 mb-4" />
          <div className="flex items-baseline gap-1">
            <div className="text-4xl font-bold">{info?.price ?? "—"}</div>
            <div className="text-lg">{info?.currency}</div>
          </div>
          <div className="text-sm text-amber-50 mt-1">paiement unique · accès à vie</div>
          <ul className="mt-6 space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 rounded-2xl border-0 shadow-sm">
          <div className="text-lg font-semibold text-gray-900 mb-2">Comment payer ?</div>
          <ol className="text-sm text-gray-600 space-y-1 mb-5 list-decimal list-inside">
            <li>Choisis un opérateur ci-dessous</li>
            <li>Envoie {info?.price} {info?.currency} au numéro indiqué</li>
            <li>Fais une capture d'écran de la confirmation</li>
            <li>Téléverse-la et soumets ta demande</li>
          </ol>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {info?.methods.map((m) => (
              <button
                key={m.method}
                onClick={() => setMethod(m.method)}
                data-testid={`button-method-${m.method}`}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  method === m.method ? "border-blue-600 bg-blue-50" : "border-gray-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Numéro {info?.methods.find(m=>m.method===method)?.label}</div>
              <div className="font-semibold text-gray-900" data-testid="text-payment-number">
                {info?.methods.find(m=>m.method===method)?.number}
              </div>
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            variant="outline"
            disabled={uploading}
            className="w-full rounded-xl mb-3"
            data-testid="button-upload-proof"
          >
            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Upload...</> : <><Upload className="w-4 h-4 mr-2"/>{proofUrl ? "Capture jointe ✓" : "Joindre la capture d'écran"}</>}
          </Button>
          <Button
            onClick={submit}
            disabled={!proofUrl || createPayment.isPending}
            className="w-full rounded-xl h-12"
            data-testid="button-submit-payment"
          >
            {createPayment.isPending ? "Envoi..." : "Soumettre la demande"}
          </Button>
        </Card>
      </div>

      {!!myPayments?.length && (
        <Card className="mt-6 p-6 rounded-2xl border-0 shadow-sm">
          <div className="text-lg font-semibold text-gray-900 mb-4">Mes demandes</div>
          <div className="space-y-3">
            {myPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {p.amount} XOF · {p.method.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(p.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>
                <Badge className={`${STATUS_COLOR[p.status]} hover:${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status] || p.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

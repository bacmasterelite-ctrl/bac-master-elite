import { motion } from "framer-motion";
import { ScrollText, Download, ArrowRight, Calendar, Crown, Lock } from "lucide-react";
import { Link } from "wouter";
import jsPDF from "jspdf";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAnnals, usePremiumStatus } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useToast } from "@/hooks/use-toast";

type DisplayAnnal = {
  matiere: string;
  serie: string;
  annee: number;
  duree: string;
  session: string;
  sujet: string;
  corrige: string;
};

const fallback: DisplayAnnal[] = [
  { matiere: "Mathématiques", serie: "D", annee: 2024, duree: "4h", session: "Juin", sujet: "", corrige: "" },
  { matiere: "Philosophie", serie: "A", annee: 2024, duree: "4h", session: "Juin", sujet: "", corrige: "" },
  { matiere: "Sciences Physiques", serie: "C", annee: 2024, duree: "3h", session: "Juin", sujet: "", corrige: "" },
  { matiere: "Français", serie: "A/C/D", annee: 2023, duree: "3h", session: "Juin", sujet: "", corrige: "" },
  { matiere: "SVT", serie: "D", annee: 2023, duree: "3h", session: "Septembre", sujet: "", corrige: "" },
  { matiere: "Histoire-Géo", serie: "A", annee: 2023, duree: "3h", session: "Juin", sujet: "", corrige: "" },
  { matiere: "Anglais", serie: "A/C/D", annee: 2022, duree: "3h", session: "Juin", sujet: "", corrige: "" },
  { matiere: "Mathématiques", serie: "C", annee: 2022, duree: "4h", session: "Juin", sujet: "", corrige: "" },
];

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function buildAnnalPdf(a: DisplayAnnal, kind: "sujet" | "corrige") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  let cursorY = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6);
  doc.text(`${kind === "sujet" ? "SUJET" : "CORRIGÉ"} — BAC ${a.serie}`, margin, cursorY);
  cursorY += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  const titleLines = doc.splitTextToSize(a.matiere, usableWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 24 + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Session ${a.session} ${a.annee} — Durée ${a.duree}`, margin, cursorY);
  cursorY += 18;

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);

  const body = (kind === "sujet" ? a.sujet : a.corrige).trim() ||
    (kind === "sujet"
      ? "Le sujet officiel sera intégré prochainement. Vous pouvez nous écrire pour le recevoir par email."
      : "Le corrigé détaillé sera publié prochainement.");
  const lines = doc.splitTextToSize(body, usableWidth);
  const lineHeight = 16;
  for (const line of lines) {
    if (cursorY + lineHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.text(
      `BAC MASTER ELITE — Annale ${a.matiere} ${a.annee} — Page ${p}/${totalPages}`,
      margin,
      pageHeight - 24,
    );
  }

  doc.save(`bac-master-elite-${kind}-${slug(a.matiere)}-${a.annee}.pdf`);
}

export default function Annales() {
  const { user } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus(user?.id);
  const { data: annals = [], isLoading } = useAnnals();
  const { toast } = useToast();

  const items: DisplayAnnal[] =
    annals.length > 0
      ? annals.map((a) => {
          const r = a as Record<string, unknown>;
          return {
            matiere: pickString(r, "subject", "matiere") || "Matière",
            serie: pickString(r, "serie") || "A/C/D",
            annee: (r.year as number) ?? (r.annee as number) ?? 2024,
            duree: pickString(r, "duration", "duree") || "3h",
            session: pickString(r, "session") || "Juin",
            sujet: pickString(r, "sujet", "subject_text", "enonce", "statement"),
            corrige: pickString(r, "corrige", "correction", "solution", "answer"),
          };
        })
      : fallback;

  const handleDownload = (a: DisplayAnnal, kind: "sujet" | "corrige") => {
    if (!isPremium) return;
    try {
      buildAnnalPdf(a, kind);
    } catch (err) {
      console.error("[annale pdf]", err);
      toast({
        title: "Téléchargement impossible",
        description: "Impossible de générer le PDF. Réessayez dans un instant.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">Examens officiels</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Annales du BAC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tous les sujets officiels avec corrections détaillées rédigées par des professeurs.
          </p>
        </div>

        {!premiumLoading && !isPremium && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-orange-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/25 text-amber-700">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Annales réservées aux membres Premium</p>
                <p className="text-xs text-amber-900/80">
                  Téléchargez les sujets officiels et leurs corrigés détaillés en PDF, accessibles hors ligne.
                </p>
              </div>
            </div>
            <Link href="/dashboard/upgrade">
              <Button className="rounded-full bg-amber-500 text-white hover:bg-amber-600" data-testid="button-annales-upgrade">
                Devenir Premium
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a, i) => (
              <motion.div
                key={a.matiere + a.annee + i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm hover-elevate"
                data-testid={`card-annal-${i}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                    <ScrollText className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Série {a.serie}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold leading-tight">{a.matiere}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Session {a.session} {a.annee} • {a.duree}
                </p>
                <div className="mt-5 flex gap-2">
                  {isPremium ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownload(a, "sujet")}
                        data-testid={`button-annal-sujet-${i}`}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Sujet
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-hero-gradient text-white hover:opacity-90"
                        onClick={() => handleDownload(a, "corrige")}
                        data-testid={`button-annal-corrige-${i}`}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Corrigé
                      </Button>
                    </>
                  ) : (
                    <Link href="/dashboard/upgrade" className="w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                        disabled={premiumLoading}
                        data-testid={`button-annal-locked-${i}`}
                      >
                        <Lock className="mr-1.5 h-3.5 w-3.5" />
                        Réservé Premium
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

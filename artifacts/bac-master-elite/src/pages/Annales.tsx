import { useMemo } from "react";
import { motion } from "framer-motion";
import { ScrollText, Download, ArrowRight, Calendar, Crown, Lock } from "lucide-react";
import { Link } from "wouter";
import jsPDF from "jspdf";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAnnals, usePremiumStatus, useProfile } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useToast } from "@/hooks/use-toast";

type DisplayAnnal = {
  matiere: string;
  serie: string;
  annee: number;
  duree: string;
  session: string;
  sujet_contenu: string;
  corrige_contenu: string;
};

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

// Matières autorisées par série
const MATIERES_PAR_SERIE: Record<string, string[]> = {
  A: ["anglais", "philosophie", "français", "histoire", "géographie", "francais", "histoire-geo", "histoire geo"],
  C: ["anglais", "philosophie", "français", "histoire", "géographie", "francais", "histoire-geo", "histoire geo", "mathématiques", "mathematiques", "maths", "physique", "chimie", "sciences physiques", "svt"],
  D: ["anglais", "philosophie", "français", "histoire", "géographie", "francais", "histoire-geo", "histoire geo", "mathématiques", "mathematiques", "maths", "physique", "chimie", "sciences physiques", "svt"],
};

function isAllowedForSerie(matiere: string, serie: string): boolean {
  const allowed = MATIERES_PAR_SERIE[serie] ?? MATIERES_PAR_SERIE["D"];
  const m = matiere.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return allowed.some((a) => m.includes(a.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}

function buildAnnalPdf(a: DisplayAnnal, kind: "sujet" | "corrige") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 72;
  const marginRight = 72;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;
  let cursorY = 60;

  // En-tête centré
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(217, 119, 6);
  doc.text(`${kind === "sujet" ? "SUJET" : "CORRIGÉ"} — BAC SÉRIE ${a.serie}`, centerX, cursorY, { align: "center" });
  cursorY += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.text(a.matiere.toUpperCase(), centerX, cursorY, { align: "center" });
  cursorY += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Session ${a.session} ${a.annee}  •  Durée : ${a.duree}  •  Coefficient : 4`, centerX, cursorY, { align: "center" });
  cursorY += 18;

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);

  const body = (kind === "sujet" ? a.sujet_contenu : a.corrige_contenu).trim() ||
    (kind === "sujet"
      ? "Le sujet officiel sera intégré prochainement."
      : "Le corrigé sera publié prochainement.");

  const lineHeight = 16;
  const paragraphs = body.split("\n");
  for (const para of paragraphs) {
    if (!para.trim()) { cursorY += 8; continue; }
    const isTitre = para.startsWith("##") || para.startsWith("EXERCICE") || para.startsWith("PROBLÈME") || para.startsWith("PARTIE");
    if (isTitre) {
      cursorY += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(249, 115, 22);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
    }
    const cleaned = para.replace(/^#+\s*/, "").replace(/\*\*/g, "");
    const lines = doc.splitTextToSize(cleaned, usableWidth);
    for (const line of lines) {
      if (cursorY + lineHeight > pageHeight - margin) { doc.addPage(); cursorY = margin; }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }
    if (isTitre) cursorY += 4;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `BAC MASTER ELITE — ${kind === "sujet" ? "Sujet" : "Corrigé"} ${a.matiere} ${a.annee} — Page ${p}/${totalPages}`,
      margin, pageHeight - 24
    );
  }

  doc.save(`bac-master-elite-${kind}-${slug(a.matiere)}-${a.annee}.pdf`);
}

export default function Annales() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus(user?.id);
  const { data: annals = [], isLoading } = useAnnals();
  const { toast } = useToast();

  const userSerie = profile?.serie ?? "D";

  const items = useMemo<DisplayAnnal[]>(() => {
    if (annals.length === 0) return [];
    return annals
      .map((a) => {
        const r = a as Record<string, unknown>;
        return {
          matiere: pickString(r, "matiere", "subject") || "Matière",
          serie: pickString(r, "serie") || "A/C/D",
          annee: (r.year as number) ?? (r.annee as number) ?? 2024,
          duree: pickString(r, "duree", "duration") || "3h",
          session: pickString(r, "session") || "Juin",
          sujet_contenu: pickString(r, "sujet_contenu", "sujet", "subject_text"),
          corrige_contenu: pickString(r, "corrige_contenu", "corrige", "correction"),
        };
      })
      .filter((a) => isAllowedForSerie(a.matiere, userSerie));
  }, [annals, userSerie]);

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
            Sujets officiels avec corrections détaillées — Série {userSerie}
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
                  Téléchargez les sujets officiels et leurs corrigés détaillés en PDF.
                </p>
              </div>
            </div>
            <Link href="/dashboard/upgrade">
              <Button className="rounded-full bg-amber-500 text-white hover:bg-amber-600">
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
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Aucune annale disponible pour votre série ({userSerie}) pour le moment.
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
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Sujet
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-hero-gradient text-white hover:opacity-90"
                        onClick={() => handleDownload(a, "corrige")}
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

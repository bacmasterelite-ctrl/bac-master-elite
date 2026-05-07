import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScrollText, Download, ArrowRight, Calendar, Crown, Lock, ChevronLeft, BookOpen, FileText } from "lucide-react";
import { Link } from "wouter";
import jsPDF from "jspdf";
import { isInAppBrowser } from "@/lib/pdf";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAnnals, usePremiumStatus, useProfile } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { subjectsForSerie, styleForSubject } from "@/lib/subjects";

type DisplayAnnal = {
  matiere: string;
  serie: string;
  annee: number;
  duree: string;
  session: string;
  sujet_contenu: string;
  corrige_contenu: string;
  type_examen?: string;
};

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

function getExamLabel(a: DisplayAnnal): string {
  const type = (a.type_examen ?? "").toLowerCase();
  const session = a.session;
  const annee = a.annee;
  if (type.includes("blanc")) return `Bac Blanc ${annee}`;
  if (type.includes("regional") || type.includes("régional")) return `Bac Régional ${annee}`;
  if (type.includes("national")) return `Bac National ${annee}`;
  if (session.toLowerCase().includes("juin")) return `Sujet de Bac ${annee}`;
  if (session.toLowerCase().includes("sept")) return `Session Septembre ${annee}`;
  return `Session ${session} ${annee}`;
}

function getExamBadgeColor(a: DisplayAnnal): string {
  const type = (a.type_examen ?? "").toLowerCase();
  if (type.includes("blanc")) return "bg-blue-500/10 text-blue-700 border-blue-500/20";
  if (type.includes("regional") || type.includes("régional")) return "bg-violet-500/10 text-violet-700 border-violet-500/20";
  if (type.includes("national")) return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

function isAllowedForSerie(matiere: string, allowedSubjects: string[]): boolean {
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const m = normalize(matiere);
  return allowedSubjects.some((s) => normalize(s).includes(m) || m.includes(normalize(s)));
}

function buildAnnalPdf(a: DisplayAnnal, kind: "sujet" | "corrige") {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const ml = 60; const uw = pw - ml * 2; let y = 60;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(217, 119, 6);
    doc.text(`${kind === "sujet" ? "SUJET" : "CORRIGE"} - BAC SERIE ${a.serie}`, ml, y); y += 20;
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(17, 24, 39);
    doc.text(a.matiere, ml, y); y += 24;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text(`${getExamLabel(a)} - Durée: ${a.duree}`, ml, y); y += 16;
    doc.setDrawColor(200, 200, 200); doc.line(ml, y, pw - ml, y); y += 16;
    const body = (kind === "sujet" ? a.sujet_contenu : a.corrige_contenu) || "Contenu non disponible.";
    for (const para of body.split("\n")) {
      const t = para.trim();
      if (!t) { y += 6; continue; }
      const isH2 = t.startsWith("## ") || t.startsWith("EXERCICE") || t.startsWith("PARTIE");
      const isH3 = t.startsWith("### ");
      const cleaned = t.replace(/^#+\s*/, "").replace(/\*\*/g, "");
      if (isH2) { y += 10; doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(194, 65, 12); }
      else if (isH3) { y += 6; doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(249, 115, 22); }
      else { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(31, 41, 55); }
      for (const line of doc.splitTextToSize(cleaned, uw)) {
        if (y > ph - 60) { doc.addPage(); y = 60; }
        doc.text(line, ml, y); y += 14;
      }
    }
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
      doc.text(`BAC MASTER ELITE - ${a.matiere} ${a.annee} - Page ${p}/${total}`, ml, ph - 20);
    }
    doc.save(`bac-${kind}-${a.matiere}-${a.annee}.pdf`);
  } catch(e) { console.error("PDF error:", e); throw e; }
}

export default function Annales() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus(user?.id);
  const { data: annals = [], isLoading } = useAnnals();
  const { toast } = useToast();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const userSerie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(userSerie);

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
          type_examen: pickString(r, "type_examen", "type", "exam_type"),
        };
      })
      .filter((a) => isAllowedForSerie(a.matiere, allowedSubjects));
  }, [annals, allowedSubjects]);

  // Nombre d'annales par matière
  const countBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((a) => { map[a.matiere] = (map[a.matiere] ?? 0) + 1; });
    return map;
  }, [items]);

  // Annales de la matière active
  const filteredItems = useMemo(() => {
    if (!activeSubject) return [];
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return items
      .filter((a) => normalize(a.matiere).includes(normalize(activeSubject)) || normalize(activeSubject).includes(normalize(a.matiere)))
      .sort((a, b) => b.annee - a.annee);
  }, [items, activeSubject]);

  const handleDownload = (a: DisplayAnnal, kind: "sujet" | "corrige") => {
    if (!isPremium) return;
    if (isInAppBrowser()) {
      toast({ title: "Ouvre dans ton navigateur", description: "Appuie sur les 3 points en haut puis \"Ouvrir dans le navigateur\" pour télécharger.", variant: "default" });
      return;
    }
    try { buildAnnalPdf(a, kind); }
    catch { toast({ title: "Téléchargement impossible", description: "Impossible de générer le PDF.", variant: "destructive" }); }
  };

  const premiumBanner = !premiumLoading && !isPremium && (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-orange-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/25 text-amber-700">
          <Crown className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Annales réservées aux membres Premium</p>
          <p className="text-xs text-amber-900/80">Téléchargez les sujets officiels et leurs corrigés détaillés en PDF.</p>
        </div>
      </div>
      <Link href="/dashboard/upgrade">
        <Button className="rounded-full bg-amber-500 text-white hover:bg-amber-600">
          Devenir Premium <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );

  // Vue matières
  if (!activeSubject) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">Examens officiels</p>
            <h1 className="mt-1 text-2xl font-bold">Annales du BAC — Série {userSerie}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choisissez une matière pour accéder aux annales.</p>
          </div>
          {premiumBanner}
          {isLoading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              {allowedSubjects.map((m, i) => {
                const s = styleForSubject(m);
                const count = countBySubject[m] ?? 0;
                return (
                  <motion.button
                    key={m}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActiveSubject(m)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border border-border ${s.border} border-l-4 bg-card p-4 text-center shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-6 w-6 ${s.text}`} />
                    </div>
                    <p className="text-sm font-bold">{m}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {count} annale{count > 1 ? "s" : ""}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Vue annales d'une matière
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveSubject(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Matières
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold">{activeSubject}</h1>
        </div>
        {premiumBanner}
        {filteredItems.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">Aucune annale disponible pour cette matière.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((a, i) => (
              <motion.div
                key={a.matiere + a.annee + i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm hover-elevate"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getExamBadgeColor(a)}`}>
                    {a.type_examen || "Officiel"}
                  </span>
                </div>
                {/* Description riche */}
                <h3 className="mt-3 text-base font-bold leading-tight">{getExamLabel(a)}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{a.session} {a.annee}</span>
                  <span>•</span>
                  <span>Durée : {a.duree}</span>
                  <span>•</span>
                  <span>Série {a.serie}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  {isPremium ? (
                    <>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(a, "sujet")}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Sujet
                      </Button>
                      <Button size="sm" className="flex-1 bg-hero-gradient text-white hover:opacity-90" onClick={() => handleDownload(a, "corrige")}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Corrigé
                      </Button>
                    </>
                  ) : (
                    <Link href="/dashboard/upgrade" className="w-full">
                      <Button size="sm" variant="outline" className="w-full border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
                        <Lock className="mr-1.5 h-3.5 w-3.5" /> Réservé Premium
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

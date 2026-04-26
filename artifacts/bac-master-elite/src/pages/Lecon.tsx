import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import { ArrowLeft, Crown, Download, Loader2, Lock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useLessons, usePremiumStatus, type Course } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

export default function Lecon() {
  const params = useParams<{ id: string }>();
  const lessonId = params.id;
  const { user } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus(user?.id);
  const { data: lessons = [], isLoading } = useLessons();
  const { toast } = useToast();

  const lesson = useMemo<Course | undefined>(
    () => lessons.find((l) => String(l.id) === String(lessonId)),
    [lessons, lessonId],
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Leçon introuvable</h1>
          <p className="text-sm text-muted-foreground">
            Cette leçon n'existe plus ou n'est pas accessible avec votre série actuelle.
          </p>
          <Link href="/dashboard/cours">
            <Button className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux cours
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const lessonRecord = lesson as Record<string, unknown>;
  const title = pickString(lessonRecord, "titre", "title") || "Leçon";
  const subject = pickString(lessonRecord, "matiere", "subject") || "Matière";
  const description = pickString(lessonRecord, "description", "resume", "summary");
  const content = pickString(
    lessonRecord,
    "contenu",
    "content",
    "body",
    "markdown",
    "texte",
    "text",
  );

  const handleDownloadPdf = () => {
    if (!isPremium) return;
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableWidth = pageWidth - margin * 2;
      let cursorY = margin;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);
      doc.text(subject.toUpperCase(), margin, cursorY);
      cursorY += 22;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(17, 24, 39);
      const titleLines = doc.splitTextToSize(title, usableWidth);
      doc.text(titleLines, margin, cursorY);
      cursorY += titleLines.length * 24 + 8;

      doc.setDrawColor(229, 231, 235);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);

      const bodyText = (content || description || "Contenu non disponible.").trim();
      const bodyLines = doc.splitTextToSize(bodyText, usableWidth);
      const lineHeight = 16;
      for (const line of bodyLines) {
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
          `BAC MASTER ELITE — ${subject} — Page ${p}/${totalPages}`,
          margin,
          pageHeight - 24,
        );
      }

      const safeName = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 60) || "lecon";
      doc.save(`bac-master-elite-${safeName}.pdf`);
    } catch (err) {
      console.error("[pdf]", err);
      toast({
        title: "Téléchargement impossible",
        description: "Impossible de générer le PDF. Réessayez dans un instant.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard/cours">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tous les cours
            </Button>
          </Link>
          {isPremium ? (
            <Button
              onClick={handleDownloadPdf}
              className="rounded-full bg-hero-gradient text-white hover:opacity-90"
              data-testid="button-download-pdf"
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger en PDF
            </Button>
          ) : (
            <Link href="/dashboard/upgrade">
              <Button
                variant="outline"
                className="rounded-full border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                disabled={premiumLoading}
                data-testid="button-pdf-locked"
              >
                <Lock className="mr-2 h-4 w-4" />
                PDF réservé Premium
              </Button>
            </Link>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">{subject}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          )}

          <div className="mt-6 border-t border-border pt-6">
            {content ? (
              <article className="prose prose-sm max-w-none dark:prose-invert sm:prose-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">
                Le contenu détaillé de cette leçon sera bientôt disponible. En attendant, vous pouvez consulter les
                exercices liés depuis la page Exercices.
              </p>
            )}
          </div>
        </motion.div>

        {!isPremium && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-amber-800">
              <Crown className="h-4 w-4" />
              Passez à Premium pour télécharger les leçons
            </div>
            <p className="mt-1 text-amber-800/80">
              Téléchargez vos cours au format PDF et révisez sans connexion. Disponible dès l'activation de Premium.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

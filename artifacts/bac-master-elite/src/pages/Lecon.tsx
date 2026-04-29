import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Crown, Download, Loader2, Lock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useLessons, usePremiumStatus, useCheckCourseAccess, type Course } from "@/lib/queries";

function formatToMarkdown(text: string): string {
  if (text.includes("##") || text.includes("**")) return text;
  return text.split("\n").map(line => line.trim()).filter(line => line.length > 0).join("\n\n");
}

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
  const checkCourseAccess = useCheckCourseAccess();
  const [accessDenied, setAccessDenied] = useState(false);

  const lesson = useMemo<Course | undefined>(
    () => lessons.find((l) => String(l.id) === String(lessonId)),
    [lessons, lessonId],
  );

  useEffect(() => {
    if (!premiumLoading && user?.id) {
      checkCourseAccess.mutate(user.id, {
        onSuccess: (result) => {
          if (!result.allowed) setAccessDenied(true);
        }
      });
    }
  }, [user?.id, premiumLoading]);

  const lessonRecord = (lesson as Record<string, unknown>) || {};
  const title = pickString(lessonRecord, "titre", "title") || "Leçon";
  const subject = pickString(lessonRecord, "matiere", "subject") || "Matière";
  const content = pickString(lessonRecord, "contenu", "content", "markdown", "text") || "";

  const handleDownloadPdf = () => {
    if (!isPremium) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const clean = (t: string) => t.replace(/[#*]/g, "").trim();

    const margin = 40;
    let currentY = 50;

    doc.setFont("helvetica", "bold").setFontSize(22).text(clean(title), margin, currentY);
    currentY += 15;
    doc.setDrawColor(30, 64, 175).setLineWidth(1.5).line(margin, currentY, 555, currentY);
    currentY += 30;

    const blocks = content.trim().split(/\n(?=\|)/g);

    blocks.forEach((block) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return;

      if (trimmedBlock.startsWith("|")) {
        const rows = trimmedBlock.split("\n")
          .filter(r => r.includes("|") && !r.includes("---"))
          .map(r => r.split("|").filter(c => c.trim()).map(c => clean(c)));

        if (rows.length > 0) {
          const head = [rows.shift()];
          autoTable(doc, {
            head: head,
            body: rows,
            startY: currentY,
            theme: 'grid', // Force l'affichage des lignes et colonnes
            styles: { 
              fontSize: 10, 
              font: "helvetica", 
              cellPadding: 8, 
              lineColor: [180, 180, 180], // Couleur des lignes (gris)
              lineWidth: 0.5 
            },
            headStyles: { 
              fillColor: [30, 64, 175], // Entête bleue
              textColor: [255, 255, 255], 
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: { 
              fillColor: [245, 247, 250] // Lignes alternées pour la lecture
            },
            margin: { left: margin, right: margin }
          });
          currentY = (doc as any).lastAutoTable.finalY + 30;
        }
      } else {
        doc.setFont("helvetica", "normal").setFontSize(12);
        const lines = doc.splitTextToSize(clean(trimmedBlock), 515);
        lines.forEach((line: string) => {
          if (currentY > 780) { doc.addPage(); currentY = 50; }
          doc.text(line, margin, currentY);
          currentY += 16;
        });
        currentY += 12;
      }
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div></DashboardLayout>;
  if (!lesson) return <DashboardLayout><div className="text-center py-20">Leçon introuvable</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/cours"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Button></Link>
          {isPremium && <Button onClick={handleDownloadPdf} className="bg-blue-600 text-white"><Download className="mr-2 h-4 w-4" /> Télécharger PDF</Button>}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border bg-card p-8 shadow-sm">
          <p className="text-xs font-bold uppercase text-blue-600 tracking-wider">{subject}</p>
          <h1 className="text-3xl font-bold mt-2">{title}</h1>
          <div className="mt-8 border-t pt-8">
            <article className="prose prose-blue max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{formatToMarkdown(content)}</ReactMarkdown>
            </article>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

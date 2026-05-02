import { useMemo, useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Download, Loader2, Lock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PremiumLimitModal from "@/components/PremiumLimitModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useLessons, usePremiumStatus, useCheckCourseAccess, type Course } from "@/lib/queries";

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

function formatContent(text: string): string {
  if (!text) return "";
  if (text.includes("<h2") || text.includes("<svg")) return text;
  return text
      .replace(/^### (.+)$/gm, '<h3 style="color:#f97316;font-weight:700;font-size:1rem;margin:16px 0 6px">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color:#f97316;font-weight:700;font-size:1.2rem;margin:20px 0 8px">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="color:#f97316;font-weight:700;font-size:1.4rem;margin:24px 0 10px">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li style="margin:4px 0;margin-left:24px">$1</li>')
      .replace(/^\|(.+)\|$/gm, (row) => {
        const cells = row.split('|').filter(c => c.trim());
        return '<tr>' + cells.map(c => '<td style="border:1px solid #e5e7eb;padding:8px 12px;text-align:left">' + c.trim() + '</td>').join('') + '</tr>';
      })
      .replace(/(<tr>.*<\/tr>\n?)+/gs, (block) => {
        const rows = block.trim().split('\n').filter(r => !r.includes('---'));
        if (rows.length === 0) return block;
        const header = rows[0].replace(/<td/g, '<th style="background:#f97316;color:white;font-weight:700;padding:8px 12px;border:1px solid #ea580c;text-align:left"').replace(/<\/td>/g, '</th>');
        const body = rows.slice(1).join('\n');
        return '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.95rem"><thead>' + header + '</thead><tbody>' + body + '</tbody></table>';
      });
}

export default function Lecon() {
  const params = useParams<{ id: string }>();
  const lessonId = params.id;
  const { user } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus(user?.id);
  const { data: lessons = [], isLoading } = useLessons();
  const checkCourseAccess = useCheckCourseAccess();
  const [accessDenied, setAccessDenied] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const lesson = useMemo<Course | undefined>(
    () => lessons.find((l) => String(l.id) === String(lessonId)),
    [lessons, lessonId],
  );

  useEffect(() => {
    if (!user?.id || !lessonId) return;
    
    checkCourseAccess.mutate(user.id, {
      onSuccess: (result) => {
        if (result.allowed === false) {
          setAccessDenied(true);
          setLimitModalOpen(true);
        } else {
          setAccessDenied(false);
        }
      }
    });
  }, [user?.id, lessonId]);

  const lessonRecord = (lesson as Record<string, unknown>) || {};
  const title = pickString(lessonRecord, "titre", "title") || "Leçon";
  const subject = pickString(lessonRecord, "matiere", "subject") || "";
  const content = pickString(lessonRecord, "contenu", "content", "markdown", "text") || "";

  const handleDownloadPDF = () => {
    if (!isPremium) {
      window.location.href = "/dashboard/upgrade";
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [[subject]],
      body: [[content.replace(/<[^>]*>/g, "")]],
    });
    doc.save(`${title}.pdf`);
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div></DashboardLayout>;
  if (!lesson) return <DashboardLayout><div className="text-center py-20">Leçon introuvable</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PremiumLimitModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} type="lessons" />

      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/cours">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
          </Link>
          <Button 
            onClick={handleDownloadPDF} 
            variant="outline" 
            size="sm" 
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            <Download className="mr-2 h-4 w-4" />
            {isPremium ? "PDF" : "PDF Premium"}
          </Button>
        </div>

        {accessDenied ? (
          <div className="rounded-3xl border bg-card p-12 text-center shadow-sm">
            <Lock className="mx-auto h-12 w-12 text-rose-600" />
            <h2 className="mt-4 text-xl font-bold">Limite de 3 cours atteinte</h2>
            <p className="mt-2 text-muted-foreground">Passez au statut Premium pour accéder à tous les cours sans limite.</p>
            <Link href="/dashboard/upgrade">
              <Button className="mt-6 bg-orange-500 text-white hover:bg-orange-600">
                <Crown className="mr-2 h-4 w-4" /> Devenir Premium
              </Button>
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-8 shadow-sm">
            <p className="text-xs font-bold uppercase text-blue-600">{subject}</p>
            <h1 className="text-3xl font-bold mt-2">{title}</h1>
            <div className="border-t mt-6 pt-6">
              <article className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

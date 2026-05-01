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
  if (text.includes("##") || text.includes("**")) {
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
  let result = "";
  const lines = text.split("\n");
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) { result += "</ul>"; inList = false; }
      result += "<br/>";
      continue;
    }
    if (/^[A-Z][A-Z\s\-:]{4,}$/.test(line)) {
      if (inList) { result += "</ul>"; inList = false; }
      result += '<h2 style="color:#f97316;font-weight:700;font-size:1.2rem;margin:20px 0 8px">' + line + '</h2>';
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      if (!inList) { result += '<ul style="list-style:disc;padding-left:24px;margin:8px 0">'; inList = true; }
      result += '<li style="margin:4px 0">' + line.slice(2) + '</li>';
    } else {
      if (inList) { result += "</ul>"; inList = false; }
      result += '<p style="margin:8px 0;line-height:1.7">' + line + '</p>';
    }
  }
  if (inList) result += "</ul>";
  return result;
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

  // Tâche 3 : vérifier + incrémenter le compteur de leçons du jour
  useEffect(() => {
    if (premiumLoading || !user?.id || isPremium) return;
    checkCourseAccess.mutate(user.id, {
      onSuccess: (result) => {
        if (!result.allowed) {
          setAccessDenied(true);
          setLimitModalOpen(true);
        }
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, premiumLoading, isPremium]);

  const lessonRecord = (lesson as Record<string, unknown>) || {};
  const title = pickString(lessonRecord, "titre", "title") || "Leçon";
  const subject = pickString(lessonRecord, "matiere", "subject") || "";
  const content = pickString(lessonRecord, "contenu", "content", "markdown", "text") || "";
  const pdfUrl = pickString(lessonRecord, "pdf_url") || "";

  // Tâche 2 : URL de retour vers la liste des leçons de la matière
  const backUrl = subject
    ? `/dashboard/cours?subject=${encodeURIComponent(subject.toLowerCase())}`
    : "/dashboard/cours";

  // Tâche 1 : impression via window.print()
  const handlePrint = async () => {
    const element = document.getElementById("lesson-content");
    if (!element) return;
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.cssText = "font-family:Arial,sans-serif;color:#111;background:white;padding:20px;max-width:700px";
    // Supprimer toutes les classes Tailwind et garder seulement les styles inline
    clone.querySelectorAll('*').forEach((el) => {
      const e = el as HTMLElement;
      const computed = window.getComputedStyle(e);
      const safe = ['color','background-color','font-weight','font-size','padding','margin','border','text-align'];
      safe.forEach(prop => {
        const val = computed.getPropertyValue(prop);
        if (val && !val.includes('oklch')) {
          e.style.setProperty(prop, val);
        } else {
          e.style.removeProperty(prop);
        }
      });
      e.removeAttribute('class');
    });
    const wrapper = document.createElement('div');
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().set({
      margin: 10,
      filename: title.replace(/\s+/g, '_') + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(clone).save().then(() => {
      document.body.removeChild(wrapper);
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">Leçon introuvable</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Modal limite non-premium */}
      <PremiumLimitModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        type="lessons"
      />

      <div className="mx-auto max-w-3xl space-y-6 pb-12 print:max-w-none print:space-y-4">
        {/* Barre d'actions — masquée à l'impression */}
        <div className="flex items-center justify-between print:hidden">
          <Link href={backUrl}>
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour{subject ? ` — ${subject}` : ""}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {isPremium && (
              <Button
                onClick={handlePrint}
                className="bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-print"
              >
                <Download className="mr-2 h-4 w-4" />
                Sauvegarder en PDF
              </Button>
            )}
            {!isPremium && (
              <Link href="/dashboard/upgrade">
                <Button variant="outline" size="sm">
                  <Crown className="mr-2 h-4 w-4 text-amber-500" />
                  PDF Premium
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Contenu verrouillé si limite atteinte */}
        {accessDenied ? (
          <div className="rounded-3xl border bg-card p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/30">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Limite quotidienne atteinte</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous avez consulté 3 leçons aujourd'hui. Revenez demain ou passez Premium pour un accès illimité.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Link href="/dashboard/upgrade">
                <Button className="bg-hero-gradient text-white hover:opacity-90">
                  <Crown className="mr-2 h-4 w-4" />
                  Passer Premium
                </Button>
              </Link>
              <Link href={backUrl}>
                <Button variant="ghost">Retour aux leçons</Button>
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border bg-card shadow-sm print:border-none print:shadow-none print:rounded-none"
          >
            {/* En-tête de la leçon */}
            <div className="p-8 pb-4 print:p-0 print:pb-4">
              <p className="text-xs font-bold uppercase text-blue-600 tracking-wider print:text-black">
                {subject || "Cours"}
              </p>
              <h1 className="text-3xl font-bold mt-2 print:text-2xl">{title}</h1>
              {pdfUrl && isPremium && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline print:hidden"
                >
                  <Download className="h-3.5 w-3.5" />
                  Fichier PDF original
                </a>
              )}
            </div>

            {/* Contenu de la leçon — HTML + SVG */}
            <div className="border-t p-8 pt-6 print:p-0 print:pt-4 print:border-none">
              <article
                id="lesson-content"
                className="
                  prose prose-blue max-w-none
                  dark:prose-invert
                  prose-headings:font-bold
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-table:w-full
                  prose-th:bg-blue-600 prose-th:text-white prose-th:px-3 prose-th:py-2
                  prose-td:px-3 prose-td:py-2
                  [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-w-full
                  [&_img]:w-full [&_img]:h-auto
                "
                data-testid="lesson-content"
                dangerouslySetInnerHTML={{ __html: formatContent(content) }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

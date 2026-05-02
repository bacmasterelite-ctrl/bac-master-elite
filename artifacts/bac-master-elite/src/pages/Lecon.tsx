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

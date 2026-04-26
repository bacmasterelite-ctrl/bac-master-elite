import jsPDF from "jspdf";

export type PdfCourse = {
  titre: string;
  matiere: string;
  serie: string;
  duree?: string;
  content?: string;
};

/** Render a course to a clean A4 PDF and trigger download. */
export function downloadCourseAsPDF(course: PdfCourse, studentName?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;

  // ---- Header band ----
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BAC MASTER ELITE", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Série ${course.serie} · ${course.matiere}`, margin, 21);

  // Premium ribbon (top-right)
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(pageWidth - 38, 0, 38, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PREMIUM", pageWidth - 31, 8);

  // ---- Title ----
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(course.titre, maxWidth);
  doc.text(titleLines, margin, 44);

  // ---- Meta line ----
  let cursorY = 44 + titleLines.length * 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  const meta = [
    course.duree && `Durée : ${course.duree}`,
    studentName && `Élève : ${studentName}`,
    `Téléchargé le ${new Date().toLocaleDateString("fr-FR")}`,
  ]
    .filter(Boolean)
    .join(" · ");
  doc.text(meta, margin, cursorY);
  cursorY += 6;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // ---- Body ----
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const body = (course.content ?? defaultBody(course)).trim();
  // Strip basic markdown so the PDF looks clean
  const plain = body
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");

  const paragraphs = plain.split(/\n{2,}/);
  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para, maxWidth);
    for (const line of lines) {
      if (cursorY > pageHeight - 22) {
        addFooter(doc, pageWidth, pageHeight, margin);
        doc.addPage();
        cursorY = margin + 4;
      }
      doc.text(line, margin, cursorY);
      cursorY += 6;
    }
    cursorY += 3;
  }

  addFooter(doc, pageWidth, pageHeight, margin);

  const safeName = course.titre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .slice(0, 60);
  doc.save(`${safeName || "cours"}.pdf`);
}

function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number) {
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "© BAC MASTER ELITE — Réussir son BAC avec confiance",
    margin,
    pageHeight - 9,
  );
  const pageInfo = `${doc.getCurrentPageInfo().pageNumber}`;
  doc.text(pageInfo, pageWidth - margin, pageHeight - 9, { align: "right" });
}

function defaultBody(course: PdfCourse): string {
  return [
    `Cours : ${course.titre}`,
    `Matière : ${course.matiere}`,
    `Série : ${course.serie}`,
    "",
    "Ce cours fait partie du programme officiel du BAC.",
    "Connectez-vous à votre tableau de bord BAC MASTER ELITE pour accéder à la version interactive, aux exercices corrigés et aux annales.",
  ].join("\n");
}

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useLessons, useProfile } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { subjectsForSerie, styleForSubject } from "@/lib/subjects";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subject: string;
}

function extractFlashcards(lessons: any[]): Flashcard[] {
  const cards: Flashcard[] = [];
  lessons.forEach((lesson) => {
    const content = lesson.contenu ?? lesson.content ?? "";
    const subject = lesson.matiere ?? lesson.subject ?? "Général";
    const title = lesson.titre ?? lesson.title ?? "";
    const lines = content.replace(/<[^>]*>/g, " ").split(/[\n.]/);
    lines.forEach((line: string, i: number) => {
      const clean = line.trim();
      if (clean.length > 30 && clean.length < 200) {
        cards.push({
          id: `${lesson.id}-${i}`,
          question: `Qu'est-ce que : ${title} ?`,
          answer: clean,
          subject,
        });
      }
    });
  });
  return cards.slice(0, 50);
}

export default function Flashcards() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: lessons = [] } = useLessons();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());

  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const filteredLessons = useMemo(() => {
    if (!activeSubject) return [];
    return lessons.filter((l) => {
      const mat = normalize(l.matiere ?? l.subject ?? "");
      const sub = normalize(activeSubject);
      return mat.includes(sub) || sub.includes(mat);
    });
  }, [lessons, activeSubject]);

  const cards = useMemo(() => extractFlashcards(filteredLessons), [filteredLessons]);
  const remaining = cards.filter(c => !known.has(c.id) && !unknown.has(c.id));
  const card = remaining[currentIndex % Math.max(remaining.length, 1)];

  const handleKnow = () => {
    if (!card) return;
    setKnown(prev => new Set([...prev, card.id]));
    setFlipped(false);
    setCurrentIndex(i => i + 1);
  };

  const handleDontKnow = () => {
    if (!card) return;
    setUnknown(prev => new Set([...prev, card.id]));
    setFlipped(false);
    setCurrentIndex(i => i + 1);
  };

  const handleReset = () => {
    setKnown(new Set());
    setUnknown(new Set());
    setCurrentIndex(0);
    setFlipped(false);
  };

  if (!activeSubject) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Révision active</p>
            <h1 className="mt-1 text-2xl font-bold">Flashcards — Série {serie}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choisissez une matière pour commencer.</p>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {allowedSubjects.map((m, i) => {
              const s = styleForSubject(m);
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
                </motion.button>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 space-y-4">
          <p className="text-muted-foreground">Aucune flashcard disponible pour cette matière.</p>
          <Button onClick={() => setActiveSubject(null)}>Retour</Button>
        </div>
      </DashboardLayout>
    );
  }

  const progress = ((known.size + unknown.size) / cards.length) * 100;

  if (remaining.length === 0) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-md text-center space-y-6 py-20">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold">Session terminée !</h2>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-emerald-600">{known.size}</p>
              <p className="text-sm text-muted-foreground">Connues</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-rose-500">{unknown.size}</p>
              <p className="text-sm text-muted-foreground">À revoir</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" /> Recommencer
            </Button>
            <Button onClick={() => setActiveSubject(null)}>Autre matière</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-6 pb-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveSubject(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Matières
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold">{activeSubject}</h1>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{known.size + unknown.size} / {cards.length} cartes</span>
            <span className="text-emerald-600 font-semibold">{known.size} connues</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Carte */}
        <div
          className="relative cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setFlipped(f => !f)}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.4 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative h-64"
          >
            {/* Recto */}
            <div
              className="absolute inset-0 rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">Question</p>
              <p className="text-lg font-semibold leading-snug">{card?.question}</p>
              <p className="mt-6 text-xs text-muted-foreground">Appuyez pour voir la réponse</p>
            </div>
            {/* Verso */}
            <div
              className="absolute inset-0 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4">Réponse</p>
              <p className="text-base leading-relaxed">{card?.answer}</p>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <Button
              className="flex-1 rounded-xl bg-rose-500 text-white hover:bg-rose-600"
              onClick={handleDontKnow}
            >
              <XCircle className="mr-2 h-4 w-4" /> À revoir
            </Button>
            <Button
              className="flex-1 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={handleKnow}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Je sais !
            </Button>
          </motion.div>
        )}

        {!flipped && (
          <p className="text-center text-xs text-muted-foreground">
            Carte {(currentIndex % remaining.length) + 1} sur {remaining.length} restantes
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}

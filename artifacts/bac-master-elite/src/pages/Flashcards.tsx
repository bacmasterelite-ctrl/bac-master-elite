import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useLessons, useProfile } from "@/lib/queries";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { supabase } from "@/lib/supabase";
import { subjectsForSerie, styleForSubject } from "@/lib/subjects";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

function extractFlashcards(lessons: any[], offset = 0): Flashcard[] {
  const cards: Flashcard[] = [];
  try {
    lessons.forEach((lesson) => {
      const content = (lesson.contenu ?? lesson.content ?? "").replace(/<[^>]*>/g, " ");
      const title = lesson.titre ?? lesson.title ?? "Cette leçon";
      const lines = content.split(/[\n.]/);
      lines.forEach((line: string, i: number) => {
        const clean = line.trim();
        if (clean.length > 40 && clean.length < 250) {
          cards.push({
            id: `${lesson.id}-${i}`,
            question: `${title} — que retiens-tu de ce point ?`,
            answer: clean,
          });
        }
      });
    });
  } catch(e) {}
  const start = offset % Math.max(cards.length, 1);
  return cards.slice(start, start + 50).length > 0 
    ? cards.slice(start, start + 50) 
    : cards.slice(0, 50);
}

export default function Flashcards() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: lessons = [] } = useLessons();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>([]);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState(false);

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

  const allCards = useMemo(() => extractFlashcards(filteredLessons, 0), [filteredLessons]);
  const cards = useMemo(() => extractFlashcards(filteredLessons, offset), [filteredLessons, offset]);

  const seen = new Set([...known, ...unknown]);
  const remaining = cards.filter(c => !seen.has(c.id));
  const card = remaining[0];
  const progress = cards.length > 0 ? ((seen.size) / cards.length) * 100 : 0;
  const hasMore = offset + 50 < allCards.length;

  const addPoints = (pts: number) => {
    if (!user?.id || pts === 0) return;
    setSessionPoints(p => p + pts);
    supabase.from("profiles")
      .select("points")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        supabase.from("profiles")
          .update({ points: (data?.points ?? 0) + pts })
          .eq("id", user.id);
      });
  };

  const handleKnow = () => {
    if (!card) return;
    setKnown(prev => [...prev, card.id]);
    setFlipped(false);
    addPoints(1);
    if (remaining.length === 1) setDone(true);
  };

  const handleDontKnow = () => {
    if (!card) return;
    setUnknown(prev => [...prev, card.id]);
    setFlipped(false);
    if (remaining.length === 1) setDone(true);
  };

  const handleReset = () => {
    setKnown([]);
    setUnknown([]);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionPoints(0);
    setDone(false);
  };

  const handleNext50 = () => {
    setOffset(o => o + 50);
    setKnown([]);
    setUnknown([]);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionPoints(0);
    setDone(false);
  };

  const handleSelect = (m: string) => {
    setActiveSubject(m);
    setKnown([]);
    setUnknown([]);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionPoints(0);
    setOffset(0);
    setDone(false);
  };

  // Vue matières
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
                  onClick={() => handleSelect(m)}
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

  // Pas de cartes
  if (cards.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 space-y-4">
          <p className="text-2xl">📚</p>
          <p className="text-muted-foreground">Aucune flashcard disponible pour cette matière.</p>
          <Button onClick={() => setActiveSubject(null)}>Retour aux matières</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Session terminée
  if (done || remaining.length === 0) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-md text-center space-y-6 py-16 px-4">
          <div className="text-5xl">{!hasMore ? "🏆" : "🎉"}</div>
          <h2 className="text-2xl font-bold">{!hasMore ? "Matière terminée !" : "Série terminée !"}</h2>
          <p className="text-sm text-muted-foreground">+{sessionPoints} points gagnés</p>
          <div className="flex justify-center gap-8">
            <div>
              <p className="text-3xl font-extrabold text-emerald-600">{known.length}</p>
              <p className="text-xs text-muted-foreground">Connues ✓</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-rose-500">{unknown.length}</p>
              <p className="text-xs text-muted-foreground">À revoir</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {hasMore && (
              <Button className="bg-hero-gradient text-white" onClick={handleNext50}>
                50 questions suivantes →
              </Button>
            )}
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Recommencer
            </Button>
            <Button variant="ghost" onClick={() => setActiveSubject(null)}>
              Autre matière
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Vue carte
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-6 pb-10 px-2">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveSubject(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Matières
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold">{activeSubject}</h1>
          {sessionPoints > 0 && (
            <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
              +{sessionPoints} pts
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{seen.size} / {cards.length} cartes</span>
            <span className="text-emerald-600 font-semibold">{known.length} connues ✓</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full rounded-full bg-emerald-500" animate={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="relative cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setFlipped(f => !f)}>
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.4 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative h-64"
          >
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-8 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">Question</p>
              <p className="text-base font-semibold leading-snug">{card?.question}</p>
              <p className="mt-6 text-xs text-muted-foreground">Appuyez pour voir la réponse</p>
            </div>
            <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 flex flex-col items-center justify-center text-center overflow-auto" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3">Réponse</p>
              <p className="text-sm leading-relaxed">{card?.answer}</p>
            </div>
          </motion.div>
        </div>

        {flipped ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <Button className="flex-1 rounded-xl bg-rose-500 text-white hover:bg-rose-600" onClick={handleDontKnow}>
              <XCircle className="mr-2 h-4 w-4" /> À revoir
            </Button>
            <Button className="flex-1 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600" onClick={handleKnow}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Je sais ! +1pt
            </Button>
          </motion.div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {remaining.length} cartes restantes
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, BookOpen } from "lucide-react";
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
  subject: string;
}

function extractFlashcards(lessons: any[], offset = 0): Flashcard[] {
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
          question: `${title} — que retiens-tu ?`,
          answer: clean,
          subject,
        });
      }
    });
  });
  const all = cards.slice(offset, offset + 50);
  return all.length > 0 ? all : cards.slice(0, 50);
}

const STORAGE_KEY = (userId: string, subject: string) =>
  `flashcards-${userId}-${subject}`;

export default function Flashcards() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: lessons = [] } = useLessons();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [sessionPoints, setSessionPoints] = useState(0);
  const [offset, setOffset] = useState(0);
  const [subjectStatus, setSubjectStatus] = useState<Record<string, "in_progress" | "completed">>({});

  const serie = (profile?.serie ?? "D").toUpperCase();
  const allowedSubjects = subjectsForSerie(serie);

  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Charger la progression sauvegardée
  useEffect(() => {
    if (!user?.id || !activeSubject) return;
    const key = STORAGE_KEY(user.id, activeSubject);
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      setCurrentIndex(data.currentIndex ?? 0);
      setKnown(new Set(data.known ?? []));
      setUnknown(new Set(data.unknown ?? []));
      setOffset(data.offset ?? 0);
    }
  }, [user?.id, activeSubject]);

  // Sauvegarder la progression
  useEffect(() => {
    if (!user?.id || !activeSubject) return;
    const key = STORAGE_KEY(user.id, activeSubject);
    localStorage.setItem(key, JSON.stringify({
      currentIndex,
      known: [...known],
      unknown: [...unknown],
      offset,
    }));
    // Mettre à jour le statut
    setSubjectStatus(prev => ({
      ...prev,
      [activeSubject]: known.size + unknown.size > 0 ? "in_progress" : prev[activeSubject],
    }));
  }, [currentIndex, known, unknown, offset, activeSubject, user?.id]);

  const filteredLessons = useMemo(() => {
    if (!activeSubject) return [];
    return lessons.filter((l) => {
      const mat = normalize(l.matiere ?? l.subject ?? "");
      const sub = normalize(activeSubject);
      return mat.includes(sub) || sub.includes(mat);
    });
  }, [lessons, activeSubject]);

  const cards = useMemo(() => extractFlashcards(filteredLessons, offset), [filteredLessons, offset]);
  const totalCards = useMemo(() => extractFlashcards(filteredLessons).length, [filteredLessons]);
  const remaining = cards.filter(c => !known.has(c.id) && !unknown.has(c.id));
  const card = remaining[currentIndex % Math.max(remaining.length, 1)];

  const addPoints = async (pts: number) => {
    if (!user?.id || pts === 0) return;
    setSessionPoints(p => p + pts);
    await supabase.rpc("increment_points", { user_id: user.id, amount: pts }).catch(() => {
      // Fallback direct update
      supabase.from("profiles")
        .update({ points: (profile?.points ?? 0) + pts })
        .eq("id", user.id);
    });
  };

  const handleKnow = async () => {
    if (!card) return;
    setKnown(prev => new Set([...prev, card.id]));
    setFlipped(false);
    setCurrentIndex(i => i + 1);
    await addPoints(1);
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
    setSessionPoints(0);
    if (user?.id && activeSubject) {
      localStorage.removeItem(STORAGE_KEY(user.id, activeSubject));
    }
  };

  const handleNext50 = async () => {
    await addPoints(sessionPoints);
    setOffset(o => o + 50);
    setKnown(new Set());
    setUnknown(new Set());
    setCurrentIndex(0);
    setFlipped(false);
    setSessionPoints(0);
  };

  const handleSelectSubject = (m: string) => {
    setActiveSubject(m);
    setKnown(new Set());
    setUnknown(new Set());
    setCurrentIndex(0);
    setFlipped(false);
    setSessionPoints(0);
    setOffset(0);
  };

  // Vue liste des matières
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
              const status = subjectStatus[m];
              return (
                <motion.button
                  key={m}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSelectSubject(m)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border border-border ${s.border} border-l-4 bg-card p-4 text-center shadow-sm hover:shadow-md transition-shadow relative`}
                >
                  {status === "completed" && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">✓ Terminé</span>
                  )}
                  {status === "in_progress" && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Continuer</span>
                  )}
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
          <p className="text-muted-foreground">Aucune flashcard disponible.</p>
          <Button onClick={() => setActiveSubject(null)}>Retour</Button>
        </div>
      </DashboardLayout>
    );
  }

  const hasMore = offset + 50 < totalCards;

  // Marquer comme terminé via useEffect
  useEffect(() => {
    if (remaining.length === 0 && cards.length > 0 && !hasMore && activeSubject) {
      setSubjectStatus(prev => ({ ...prev, [activeSubject]: "completed" }));
      if (user?.id) localStorage.removeItem(STORAGE_KEY(user.id, activeSubject));
    }
  }, [remaining.length, cards.length, hasMore, activeSubject, user?.id]);

  const progress = ((known.size + unknown.size) / cards.length) * 100;

  // Session terminée
  if (remaining.length === 0) {
    const isCompleted = !hasMore;
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-md text-center space-y-6 py-16">
          <div className="text-5xl">{isCompleted ? "🏆" : "🎉"}</div>
          <h2 className="text-2xl font-bold">
            {isCompleted ? "Matière terminée !" : "Série terminée !"}
          </h2>
          <p className="text-sm text-muted-foreground">
            +{sessionPoints} points gagnés cette session
          </p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-emerald-600">{known.size}</p>
              <p className="text-xs text-muted-foreground">Connues</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-rose-500">{unknown.size}</p>
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
              <RotateCcw className="mr-2 h-4 w-4" /> Recommencer cette série
            </Button>
            <Button variant="ghost" onClick={() => setActiveSubject(null)}>
              Autre matière
            </Button>
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
          {sessionPoints > 0 && (
            <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
              +{sessionPoints} pts
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{known.size + unknown.size} / {cards.length} cartes</span>
            <span className="text-emerald-600 font-semibold">{known.size} connues ✓</span>
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
              <p className="text-lg font-semibold leading-snug">{card?.question}</p>
              <p className="mt-6 text-xs text-muted-foreground">Appuyez pour voir la réponse</p>
            </div>
            <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-8 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4">Réponse</p>
              <p className="text-base leading-relaxed">{card?.answer}</p>
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
            Carte {(currentIndex % remaining.length) + 1} sur {remaining.length} restantes
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}

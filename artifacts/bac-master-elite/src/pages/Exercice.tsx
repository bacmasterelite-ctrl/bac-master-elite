import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2, Star, ChevronRight, Trophy, RotateCcw, Skull, PenLine, Eye, Lock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useExercises, usePremiumStatus, type Exercise } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/SupabaseAuthProvider";

interface QcmQuestion {
  id: string;
  exercise_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  position: number;
}

interface OpenQuestion {
  id: string;
  exercise_id: string;
  question: string;
  expected_answer: string;
  hint: string;
  position: number;
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}
function pickNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

const TIMER_CONFIG: Record<string, number> = {
  facile: 60,
  moyen: 45,
  difficile: 30,
  extreme: 20,
  Facile: 60,
  Moyen: 45,
  Difficile: 30,
};

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const OPTION_KEYS = ["option_a", "option_b", "option_c", "option_d"] as const;

const difficultyColor: Record<string, string> = {
  facile: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  moyen: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  difficile: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  extreme: "bg-purple-500/10 text-purple-700 border-purple-500/20",
};

export default function Exercice() {
  const params = useParams<{ id: string }>();
  const exerciseId = params.id;
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus(user?.id);
  const { data: exercises = [], isLoading } = useExercises();

  const [questions, setQuestions] = useState<QcmQuestion[]>([]);
  const [qcmLoading, setQcmLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [qcmDone, setQcmDone] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>([]);
  const [openLoading, setOpenLoading] = useState(false);
  const [openIndex, setOpenIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showCorrection, setShowCorrection] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [extremePhase, setExtremePhase] = useState<"qcm" | "open" | "done">("qcm");
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [openFeedback, setOpenFeedback] = useState<Record<number, "correct" | "wrong" | null>>({});

  const exercise = useMemo<Exercise | undefined>(
    () => exercises.find((e) => e.id == exerciseId),
    [exercises, exerciseId],
  );

  // Charger les questions QCM
  useEffect(() => {
    if (!exerciseId) return;
    setQcmLoading(true);
    supabase
      .from("exercise_qcm")
      .select("*")
      .eq("exercise_id", exerciseId)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setQuestions(data as QcmQuestion[]);
        setQcmLoading(false);
        if (data && data.length > 0) {
          const diff = (exercises.find((e: any) => e.id == exerciseId) as any)?.difficulty ?? "moyen";
          setTimeLeft(TIMER_CONFIG[diff] ?? 45);
          setTimerActive(true);
        }
      });
  }, [exerciseId]);

  // Vérifier progression existante
  useEffect(() => {
    if (!user?.id || !exerciseId) return;
    supabase
      .from("user_exercise_progress")
      .select("status, qcm_answers, qcm_score, completed")
      .eq("user_id", user.id)
      .eq("exercise_id", exerciseId)
      .single()
      .then(({ data }) => {
        if (data?.completed === true || data?.status === "completed") {
          setCompleted(true);
          setQcmDone(true);
          setScore(data.qcm_score ?? 0);

        }
      });
  }, [user?.id, exerciseId]);

  const isExtremeCheck = (exercises.find((e) => e.id == exerciseId) as any)?.difficulty === 'extreme';

  // Charger questions ouvertes
  useEffect(() => {
    if (!exerciseId || !isExtremeCheck) return;
    setOpenLoading(true);
    supabase
      .from("exercise_open_questions")
      .select("*")
      .eq("exercise_id", exerciseId)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setOpenQuestions(data as OpenQuestion[]);
        setOpenLoading(false);
      });
  }, [exerciseId, isExtremeCheck]);

    useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && timerActive && !showExplanation && questions.length > 0) {
      handleSelectOption("__timeout__");
    }
  }, [timeLeft, timerActive, showExplanation, questions]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const selectedForCurrent = selectedAnswers[currentIndex];

  const handleSelectOption = (label: string) => {
    if (showExplanation) return;
    setTimerActive(false);
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: label }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (isLastQuestion) {
      // Calculer score final
      const finalScore = questions.reduce((acc, q, i) => {
        return selectedAnswers[i] === q.correct_answer ? acc + 1 : acc;
      }, 0);
      setScore(finalScore);
      setQcmDone(true);
      if (isExtreme) {
        setExtremePhase("open");
      } else {
        setCompleted(true);
        if (user?.id && exerciseId) {
        const answersMap: Record<string, string> = {};
        questions.forEach((q, i) => { answersMap[q.id] = selectedAnswers[i] ?? ""; });
        supabase.from("user_exercise_progress").upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          status: "completed",
          qcm_score: finalScore,
          qcm_answers: answersMap,
          score: Math.round((finalScore / totalQuestions) * 100),
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,exercise_id" }).then(() => {
          supabase.rpc("increment_user_points", {
            uid: user.id,
            pts: points,
          });
        });
        }
      }
    } else {
      setCurrentIndex((i) => i + 1);
      const diff = (exercises.find((e: any) => e.id == exerciseId) as any)?.difficulty ?? "moyen";
      setTimeLeft(TIMER_CONFIG[diff] ?? 45);
      setTimerActive(true);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
    setQcmDone(false);
    setCompleted(false);
    setScore(0);
  };

  const isCorrect = selectedForCurrent === currentQuestion?.correct_answer;

  if (isLoading || qcmLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!exercise) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Exercice introuvable</h1>
          <Link href="/dashboard/exercices">
            <Button className="rounded-full"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const r = exercise as Record<string, unknown>;
  const title = pickString(r, "titre", "title") || "Exercice";
  const subject = pickString(r, "matiere", "subject") || "Général";
  const difficulty = (pickString(r, "difficulty", "difficulte") || "moyen").toLowerCase();
  const isExtreme = difficulty === "extreme";
  const points = pickNumber(r, "points") ?? 10;

  // ── Résultats finaux
  if (qcmDone) {
    const percent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percent >= 50;
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6 pb-12">
          <Link href="/dashboard/exercices">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Tous les exercices
            </Button>
          </Link>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-border bg-card p-8 shadow-sm text-center space-y-6"
          >
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${passed ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
              {passed ? <Trophy className="h-10 w-10 text-emerald-600" /> : <RotateCcw className="h-10 w-10 text-rose-500" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{passed ? "Bravo !" : "Continue tes efforts !"}</h1>
              <p className="mt-1 text-muted-foreground text-sm">{title}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-black">{score}</span>
              <span className="text-2xl text-muted-foreground font-semibold">/ {totalQuestions}</span>
            </div>
            <div className="w-full rounded-full bg-muted h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${passed ? "bg-emerald-500" : "bg-rose-500"}`}
              />
            </div>
            <p className="text-sm text-muted-foreground">{percent}% de bonnes réponses</p>

            {/* Récap par question */}
            <div className="space-y-3 text-left pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Récapitulatif</p>
              {questions.map((q, i) => {
                const userAns = selectedAnswers[i];
                const ok = userAns === q.correct_answer;
                return (
                  <div key={q.id} className={`rounded-xl border p-3 ${ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                    <div className="flex items-start gap-2">
                      {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{q.question}</p>
                        {!ok && (
                          <p className="text-xs text-rose-600 mt-1">
                            Ta réponse : <strong>{userAns}</strong> — Bonne réponse : <strong>{q.correct_answer}</strong>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleRestart} variant="outline" className="flex-1 rounded-xl">
                <RotateCcw className="mr-2 h-4 w-4" /> Recommencer
              </Button>
              <Link href="/dashboard/exercices" className="flex-1">
                <Button className="w-full rounded-xl bg-hero-gradient text-white">
                  Autres exercices <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }


  // ── Bloc Premium requis pour Extreme
  if (isExtreme && !isPremium) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6 pb-12">
          <Link href="/dashboard/exercices">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
          </Link>
          <div className="rounded-3xl border border-purple-500/30 bg-card p-10 text-center space-y-5 shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10">
              <Lock className="h-10 w-10 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold">Niveau Extreme 💀</h1>
            <p className="text-sm text-muted-foreground">Ce niveau combine QCM avancés et questions ouvertes. Réservé aux membres Premium.</p>
            <Link href="/dashboard/upgrade">
              <Button className="bg-hero-gradient text-white px-8 rounded-full">👑 Passer Premium</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Phase Questions Ouvertes (Extreme)
  if (isExtreme && extremePhase === "open") {
    const currentOpen = openQuestions[openIndex];
    const isLastOpen = openIndex === openQuestions.length - 1;
    const hasAnswered = (userAnswers[openIndex] ?? "").trim().length > 0;
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6 pb-12">
          <div className="flex items-center justify-between">
            <Link href="/dashboard/exercices">
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600">
              <Skull className="h-3.5 w-3.5" /> Phase 2 — Questions ouvertes
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">{subject}</p>
            <h1 className="mt-1 text-xl font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground mt-1">QCM terminé ✅ — Score QCM : {score}/{totalQuestions}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Question ouverte {openIndex + 1} sur {openQuestions.length}</span>
            </div>
            <div className="w-full rounded-full bg-muted h-2 overflow-hidden">
              <motion.div
                animate={{ width: `${((openIndex) / openQuestions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-full bg-purple-500"
              />
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={openIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-purple-500/20 bg-card p-6 shadow-sm space-y-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600">
                  {openIndex + 1}
                </span>
                <p className="text-base font-semibold leading-snug pt-0.5">{currentOpen?.question}</p>
              </div>
              {currentOpen?.hint && (
                <div>
                  <button
                    onClick={() => setShowHint(prev => ({ ...prev, [openIndex]: !prev[openIndex] }))}
                    className="text-xs text-amber-600 font-semibold hover:underline"
                  >
                    💡 {showHint[openIndex] ? "Masquer l indice" : "Voir l indice"}
                  </button>
                  {showHint[openIndex] && (
                    <div className="mt-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-700">
                      {currentOpen.hint}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">✍️ Ta réponse</label>
                <textarea
                  value={userAnswers[openIndex] ?? ""}
                  onChange={(e) => setUserAnswers(prev => ({ ...prev, [openIndex]: e.target.value }))}
                  disabled={showCorrection[openIndex]}
                  placeholder="Rédigez votre réponse ici..."
                  rows={6}
                  className="w-full rounded-xl border border-border bg-background p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-60"
                />
              </div>
              {hasAnswered && !showCorrection[openIndex] && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setOpenFeedback(prev => ({ ...prev, [openIndex]: "correct" }));
                      setShowCorrection(prev => ({ ...prev, [openIndex]: true }));
                    }}
                    className="flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> J'ai bon
                  </Button>
                  <Button
                    onClick={() => {
                      setOpenFeedback(prev => ({ ...prev, [openIndex]: "wrong" }));
                      setShowCorrection(prev => ({ ...prev, [openIndex]: true }));
                    }}
                    variant="outline"
                    className="flex-1 rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500/5"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> J'ai faux
                  </Button>
                </div>
              )}
              {showCorrection[openIndex] && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border p-4 space-y-2 ${
                    openFeedback[openIndex] === "correct"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  {openFeedback[openIndex] === "correct" ? (
                    <p className="text-sm font-bold text-emerald-700">🎉 Excellent ! Tu maîtrises ce concept, continue comme ça !</p>
                  ) : (
                    <p className="text-sm font-bold text-rose-700">💪 Pas grave ! Lis bien la correction, tu vas progresser !</p>
                  )}
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Correction attendue</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentOpen?.expected_answer}</p>
                </motion.div>
              )}
              {showCorrection[openIndex] && (
                <Button
                  onClick={() => {
                    if (isLastOpen) {
                      setExtremePhase("done");
                      setCompleted(true);
                      if (user?.id) {
                        supabase.rpc("increment_user_points", {
                          uid: user.id,
                          pts: points,
                        });
                      }
                    } else {
                      setOpenIndex(i => i + 1);
                    }
                  }}
                  className="w-full rounded-xl bg-purple-600 text-white hover:bg-purple-700"
                >
                  {isLastOpen ? (
                    <><Trophy className="mr-2 h-4 w-4" /> Terminer l exercice</>
                  ) : (
                    <>Question suivante <ChevronRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DashboardLayout>
    );
  }

  // ── Pas de QCM disponible
  if (questions.length === 0) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6 pb-12">
          <Link href="/dashboard/exercices">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Tous les exercices
            </Button>
          </Link>
          <div className="rounded-3xl border border-border bg-card p-8 text-center space-y-3">
            <p className="text-lg font-bold">QCM bientôt disponible</p>
            <p className="text-sm text-muted-foreground">Les questions pour cet exercice arrivent prochainement.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── QCM en cours
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/exercices">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Tous les exercices
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {completed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Terminé
              </span>
            )}
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyColor[difficulty] ?? difficultyColor.moyen}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </div>
        </div>

        {/* Titre + meta */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{subject}</p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{title}</h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
<span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{points} pts</span>
          </div>
        </div>

        {/* Chrono */}
        {!showExplanation && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Temps restant
              </span>
              <span className={`font-black text-sm tabular-nums ${
                timeLeft <= 10 ? "text-rose-600 animate-pulse" :
                timeLeft <= 20 ? "text-amber-600" : "text-emerald-600"
              }`}>{timeLeft}s</span>
            </div>
            <div className="w-full rounded-full bg-muted h-2 overflow-hidden">
              <motion.div
                animate={{ width: `${(timeLeft / (TIMER_CONFIG[difficulty] ?? 45)) * 100}%` }}
                transition={{ duration: 0.9 }}
                className={`h-full rounded-full transition-colors ${
                  timeLeft <= 10 ? "bg-rose-500" :
                  timeLeft <= 20 ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
            </div>
          </div>
        )}

        {/* Barre de progression */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Question {currentIndex + 1} sur {totalQuestions}</span>
            <span>{currentIndex}/{totalQuestions} complétées</span>
          </div>
          <div className="w-full rounded-full bg-muted h-2 overflow-hidden">
            <motion.div
              animate={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full bg-blue-500"
            />
          </div>
        </div>

        {/* Carte question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5"
          >
            {/* Question */}
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600">
                {currentIndex + 1}
              </span>
              <p className="text-base font-semibold leading-snug pt-0.5">{currentQuestion.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {OPTION_LABELS.map((label, i) => {
                const text = currentQuestion[OPTION_KEYS[i]];
                const isSelected = selectedForCurrent === label;
                const isCorrectOption = label === currentQuestion.correct_answer;
                let optionStyle = "border-border bg-background hover:bg-muted/50 hover:border-blue-400 cursor-pointer";
                if (showExplanation) {
                  if (isCorrectOption) optionStyle = "border-emerald-500 bg-emerald-500/10 cursor-default";
                  else if (isSelected && !isCorrectOption) optionStyle = "border-rose-500 bg-rose-500/10 cursor-default";
                  else optionStyle = "border-border bg-background opacity-50 cursor-default";
                } else if (isSelected) {
                  optionStyle = "border-blue-500 bg-blue-500/10 cursor-pointer";
                }
                return (
                  <button
                    key={label}
                    onClick={() => handleSelectOption(label)}
                    disabled={showExplanation}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${optionStyle}`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
                      showExplanation && isCorrectOption ? "bg-emerald-500 text-white border-emerald-500" :
                      showExplanation && isSelected && !isCorrectOption ? "bg-rose-500 text-white border-rose-500" :
                      isSelected ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground"
                    }`}>
                      {label}
                    </span>
                    <span className="text-sm">{text}</span>
                    {showExplanation && isCorrectOption && (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    {showExplanation && isSelected && !isCorrectOption && (
                      <XCircle className="ml-auto h-4 w-4 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explication */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl border p-4 ${isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}
                >
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCorrect ? "text-emerald-700" : "text-amber-700"}`}>
                    {isCorrect ? "✅ Bonne réponse !" : "💡 À retenir"}
                  </p>
                  <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton suivant */}
            {showExplanation && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={handleNext}
                  className="w-full rounded-xl bg-hero-gradient text-white hover:opacity-90"
                >
                  {isLastQuestion ? (
                    <><Trophy className="mr-2 h-4 w-4" /> Voir mes résultats</>
                  ) : (
                    <>Question suivante <ChevronRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

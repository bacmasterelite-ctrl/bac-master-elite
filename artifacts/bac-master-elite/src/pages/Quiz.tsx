import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCw,
  ArrowRight,
  Sparkles,
  Lock,
  Crown,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { usePremiumStatus } from "@/lib/queries";
import {
  useSaveQuizResult,
  useMyQuizResults,
  useDailyUsage,
  useIncrementDailyUsage,
  FREE_QUIZ_DAILY_LIMIT,
} from "@/lib/extensions";
import {
  getQuizForSerie,
  POINTS_PER_CORRECT,
  type QuizQuestion,
} from "@/lib/quizBank";
import { cn } from "@/lib/utils";

type Phase = "intro" | "playing" | "result";

export default function Quiz() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isPremium } = usePremiumStatus(user?.id);
  const { data: usage } = useDailyUsage(user?.id);
  const { data: history = [] } = useMyQuizResults(user?.id);
  const incrementUsage = useIncrementDailyUsage();
  const saveResult = useSaveQuizResult();
  const { toast } = useToast();

  const serie = (profile?.serie ?? "D").toUpperCase();
  const quizCountToday = usage?.quiz_count ?? 0;
  const remaining = isPremium
    ? Infinity
    : Math.max(0, FREE_QUIZ_DAILY_LIMIT - quizCountToday);
  const limitReached = !isPremium && remaining === 0;

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);

  const score = useMemo(
    () => answers.filter((a) => a.correct).length,
    [answers],
  );
  const totalCorrect = score;
  const earnedPoints = totalCorrect * POINTS_PER_CORRECT;

  const startQuiz = async () => {
    if (!user) return;
    if (limitReached) return;
    if (!isPremium) {
      const res = await incrementUsage.mutateAsync({
        userId: user.id,
        column: "quiz_count",
        limit: FREE_QUIZ_DAILY_LIMIT,
      });
      if (!res.allowed) {
        toast({
          title: "Limite atteinte",
          description: `${FREE_QUIZ_DAILY_LIMIT} quiz par jour pour les comptes gratuits.`,
          variant: "destructive",
        });
        return;
      }
    }
    setQuestions(getQuizForSerie(serie, 5));
    setCurrentIdx(0);
    setChosen(null);
    setRevealed(false);
    setAnswers([]);
    setPhase("playing");
  };

  const submitAnswer = () => {
    if (chosen === null || revealed) return;
    const correct = chosen === questions[currentIdx].correctIndex;
    setAnswers((prev) => [...prev, { correct }]);
    setRevealed(true);
  };

  const nextQuestion = async () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setChosen(null);
      setRevealed(false);
      return;
    }
    setPhase("result");
    if (user) {
      try {
        await saveResult.mutateAsync({
          user_id: user.id,
          serie,
          score: earnedPoints,
          total: questions.length * POINTS_PER_CORRECT,
        });
        toast({
          title: `+${earnedPoints} points !`,
          description: `Bravo, vos points ont été ajoutés à votre profil.`,
        });
      } catch (err) {
        toast({
          title: "Score local enregistré",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      }
    }
  };

  const restart = () => {
    setPhase("intro");
    setQuestions([]);
    setAnswers([]);
    setCurrentIdx(0);
    setChosen(null);
    setRevealed(false);
  };

  useEffect(() => {
    setPhase("intro");
  }, [serie]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Quiz · Série {serie}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Testez vos connaissances
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            5 questions adaptées à votre série. Chaque bonne réponse rapporte{" "}
            <span className="font-semibold text-emerald-600">
              {POINTS_PER_CORRECT} points
            </span>{" "}
            ajoutés à votre profil et au classement.
          </p>
        </div>

        {!isPremium && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium">
              {remaining}/{FREE_QUIZ_DAILY_LIMIT} quiz restants aujourd'hui
            </span>
            <span className="ml-auto">
              <Link href="/dashboard/upgrade">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  data-testid="button-quiz-upgrade"
                >
                  <Crown className="mr-1 h-3.5 w-3.5 text-amber-500" />
                  Premium illimité
                </Button>
              </Link>
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hero-gradient">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold">
                    Quiz personnalisé pour la série {serie}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    5 questions · ~3 minutes · jusqu'à{" "}
                    {5 * POINTS_PER_CORRECT} points à gagner
                  </p>
                </div>
              </div>

              {limitReached ? (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 shrink-0 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Limite quotidienne atteinte
                      </p>
                      <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/80">
                        Vous avez utilisé vos {FREE_QUIZ_DAILY_LIMIT} quiz du
                        jour. Passez à Premium pour des quiz illimités.
                      </p>
                      <Link href="/dashboard/upgrade">
                        <Button
                          size="sm"
                          className="mt-3 rounded-full bg-hero-gradient text-white hover:opacity-90"
                          data-testid="button-quiz-locked-upgrade"
                        >
                          <Crown className="mr-1 h-3.5 w-3.5" />
                          Débloquer Premium
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={startQuiz}
                  disabled={incrementUsage.isPending}
                  className="mt-6 w-full rounded-full bg-hero-gradient text-white hover:opacity-90 sm:w-auto"
                  data-testid="button-start-quiz"
                >
                  Lancer le quiz
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </motion.div>
          )}

          {phase === "playing" && questions.length > 0 && (
            <motion.div
              key={`q-${currentIdx}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>
                  Question {currentIdx + 1} / {questions.length}
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {questions[currentIdx].subject}
                </span>
              </div>
              <Progress
                value={((currentIdx + (revealed ? 1 : 0)) / questions.length) * 100}
                className="h-1.5"
              />
              <p className="text-base font-semibold sm:text-lg">
                {questions[currentIdx].question}
              </p>
              <div className="space-y-2">
                {questions[currentIdx].choices.map((choice, idx) => {
                  const isChosen = chosen === idx;
                  const isCorrect = idx === questions[currentIdx].correctIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={revealed}
                      onClick={() => setChosen(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left text-sm font-medium transition-all",
                        revealed && isCorrect
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                          : revealed && isChosen && !isCorrect
                          ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
                          : isChosen
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                          : "border-border bg-background hover:border-blue-300",
                      )}
                      data-testid={`quiz-choice-${idx}`}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          revealed && isCorrect
                            ? "bg-emerald-500 text-white"
                            : revealed && isChosen && !isCorrect
                            ? "bg-rose-500 text-white"
                            : isChosen
                            ? "bg-blue-500 text-white"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{choice}</span>
                      {revealed && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      {revealed && isChosen && !isCorrect && (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {revealed && questions[currentIdx].explanation && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
                  <span className="font-semibold">💡 Explication : </span>
                  {questions[currentIdx].explanation}
                </div>
              )}

              <div className="flex justify-end">
                {!revealed ? (
                  <Button
                    onClick={submitAnswer}
                    disabled={chosen === null}
                    className="rounded-full bg-hero-gradient text-white hover:opacity-90"
                    data-testid="button-submit-answer"
                  >
                    Valider
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    disabled={saveResult.isPending}
                    className="rounded-full bg-hero-gradient text-white hover:opacity-90"
                    data-testid="button-next-question"
                  >
                    {currentIdx + 1 < questions.length ? "Question suivante" : "Voir mon score"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
                <Trophy className="h-8 w-8 text-amber-500" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Quiz terminé
              </p>
              <p className="mt-1 text-3xl font-extrabold">
                {totalCorrect} / {questions.length}
              </p>
              <p className="text-sm text-muted-foreground">
                bonnes réponses
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">
                  +{earnedPoints} points ajoutés
                </span>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={restart}
                  variant="outline"
                  className="rounded-full"
                  data-testid="button-replay-quiz"
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Rejouer
                </Button>
                <Link href="/dashboard/leaderboard">
                  <Button
                    className="rounded-full bg-hero-gradient text-white hover:opacity-90"
                    data-testid="button-go-leaderboard"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Voir le classement
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold">Vos derniers quiz</p>
            <ul className="mt-3 divide-y divide-border">
              {history.slice(0, 5).map((h, i) => (
                <li
                  key={h.id ?? i}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {h.created_at
                      ? new Date(h.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                  <span className="font-semibold text-emerald-600">
                    +{h.score} pts
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

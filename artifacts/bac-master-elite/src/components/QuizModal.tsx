import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Trophy, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/SupabaseAuthProvider";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface Props {
  lessonId: string | number;
  onComplete: () => void;
  onSkip: () => void;
}

export default function QuizModal({ lessonId, onComplete, onSkip }: Props) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    supabase
      .from("quiz_questions")
      .select("*")
      .eq("lesson_id", lessonId)
      .limit(3)
      .then(({ data }) => {
        const parsed = (data ?? []).map((q) => ({
          ...q,
          correct_answer: Number(q.correct_answer),
          options: Array.isArray(q.options)
            ? q.options
            : typeof q.options === "string"
            ? JSON.parse(q.options)
            : [],
        }));
        setQuestions(parsed);
        setLoading(false);
      });
  }, [lessonId]);

  const q = questions[current];
  const total = questions.length;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct_answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    const isLast = current + 1 >= total;
    if (isLast) {
      const finalScore = Math.round(((score + (selected === q.correct_answer ? 1 : 0)) / total) * 100);
      setFinished(true);
      if (user?.id) {
        supabase.from("quiz_results").upsert({
          user_id: user.id,
          lesson_id: lessonId,
          score: finalScore,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,lesson_id" });
      }
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (total === 0) {
    onComplete();
    return null;
  }

  const currentScore = finished ? score : score + (selected === q?.correct_answer ? 1 : 0);
  const passed = finished && currentScore >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {!finished ? (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Quiz de validation</span>
              <span className="text-xs text-muted-foreground">{current + 1} / {total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-blue-600"
                animate={{ width: `${((current + 1) / total) * 100}%` }}
              />
            </div>
            <p className="text-base font-semibold leading-snug">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                let cls = "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ";
                if (!answered) {
                  cls += "border-border hover:border-blue-500 hover:bg-blue-500/5";
                } else if (idx === q.correct_answer) {
                  cls += "border-emerald-500 bg-emerald-500/10 text-emerald-700";
                } else if (idx === selected) {
                  cls += "border-rose-500 bg-rose-500/10 text-rose-700";
                } else {
                  cls += "border-border opacity-50";
                }
                return (
                  <button key={idx} className={cls} onClick={() => handleSelect(idx)}>
                    <span className="mr-2 font-bold text-muted-foreground">{["A","B","C","D"][idx]}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            <AnimatePresence>
              {answered && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {selected === q.correct_answer ? (
                    <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      <span><strong>Excellent !</strong> {q.explanation ?? "Bonne réponse !"}</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-700">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span><strong>Pas tout à fait.</strong> {q.explanation ?? `Bonne réponse : ${q.options[q.correct_answer]}`}</span>
                    </div>
                  )}
                  <Button className="w-full rounded-xl" onClick={handleNext}>
                    {current + 1 >= total ? "Voir mes résultats" : "Question suivante"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-8 text-center space-y-5">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${passed ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
              <Trophy className="h-10 w-10" />
            </div>
            <div>
              <p className="text-3xl font-extrabold">{score} / {total}</p>
              <p className="mt-1 text-sm text-muted-foreground">bonnes réponses</p>
            </div>
            {passed ? (
              <div className="rounded-2xl bg-emerald-500/10 p-4">
                <p className="font-bold text-emerald-700">🎉 Félicitations !</p>
                <p className="mt-1 text-sm text-emerald-600">Tu maîtrises cette leçon. Continue comme ça, le BAC est à ta portée !</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-500/10 p-4">
                <p className="font-bold text-amber-700">💪 Tu peux faire mieux !</p>
                <p className="mt-1 text-sm text-amber-600">Il faut au moins 2 bonnes réponses sur 3. Relis la leçon et réessaie !</p>
              </div>
            )}
            <div className="flex gap-3">
              {!passed && (
                <Button variant="outline" className="flex-1 rounded-xl" onClick={onSkip}>
                  Relire la leçon
                </Button>
              )}
              <Button
                className={`rounded-xl ${passed ? "w-full" : "flex-1"} bg-hero-gradient text-white`}
                onClick={onComplete}
              >
                {passed ? "Leçon validée ✓" : "Valider quand même"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

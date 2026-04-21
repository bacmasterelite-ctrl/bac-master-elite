import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetExercise, useSubmitExercise } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

interface ResultData {
  score: number;
  total: number;
  percentage: number;
}

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetExercise(id!);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultData | null>(null);
  const queryClient = useQueryClient();

  const submit = useSubmitExercise({
    mutation: {
      onSuccess: (res) => {
        setResult({ score: res.score, total: res.total, percentage: res.percentage });
        queryClient.invalidateQueries();
      },
    },
  });

  if (isLoading) return <div className="text-sm text-gray-500">Chargement...</div>;
  if (!data) return <div>Exercice introuvable.</div>;

  const allAnswered = data.questions.every((q) => answers[q.id]);

  const onSubmit = () => {
    submit.mutate({
      id: data.id,
      data: {
        answers: data.questions.map((q) => ({ questionId: q.id, optionId: answers[q.id]! })),
      },
    });
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="max-w-3xl">
      <Link href="/exercises">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.title}</h1>
      <div className="text-sm text-gray-500 mb-6">{data.subjectName} · {data.questions.length} questions</div>

      {result && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className={`p-6 rounded-2xl border-0 mb-6 ${result.percentage >= 70 ? "bg-emerald-50" : result.percentage >= 50 ? "bg-amber-50" : "bg-red-50"}`}>
            <div className="text-4xl font-bold text-gray-900">{result.percentage}%</div>
            <div className="text-sm text-gray-600 mt-1">{result.score}/{result.total} bonnes réponses</div>
            <Button onClick={reset} variant="outline" size="sm" className="mt-4 rounded-lg" data-testid="button-reset">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Recommencer
            </Button>
          </Card>
        </motion.div>
      )}

      <div className="space-y-4">
        {data.questions.map((q, i) => (
          <Card key={q.id} className="p-6 rounded-2xl border-0 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div className="font-medium text-gray-900">{q.prompt}</div>
            </div>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.id;
                const isCorrect = opt.id === q.correctOptionId;
                const showResult = !!result;
                return (
                  <button
                    key={opt.id}
                    disabled={!!result}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                    data-testid={`option-${q.id}-${opt.id}`}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                      showResult
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-50"
                          : selected
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                        : selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <span className="text-sm">{opt.text}</span>
                    {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    {showResult && selected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <AnimatePresence>
              {result && q.explanation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 p-3 rounded-xl bg-blue-50 text-sm text-blue-900"
                >
                  💡 {q.explanation}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>

      {!result && (
        <Button
          onClick={onSubmit}
          disabled={!allAnswered || submit.isPending}
          className="mt-6 w-full sm:w-auto h-12 px-8 rounded-xl text-base"
          data-testid="button-submit"
        >
          {submit.isPending ? "Validation..." : "Valider mes réponses"}
        </Button>
      )}
    </div>
  );
}

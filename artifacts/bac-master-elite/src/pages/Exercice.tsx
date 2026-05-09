import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, CheckCircle2, Clock, Loader2, PenLine, Star, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useExercises, type Exercise } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/SupabaseAuthProvider";

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

const difficultyColor: Record<string, string> = {
  facile: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  moyen: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  difficile: "bg-rose-500/10 text-rose-700 border-rose-500/20",
};

export default function Exercice() {
  const params = useParams<{ id: string }>();
  const exerciseId = params.id;
  const { user } = useAuth();
  const { data: exercises = [], isLoading } = useExercises();
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selfEval, setSelfEval] = useState<"correct" | "wrong" | null>(null);

  const exercise = useMemo<Exercise | undefined>(
    () => exercises.find((e) => e.id == exerciseId),
    [exercises, exerciseId],
  );

  // Vérifier si déjà complété
  useEffect(() => {
    if (!user?.id || !exerciseId) return;
    supabase
      .from("user_exercise_progress")
      .select("status, user_answer, completed")
      .eq("user_id", user.id)
      .eq("exercise_id", exerciseId)
      .single()
      .then(({ data }) => {
        if (data?.completed === true || data?.status === "completed") {
          setCompleted(true);
          setSubmitted(true);
          setShowSolution(true);
          if (data.user_answer) setUserAnswer(data.user_answer);
        }
      });
  }, [user?.id, exerciseId]);

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    setSubmitted(true);
    setShowSolution(true);
    // Sauvegarder la réponse
    if (user?.id && exerciseId) {
      supabase.from("user_exercise_progress").upsert({
        user_id: user.id,
        exercise_id: exerciseId,
        status: "in_progress",
        user_answer: userAnswer,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,exercise_id" }).then(({error}) => { if(error) console.error("UEP error:", error); });
    }
  };

  const handleSelfEval = (result: "correct" | "wrong") => {
    setSelfEval(result);
    setCompleted(true);
    if (user?.id && exerciseId) {
      supabase.from("user_exercise_progress").upsert({
        user_id: user.id,
        exercise_id: exerciseId,
        status: "completed",
        user_answer: userAnswer,
        score: result === "correct" ? 100 : 40,
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,exercise_id" }).then(({error}) => { if(error) console.error("UEP complete error:", error); });
    }
  };

  if (isLoading) {
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
            <Button className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux exercices
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const r = exercise as Record<string, unknown>;
  const title = pickString(r, "titre", "title") || "Exercice";
  const subject = pickString(r, "matiere", "subject") || "Général";
  const difficulty = (pickString(r, "difficulty", "difficulte") || "Moyen").toLowerCase();
  const points = pickNumber(r, "points") ?? 10;
  const duration = pickString(r, "duration", "duree") || "15 min";
  const statement = pickString(r, "enonce", "statement", "question", "consigne", "description");
  const solution = pickString(r, "corrige", "correction", "solution", "answer", "reponse");

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 space-y-6"
        >
          {/* En-tête */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{subject}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />~{duration}</span>
              <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{points} pts</span>
            </div>
          </div>

          {/* Énoncé */}
          <div className="border-t pt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <PenLine className="h-4 w-4" /> Énoncé
            </h2>
            {statement ? (
              <article className="prose prose-sm max-w-none dark:prose-invert sm:prose-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{statement}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">L'énoncé sera bientôt disponible.</p>
            )}
          </div>

          {/* Zone de réponse */}
          {!submitted ? (
            <div className="border-t pt-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                ✍️ Ta réponse
              </h2>
              <p className="text-xs text-muted-foreground">Tu dois donner ta réponse avant de voir le corrigé.</p>
              <textarea
                className="w-full min-h-[140px] rounded-xl border border-border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Écris ta réponse ici..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              <Button
                className="w-full rounded-xl bg-hero-gradient text-white hover:opacity-90"
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
              >
                Soumettre ma réponse
              </Button>
            </div>
          ) : (
            <div className="border-t pt-6 space-y-4">
              {/* Réponse soumise */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Ta réponse</p>
                <p className="text-sm whitespace-pre-wrap">{userAnswer}</p>
              </div>

              {/* Corrigé */}
              {showSolution && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
                >
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Corrigé détaillé
                  </h2>
                  {solution ? (
                    <article className="prose prose-sm max-w-none dark:prose-invert sm:prose-base">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{solution}</ReactMarkdown>
                    </article>
                  ) : (
                    <p className="text-sm text-muted-foreground">Le corrigé sera publié prochainement.</p>
                  )}
                </motion.div>
              )}

              {/* Auto-évaluation */}
              {!completed && selfEval === null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border p-4 space-y-3"
                >
                  <p className="text-sm font-semibold text-center">Après avoir vu le corrigé, comment tu t'en es sorti ?</p>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                      onClick={() => handleSelfEval("correct")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> J'ai trouvé !
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-rose-500 text-white hover:bg-rose-600"
                      onClick={() => handleSelfEval("wrong")}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Pas encore
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Message après auto-évaluation */}
              {selfEval === "correct" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-emerald-500/10 p-4 text-center">
                  <p className="font-bold text-emerald-700">🎉 Excellent travail !</p>
                  <p className="mt-1 text-sm text-emerald-600">Tu maîtrises ce concept. Continue sur cette lancée, le BAC est à ta portée !</p>
                </motion.div>
              )}
              {selfEval === "wrong" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-amber-500/10 p-4 text-center">
                  <p className="font-bold text-amber-700">💪 Ne lâche pas !</p>
                  <p className="mt-1 text-sm text-amber-600">Chaque erreur est une progression. Relis le corrigé, comprends la méthode et réessaie !</p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

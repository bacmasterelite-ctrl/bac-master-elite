import { useEffect, useState } from "react";
import { Redirect, Link } from "wouter";
import { Loader2, Plus, Pencil, Trash2, X, ChevronLeft, HelpCircle, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile, useLessons } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

type QuizQuestion = {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
};

const MIN_QUESTIONS = 3;

export default function AdminQuiz() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons();

  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    explanation: "",
  });

  async function fetchCounts() {
    const { data } = await supabase.from("quiz_questions").select("lesson_id");
    const map: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      map[row.lesson_id] = (map[row.lesson_id] ?? 0) + 1;
    });
    setCounts(map);
  }

  useEffect(() => {
    fetchCounts();
  }, []);

  async function fetchQuestions(lessonId: string) {
    setLoadingQuestions(true);
    const { data } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: true });
    const parsed = (data ?? []).map((q: any) => ({
      ...q,
      correct_answer: Number(q.correct_answer),
      options: Array.isArray(q.options)
        ? q.options
        : typeof q.options === "string"
        ? JSON.parse(q.options)
        : ["", "", "", ""],
    }));
    setQuestions(parsed);
    setLoadingQuestions(false);
  }

  function openLesson(lesson: any) {
    setSelectedLesson(lesson);
    fetchQuestions(lesson.id);
  }

  function openNewQuestion() {
    setEditing(null);
    setForm({ question: "", options: ["", "", "", ""], correct_answer: 0, explanation: "" });
    setShowForm(true);
  }

  function openEditQuestion(q: QuizQuestion) {
    setEditing(q);
    setForm({
      question: q.question,
      options: q.options.length === 4 ? q.options : ["", "", "", ""],
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? "",
    });
    setShowForm(true);
  }

  async function handleSaveQuestion() {
    if (!selectedLesson) return;
    setSaving(true);
    const payload = {
      lesson_id: selectedLesson.id,
      question: form.question,
      options: form.options,
      correct_answer: form.correct_answer,
      explanation: form.explanation || null,
    };
    if (editing) {
      await supabase.from("quiz_questions").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("quiz_questions").insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    await fetchQuestions(selectedLesson.id);
    await fetchCounts();
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("Supprimer cette question définitivement ?")) return;
    await supabase.from("quiz_questions").delete().eq("id", id);
    if (selectedLesson) await fetchQuestions(selectedLesson.id);
    await fetchCounts();
  }

  async function handleTogglePublish(lesson: any) {
    const count = counts[lesson.id] ?? 0;
    if (!lesson.is_published && count < MIN_QUESTIONS) {
      alert(`Impossible de publier : il faut au moins ${MIN_QUESTIONS} questions de validation (actuellement ${count}).`);
      return;
    }
    await supabase.from("lessons").update({ is_published: !lesson.is_published }).eq("id", lesson.id);
    window.location.reload();
  }

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile?.is_admin) return <Redirect to="/dashboard" />;

  if (!selectedLesson) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link href="/dashboard/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Admin
          </Link>

          <div className="mt-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">QCM de validation des cours</h1>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Chaque leçon doit avoir au moins {MIN_QUESTIONS} questions de validation avant de pouvoir être publiée.
          </p>

          {lessonsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : (
            <div className="mt-6 space-y-2">
              {(lessons as any[]).map((lesson) => {
                const count = counts[lesson.id] ?? 0;
                const insufficient = count < MIN_QUESTIONS;
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                    data-testid={`row-lesson-quiz-${lesson.id}`}
                  >
                    <div>
                      <p className="font-semibold">{lesson.titre ?? lesson.title ?? "Sans titre"}</p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.matiere ?? lesson.subject ?? ""} ·{" "}
                        <span className={insufficient ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>
                          {count} question{count > 1 ? "s" : ""}
                        </span>
                        {" · "}
                        {lesson.is_published ? "Publié" : "Non publié"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {insufficient && (
                        <span title={`Il manque des questions (min. ${MIN_QUESTIONS})`}>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </span>
                      )}
                      <button
                        onClick={() => handleTogglePublish(lesson)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          lesson.is_published ? "bg-muted text-foreground" : "bg-hero-gradient text-white"
                        }`}
                        data-testid={`button-toggle-publish-${lesson.id}`}
                      >
                        {lesson.is_published ? "Dépublier" : "Publier"}
                      </button>
                      <button
                        onClick={() => openLesson(lesson)}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover-elevate"
                        data-testid={`button-manage-quiz-${lesson.id}`}
                      >
                        <HelpCircle className="h-3.5 w-3.5" /> Gérer le QCM
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => setSelectedLesson(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Toutes les leçons
        </button>

        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{selectedLesson.titre ?? selectedLesson.title}</h1>
          <button
            onClick={openNewQuestion}
            className="flex items-center gap-1.5 rounded-lg bg-hero-gradient px-4 py-2 text-sm font-medium text-white"
            data-testid="button-new-question"
          >
            <Plus className="h-4 w-4" /> Nouvelle question
          </button>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {questions.length} / {MIN_QUESTIONS} questions minimum requises pour publier cette leçon.
        </p>

        {loadingQuestions ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="mt-6 space-y-2">
            {questions.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-border p-4" data-testid={`row-question-${q.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {i + 1}. {q.question}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {q.options.map((opt, idx) => (
                        <li key={idx} className={idx === q.correct_answer ? "font-semibold text-emerald-600" : ""}>
                          {["A", "B", "C", "D"][idx]}. {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => openEditQuestion(q)} className="rounded-md p-2 hover-elevate" data-testid={`button-edit-question-${q.id}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="rounded-md p-2 text-rose-600 hover-elevate" data-testid={`button-delete-question-${q.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">Aucune question. Ajoutez-en au moins {MIN_QUESTIONS}.</p>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? "Modifier" : "Nouvelle"} question</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                placeholder="Énoncé de la question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                rows={2}
                data-testid="input-question"
              />

              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.correct_answer === idx}
                    onChange={() => setForm({ ...form, correct_answer: idx })}
                    data-testid={`radio-correct-${idx}`}
                  />
                  <input
                    placeholder={`Proposition ${["A", "B", "C", "D"][idx]}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...form.options];
                      opts[idx] = e.target.value;
                      setForm({ ...form, options: opts });
                    }}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                    data-testid={`input-option-${idx}`}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Coche la bonne réponse à gauche de la proposition.</p>

              <textarea
                placeholder="Explication (optionnel, affichée après la réponse)"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                rows={2}
                data-testid="input-explanation"
              />

              <button
                onClick={handleSaveQuestion}
                disabled={saving || !form.question || form.options.some((o) => !o.trim())}
                className="w-full rounded-lg bg-hero-gradient py-2.5 text-sm font-medium text-white disabled:opacity-50"
                data-testid="button-save-question"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

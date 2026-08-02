/**
 * AdminExercices — Gestion des exercices (table `exercises`)
 * Pattern identique à AdminBlog.tsx
 *
 * PRÉREQUIS : exécuter .local/sql/admin_add_slug_meta.sql dans Supabase
 * pour ajouter les colonnes slug, meta_description, is_published à exercises.
 */
import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2, Plus, Pencil, Trash2, X, PenLine, Search, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import RichEditor, { countWords } from "@/components/RichEditor";

/* ─── Types ─────────────────────────────────────────────── */
type Exercise = {
  id: string;
  title: string;
  slug: string | null;
  statement: string | null;
  solution: string | null;
  serie: string | null;
  subject: string | null;
  course_id: string | null;
  difficulty: string | null;
  is_free: boolean;
  is_premium: boolean;
  is_published: boolean | null;
  points: number;
  meta_description: string | null;
  created_at: string;
};

type Course = {
  id: string;
  title: string;
  subject: string | null;
  serie: string | null;
};

/* ─── Constantes ─────────────────────────────────────────── */
const ALL_SUBJECTS = [
  "Mathématiques", "Physique", "Chimie", "SVT",
  "Français", "Philosophie", "Histoire-Géo", "Anglais", "Littérature",
];
const ALL_SERIES = ["A", "C", "D", "C,D", "A/C/D"];
const DIFFICULTIES = [
  { value: "facile", label: "Facile" },
  { value: "moyen", label: "Moyen" },
  { value: "difficile", label: "Difficile" },
  { value: "extreme", label: "Extrême (Premium)" },
];
const MIN_WORDS = 150;

function genererSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  statement: "",
  solution: "",
  serie: "C,D",
  subject: "",
  course_id: "",
  difficulty: "moyen",
  is_free: true,
  is_premium: false,
  is_published: false,
  points: 10,
  meta_description: "",
};

const DIFF_BADGE: Record<string, string> = {
  facile: "bg-emerald-500/10 text-emerald-700",
  moyen: "bg-amber-500/10 text-amber-700",
  difficile: "bg-rose-500/10 text-rose-700",
  extreme: "bg-purple-500/10 text-purple-700",
};

/* ─── Composant ──────────────────────────────────────────── */
export default function AdminExercices() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wordError, setWordError] = useState(false);

  const [filterSerie, setFilterSerie] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  /* ── Chargement ── */
  async function fetchAll() {
    setLoading(true);
    const [{ data: exs }, { data: crs }] = await Promise.all([
      supabase.from("exercises").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title, subject, serie").order("title"),
    ]);
    setExercises(exs || []);
    setCourses(crs || []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  /* ── Filtres liste ── */
  const filtered = exercises.filter((e) => {
    const matchSerie = !filterSerie || (e.serie ?? "").includes(filterSerie);
    const matchSubject = !filterSubject || (e.subject ?? "").toLowerCase().includes(filterSubject.toLowerCase());
    const matchCourse = !filterCourse || e.course_id === filterCourse;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    return matchSerie && matchSubject && matchCourse && matchSearch;
  });

  /* ── Courses filtrés selon matière sélectionnée dans le formulaire ── */
  const coursesForSubject = courses.filter((c) => {
    if (!form.subject) return true;
    const s = (c.subject ?? "").toLowerCase();
    return s === form.subject.toLowerCase() || s.includes(form.subject.toLowerCase());
  });

  /* ── Ouvrir formulaire ── */
  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setWordError(false);
    setShowForm(true);
  }

  function openEdit(ex: Exercise) {
    setEditing(ex);
    setForm({
      title: ex.title,
      slug: ex.slug ?? genererSlug(ex.title),
      statement: ex.statement ?? "",
      solution: ex.solution ?? "",
      serie: ex.serie ?? "C,D",
      subject: ex.subject ?? "",
      course_id: ex.course_id ?? "",
      difficulty: ex.difficulty ?? "moyen",
      is_free: ex.is_free ?? true,
      is_premium: ex.is_premium ?? false,
      is_published: ex.is_published ?? false,
      points: ex.points ?? 10,
      meta_description: ex.meta_description ?? "",
    });
    setWordError(false);
    setShowForm(true);
  }

  /* ── Sauvegarde ── */
  async function handleSave() {
    const wc = countWords(form.statement);
    if (form.is_published && wc < MIN_WORDS) {
      setWordError(true);
      return;
    }
    setWordError(false);
    setSaving(true);

    const payload: Record<string, unknown> = {
      title: form.title,
      statement: form.statement,
      solution: form.solution || null,
      serie: form.serie,
      subject: form.subject || null,
      course_id: form.course_id || null,
      difficulty: form.difficulty,
      is_free: form.is_free,
      is_premium: form.is_premium,
      points: form.points,
      meta_description: form.meta_description || null,
    };

    // Colonnes ajoutées par migration
    try {
      payload.slug = form.slug || null;
      payload.is_published = form.is_published;
    } catch (_) { /* colonnes pas encore migrées */ }

    if (editing) {
      const { error } = await supabase.from("exercises").update(payload).eq("id", editing.id);
      if (error) {
        const fallback = { ...payload };
        delete fallback.slug;
        delete fallback.is_published;
        await supabase.from("exercises").update(fallback).eq("id", editing.id);
      }
    } else {
      const { error } = await supabase.from("exercises").insert(payload);
      if (error) {
        const fallback = { ...payload };
        delete fallback.slug;
        delete fallback.is_published;
        await supabase.from("exercises").insert(fallback);
      }
    }

    setSaving(false);
    setShowForm(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer définitivement cet exercice ?")) return;
    await supabase.from("exercises").delete().eq("id", id);
    fetchAll();
  }

  /* ── Guards ── */
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

  const wcStatement = countWords(form.statement);

  /* ── Render ── */
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* En-tête */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Gestion des Exercices</h1>
            <p className="text-sm text-muted-foreground">{exercises.length} exercice{exercises.length !== 1 ? "s" : ""} en base</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-hero-gradient px-4 py-2 text-sm font-medium text-white"
            data-testid="button-new-exercise"
          >
            <Plus className="h-4 w-4" /> Nouvel exercice
          </button>
        </div>

        {/* Filtres */}
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border pl-8 pr-3 py-2 text-sm" />
          </div>
          <select value={filterSerie} onChange={(e) => setFilterSerie(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">Toutes séries</option>
            {ALL_SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setFilterCourse(""); }}
            className="rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">Toutes matières</option>
            {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">Tous chapitres</option>
            {courses
              .filter((c) => !filterSubject || (c.subject ?? "").toLowerCase().includes(filterSubject.toLowerCase()))
              .map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {filtered.map((ex) => {
              const wc = countWords(ex.statement ?? "");
              const diff = (ex.difficulty ?? "moyen").toLowerCase();
              const published = ex.is_published ?? true;
              return (
                <div key={ex.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                  data-testid={`row-exercise-${ex.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold truncate">{ex.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium border border-transparent ${DIFF_BADGE[diff] ?? DIFF_BADGE.moyen}`}>
                        {diff}
                      </span>
                      {!published && (
                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Brouillon
                        </span>
                      )}
                      {ex.is_premium && (
                        <span className="shrink-0 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ex.subject ?? "—"} · {ex.serie ?? "—"} · {ex.points} pts · {wc} mot{wc !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 gap-2">
                    <button onClick={() => openEdit(ex)}
                      className="rounded-md p-2 hover-elevate" data-testid={`button-edit-${ex.id}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(ex.id)}
                      className="rounded-md p-2 text-rose-600 hover-elevate" data-testid={`button-delete-${ex.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-muted-foreground">
                {exercises.length === 0 ? "Aucun exercice. Créez le premier !" : "Aucun résultat."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Modal formulaire ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold">{editing ? "Modifier" : "Nouvel"} exercice</h2>
              </div>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-5 space-y-4">

              {/* Titre */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Titre *</label>
                <input
                  placeholder="Titre de l'exercice"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: genererSlug(e.target.value) })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  data-testid="input-title"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL (slug)</label>
                <input
                  placeholder="url-de-l-exercice"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: genererSlug(e.target.value) })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono"
                />
              </div>

              {/* Série + Matière + Difficulté */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Série *</label>
                  <select value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm">
                    {ALL_SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matière *</label>
                  <select value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value, course_id: "" })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    data-testid="select-subject">
                    <option value="">Choisir…</option>
                    {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulté *</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    data-testid="select-difficulty">
                    {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Chapitre associé — dynamique selon matière */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chapitre / Cours associé *
                </label>
                <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  data-testid="select-course">
                  <option value="">Sélectionner un chapitre…</option>
                  {coursesForSubject.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}{c.subject ? ` — ${c.subject}` : ""}
                    </option>
                  ))}
                </select>
                {!form.subject && (
                  <p className="mt-1 text-xs text-muted-foreground">Sélectionnez d'abord une matière pour filtrer les chapitres.</p>
                )}
              </div>

              {/* Énoncé */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Énoncé complet *
                    <span className="ml-1 font-normal normal-case">
                      — <strong className={wcStatement < MIN_WORDS ? "text-amber-600" : "text-emerald-600"}>{wcStatement} mot{wcStatement !== 1 ? "s" : ""}</strong>
                      {" "}/ {MIN_WORDS} min
                    </span>
                  </label>
                </div>
                <RichEditor
                  key={(editing?.id ?? "new-ex") + "-stmt"}
                  value={form.statement}
                  onChange={(val) => setForm((f) => ({ ...f, statement: val }))}
                  placeholder={"Rédigez l'énoncé complet de l'exercice.\n\nExemple :\n## Partie A — Questions de cours\n1. Définissez...\n2. Expliquez...\n\n## Partie B — Application\nSoit f(x) = ..."}
                  rows={12}
                />
                {wordError && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    L'énoncé doit faire au moins {MIN_WORDS} mots pour être publié ({wcStatement} actuellement).
                  </div>
                )}
              </div>

              {/* Correction */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Correction / Corrigé détaillé
                  <span className="ml-1 font-normal normal-case text-muted-foreground">(recommandé)</span>
                </label>
                <RichEditor
                  key={(editing?.id ?? "new-ex") + "-sol"}
                  value={form.solution}
                  onChange={(val) => setForm((f) => ({ ...f, solution: val }))}
                  placeholder={"Rédigez la correction complète.\n\n## Correction Partie A\n1. Définition : ...\n2. Explication : ...\n\n## Correction Partie B\nf'(x) = ..."}
                  rows={10}
                />
              </div>

              {/* Points + SEO */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Points & SEO</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Points accordés</label>
                    <input type="number" min={5} max={100} step={5} value={form.points}
                      onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                      data-testid="input-points"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Meta description <span className="text-muted-foreground">{form.meta_description.length}/160</span></label>
                    <input
                      placeholder="Description unique pour Google"
                      value={form.meta_description}
                      onChange={(e) => setForm({ ...form, meta_description: e.target.value.slice(0, 160) })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                      data-testid="input-meta-description"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_free}
                    onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
                    className="h-4 w-4 rounded border-border" />
                  Accès libre (non-premium)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_premium}
                    onChange={(e) => setForm({ ...form, is_premium: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                    data-testid="check-premium" />
                  Correction Premium uniquement
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                    data-testid="check-published" />
                  Marquer comme publié
                  <span className="text-xs text-muted-foreground">(≥ {MIN_WORDS} mots)</span>
                </label>
              </div>

              {/* Bouton sauvegarder */}
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.statement.trim()}
                className="w-full rounded-lg bg-hero-gradient py-2.5 text-sm font-medium text-white disabled:opacity-50"
                data-testid="button-save-exercise"
              >
                {saving ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Enregistrement…</> : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

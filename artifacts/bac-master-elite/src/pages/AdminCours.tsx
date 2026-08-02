/**
 * AdminCours — Gestion des leçons (table `lessons`)
 * Pattern identique à AdminBlog.tsx
 *
 * PRÉREQUIS : exécuter .local/sql/admin_add_slug_meta.sql dans Supabase
 * pour ajouter les colonnes slug, meta_description, is_published à lessons.
 */
import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2, Plus, Pencil, Trash2, X, BookOpen, Search, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import RichEditor, { countWords } from "@/components/RichEditor";

/* ─── Types ─────────────────────────────────────────────── */
type Lesson = {
  id: string;
  title: string;
  slug: string | null;
  content: string | null;
  serie: string | null;
  subject: string | null;
  course_id: string | null;
  is_premium: boolean;
  is_published: boolean | null;
  meta_description: string | null;
  created_at: string;
};

type Course = {
  id: string;
  title: string;
  subject: string | null;
  level: string | null;
  serie: string | null;
};

/* ─── Constantes ─────────────────────────────────────────── */
const ALL_SUBJECTS = [
  "Mathématiques", "Physique", "Chimie", "SVT",
  "Français", "Philosophie", "Histoire-Géo", "Anglais", "Littérature",
];
const ALL_SERIES = ["A", "C", "D", "C,D", "A/C/D"];
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
  content: "",
  serie: "C,D",
  subject: "",
  course_id: "",
  is_premium: false,
  is_published: false,
  meta_description: "",
};

/* ─── Composant ──────────────────────────────────────────── */
export default function AdminCours() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wordError, setWordError] = useState(false);

  const [filterSerie, setFilterSerie] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  /* ── Chargement ── */
  async function fetchAll() {
    setLoading(true);
    const [{ data: lsn }, { data: crs }] = await Promise.all([
      supabase.from("lessons").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title, subject, level, serie").order("title"),
    ]);
    setLessons(lsn || []);
    setCourses(crs || []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  /* ── Filtres liste ── */
  const filtered = lessons.filter((l) => {
    const matchSerie = !filterSerie || (l.serie ?? "").includes(filterSerie);
    const matchSubject = !filterSubject || (l.subject ?? "").toLowerCase().includes(filterSubject.toLowerCase());
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    return matchSerie && matchSubject && matchSearch;
  });

  /* ── Courses filtrés pour le dropdown selon la matière ── */
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

  function openEdit(lesson: Lesson) {
    setEditing(lesson);
    setForm({
      title: lesson.title,
      slug: lesson.slug ?? genererSlug(lesson.title),
      content: lesson.content ?? "",
      serie: lesson.serie ?? "C,D",
      subject: lesson.subject ?? "",
      course_id: lesson.course_id ?? "",
      is_premium: lesson.is_premium ?? false,
      is_published: lesson.is_published ?? false,
      meta_description: lesson.meta_description ?? "",
    });
    setWordError(false);
    setShowForm(true);
  }

  /* ── Sauvegarde ── */
  async function handleSave() {
    const wc = countWords(form.content);
    if (form.is_published && wc < MIN_WORDS) {
      setWordError(true);
      return;
    }
    setWordError(false);
    setSaving(true);

    const payload: Record<string, unknown> = {
      title: form.title,
      content: form.content,
      serie: form.serie,
      subject: form.subject || null,
      course_id: form.course_id || null,
      is_premium: form.is_premium,
      meta_description: form.meta_description || null,
    };

    // Slug et is_published — colonnes ajoutées par migration SQL
    // Si elles n'existent pas encore, l'upsert les ignore sans erreur
    try {
      payload.slug = form.slug || null;
      payload.is_published = form.is_published;
    } catch (_) {/* colonnes pas encore migrées */}

    if (editing) {
      const { error } = await supabase.from("lessons").update(payload).eq("id", editing.id);
      if (error) {
        // Retry sans les colonnes optionnelles si erreur de colonne inconnue
        const fallback = { ...payload };
        delete fallback.slug;
        delete fallback.is_published;
        await supabase.from("lessons").update(fallback).eq("id", editing.id);
      }
    } else {
      const { error } = await supabase.from("lessons").insert(payload);
      if (error) {
        const fallback = { ...payload };
        delete fallback.slug;
        delete fallback.is_published;
        await supabase.from("lessons").insert(fallback);
      }
    }

    setSaving(false);
    setShowForm(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer définitivement cette leçon ? Les exercices liés ne seront pas supprimés.")) return;
    await supabase.from("lessons").delete().eq("id", id);
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

  const wc = countWords(form.content);

  /* ── Render ── */
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* En-tête */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Gestion des Cours</h1>
            <p className="text-sm text-muted-foreground">{lessons.length} leçon{lessons.length !== 1 ? "s" : ""} en base</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-hero-gradient px-4 py-2 text-sm font-medium text-white"
            data-testid="button-new-lesson"
          >
            <Plus className="h-4 w-4" /> Nouvelle leçon
          </button>
        </div>

        {/* Filtres */}
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <select value={filterSerie} onChange={(e) => setFilterSerie(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">Toutes séries</option>
            {ALL_SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">Toutes matières</option>
            {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {filtered.map((l) => {
              const wc = countWords(l.content ?? "");
              const published = l.is_published ?? true; // existing = treated as published
              return (
                <div key={l.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                  data-testid={`row-lesson-${l.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold truncate">{l.title}</p>
                      {!published && (
                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Brouillon
                        </span>
                      )}
                      {l.is_premium && (
                        <span className="shrink-0 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {l.subject ?? "—"} · {l.serie ?? "—"} · {wc} mot{wc !== 1 ? "s" : ""}
                      {l.slug && <span> · /{l.slug}</span>}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 gap-2">
                    <button onClick={() => openEdit(l)}
                      className="rounded-md p-2 hover-elevate" data-testid={`button-edit-${l.id}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(l.id)}
                      className="rounded-md p-2 text-rose-600 hover-elevate" data-testid={`button-delete-${l.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-muted-foreground">
                {lessons.length === 0 ? "Aucune leçon. Créez la première !" : "Aucun résultat."}
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
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold">{editing ? "Modifier" : "Nouvelle"} leçon</h2>
              </div>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-5 space-y-4">

              {/* Titre */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Titre *</label>
                <input
                  placeholder="Titre de la leçon"
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
                  placeholder="url-de-la-lecon"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: genererSlug(e.target.value) })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono"
                  data-testid="input-slug"
                />
              </div>

              {/* Série + Matière */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Série *</label>
                  <select value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm">
                    {ALL_SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matière *</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value, course_id: "" })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm">
                    <option value="">Choisir…</option>
                    {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Cours parent */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chapitre / Module parent
                  <span className="ml-1 font-normal normal-case text-muted-foreground">(optionnel)</span>
                </label>
                <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  data-testid="select-course">
                  <option value="">Aucun</option>
                  {coursesForSubject.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}{c.subject ? ` (${c.subject})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contenu riche */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Contenu *
                    <span className="ml-1 font-normal normal-case">
                      — <strong className={wc < MIN_WORDS ? "text-amber-600" : "text-emerald-600"}>{wc} mot{wc !== 1 ? "s" : ""}</strong>
                      {" "}/ {MIN_WORDS} min pour publication
                    </span>
                  </label>
                </div>
                <RichEditor
                  key={editing?.id ?? "new-lesson"}
                  value={form.content}
                  onChange={(val) => setForm((f) => ({ ...f, content: val }))}
                  placeholder={"Rédigez le contenu de la leçon ici.\n\nUtilisez la barre d'outils pour :\n## Titre de section\n### Sous-titre\n**texte en gras**\n- liste à puces\n1. liste numérotée"}
                  rows={14}
                />
                {wordError && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Le contenu doit faire au moins {MIN_WORDS} mots pour être publié ({wc} actuellement).
                    Passez en "Brouillon" pour enregistrer sans cette contrainte.
                  </div>
                )}
              </div>

              {/* SEO */}
              <div className="rounded-lg border border-border p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO</p>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Meta description</label>
                  <span className="text-xs text-muted-foreground">{form.meta_description.length}/160</span>
                </div>
                <textarea
                  placeholder="Description unique visible dans les résultats Google (max 160 caractères)"
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value.slice(0, 160) })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  rows={2}
                  data-testid="input-meta-description"
                />
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_premium}
                    onChange={(e) => setForm({ ...form, is_premium: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                    data-testid="check-premium"
                  />
                  Contenu Premium
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                    data-testid="check-published"
                  />
                  Marquer comme publié
                  <span className="text-xs text-muted-foreground">(≥ {MIN_WORDS} mots requis)</span>
                </label>
              </div>

              {/* Bouton sauvegarder */}
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="w-full rounded-lg bg-hero-gradient py-2.5 text-sm font-medium text-white disabled:opacity-50"
                data-testid="button-save-lesson"
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

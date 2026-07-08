import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

type Article = {
  id: string;
  titre: string;
  slug: string;
  extrait: string | null;
  contenu: string;
  image_couverture: string | null;
  categorie_id: string | null;
  meta_titre: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  statut: string;
  created_at: string;
};

type Categorie = { id: string; nom: string; slug: string };

function genererSlug(texte: string) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminBlog() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titre: "",
    slug: "",
    extrait: "",
    contenu: "",
    image_couverture: "",
    categorie_id: "",
    meta_titre: "",
    meta_description: "",
    meta_keywords: "",
    statut: "brouillon",
  });

  async function fetchAll() {
    setLoading(true);
    const { data: arts } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
    const { data: cats } = await supabase.from("categories").select("*");
    setArticles(arts || []);
    setCategories(cats || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function openNew() {
    setEditing(null);
    setForm({
      titre: "", slug: "", extrait: "", contenu: "", image_couverture: "",
      categorie_id: "", meta_titre: "", meta_description: "", meta_keywords: "", statut: "brouillon",
    });
    setShowForm(true);
  }

  function openEdit(article: Article) {
    setEditing(article);
    setForm({
      titre: article.titre,
      slug: article.slug,
      extrait: article.extrait || "",
      contenu: article.contenu,
      image_couverture: article.image_couverture || "",
      categorie_id: article.categorie_id || "",
      meta_titre: article.meta_titre || "",
      meta_description: article.meta_description || "",
      meta_keywords: article.meta_keywords || "",
      statut: article.statut,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      categorie_id: form.categorie_id || null,
      published_at: form.statut === "publie" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      await supabase.from("articles").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("articles").insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    await supabase.from("articles").delete().eq("id", id);
    fetchAll();
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestion du Blog</h1>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-hero-gradient px-4 py-2 text-sm font-medium text-white"
            data-testid="button-new-article"
          >
            <Plus className="h-4 w-4" /> Nouvel article
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="mt-6 space-y-2">
            {articles.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-4" data-testid={`row-article-${a.id}`}>
                <div>
                  <p className="font-semibold">{a.titre}</p>
                  <p className="text-xs text-muted-foreground">
                    /{a.slug} · {a.statut === "publie" ? "Publié" : "Brouillon"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(a)} className="rounded-md p-2 hover-elevate" data-testid={`button-edit-${a.id}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="rounded-md p-2 text-rose-600 hover-elevate" data-testid={`button-delete-${a.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {articles.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucun article. Créez le premier !</p>}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? "Modifier" : "Nouvel"} article</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                placeholder="Titre"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value, slug: genererSlug(e.target.value) })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                data-testid="input-titre"
              />
              <input
                placeholder="URL (slug)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: genererSlug(e.target.value) })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                data-testid="input-slug"
              />
              <textarea
                placeholder="Extrait court"
                value={form.extrait}
                onChange={(e) => setForm({ ...form, extrait: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                rows={2}
                data-testid="input-extrait"
              />
              <textarea
                placeholder="Contenu (HTML autorisé)"
                value={form.contenu}
                onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                rows={8}
                data-testid="input-contenu"
              />
              <input
                placeholder="URL image de couverture"
                value={form.image_couverture}
                onChange={(e) => setForm({ ...form, image_couverture: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                data-testid="input-image"
              />
              <select
                value={form.categorie_id}
                onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                data-testid="select-categorie"
              >
                <option value="">Sans catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>

              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">SEO</p>
                <input
                  placeholder="Meta titre"
                  value={form.meta_titre}
                  onChange={(e) => setForm({ ...form, meta_titre: e.target.value })}
                  className="mb-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  data-testid="input-meta-titre"
                />
                <textarea
                  placeholder="Meta description"
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  className="mb-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  rows={2}
                  data-testid="input-meta-description"
                />
                <input
                  placeholder="Mots-clés (séparés par des virgules)"
                  value={form.meta_keywords}
                  onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  data-testid="input-meta-keywords"
                />
              </div>

              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                data-testid="select-statut"
              >
                <option value="brouillon">Brouillon</option>
                <option value="publie">Publié</option>
              </select>

              <button
                onClick={handleSave}
                disabled={saving || !form.titre || !form.slug || !form.contenu}
                className="w-full rounded-lg bg-hero-gradient py-2.5 text-sm font-medium text-white disabled:opacity-50"
                data-testid="button-save-article"
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

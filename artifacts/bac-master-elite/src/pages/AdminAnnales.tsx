import { useEffect, useState, useRef } from "react";
import { Redirect, Link } from "wouter";
import { Loader2, Plus, Pencil, Trash2, X, ChevronLeft, Upload, FileText, Camera } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

type Annal = {
  id: string;
  matiere: string;
  serie: string;
  year: number;
  session: string;
  duree: string;
  sujet_contenu: string;
  corrige_contenu: string;
  sujet_pdf_url: string | null;
  corrige_pdf_url: string | null;
};

const SERIES = ["A", "C", "D"];

async function uploadFichier(file: File, prefix: string): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("annales-files").upload(path, file);
  if (error) {
    alert("Erreur upload : " + error.message);
    return null;
  }
  const { data } = supabase.storage.from("annales-files").getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminAnnales() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [annals, setAnnals] = useState<Annal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Annal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSujet, setUploadingSujet] = useState(false);
  const [uploadingCorrige, setUploadingCorrige] = useState(false);

  const sujetInputRef = useRef<HTMLInputElement>(null);
  const corrigeInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    matiere: "",
    serie: "D",
    year: new Date().getFullYear(),
    session: "Juin",
    duree: "3h",
    sujet_contenu: "",
    corrige_contenu: "",
    sujet_pdf_url: "",
    corrige_pdf_url: "",
  });

  async function fetchAll() {
    setLoading(true);
    const { data } = await supabase
      .from("annals")
      .select("*")
      .order("year", { ascending: false });
    setAnnals(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function openNew() {
    setEditing(null);
    setForm({
      matiere: "", serie: "D", year: new Date().getFullYear(),
      session: "Juin", duree: "3h", sujet_contenu: "", corrige_contenu: "",
      sujet_pdf_url: "", corrige_pdf_url: "",
    });
    setShowForm(true);
  }

  function openEdit(a: Annal) {
    setEditing(a);
    setForm({
      matiere: a.matiere,
      serie: a.serie,
      year: a.year,
      session: a.session,
      duree: a.duree,
      sujet_contenu: a.sujet_contenu || "",
      corrige_contenu: a.corrige_contenu || "",
      sujet_pdf_url: a.sujet_pdf_url || "",
      corrige_pdf_url: a.corrige_pdf_url || "",
    });
    setShowForm(true);
  }

  async function handleFileSujet(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSujet(true);
    const url = await uploadFichier(file, "sujet");
    if (url) setForm((f) => ({ ...f, sujet_pdf_url: url }));
    setUploadingSujet(false);
  }

  async function handleFileCorrige(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCorrige(true);
    const url = await uploadFichier(file, "corrige");
    if (url) setForm((f) => ({ ...f, corrige_pdf_url: url }));
    setUploadingCorrige(false);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await supabase.from("annals").update(form).eq("id", editing.id);
    } else {
      await supabase.from("annals").insert(form);
    }
    setSaving(false);
    setShowForm(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette annale définitivement ?")) return;
    await supabase.from("annals").delete().eq("id", id);
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
        <Link href="/dashboard/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Admin
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestion des Annales</h1>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-hero-gradient px-4 py-2 text-sm font-medium text-white"
            data-testid="button-new-annal"
          >
            <Plus className="h-4 w-4" /> Nouvelle annale
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="mt-6 space-y-2">
            {annals.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-4" data-testid={`row-annal-${a.id}`}>
                <div>
                  <p className="font-semibold">{a.matiere} — Série {a.serie} — {a.year}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.session} · Durée {a.duree} ·{" "}
                    {a.sujet_pdf_url ? "Sujet PDF ✓" : a.sujet_contenu ? "Sujet texte ✓" : "Sujet manquant"} ·{" "}
                    {a.corrige_pdf_url ? "Corrigé PDF ✓" : a.corrige_contenu ? "Corrigé texte ✓" : "Corrigé manquant"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(a)} className="rounded-md p-2 hover-elevate" data-testid={`button-edit-annal-${a.id}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="rounded-md p-2 text-rose-600 hover-elevate" data-testid={`button-delete-annal-${a.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {annals.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucune annale. Ajoutez la première !</p>}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? "Modifier" : "Nouvelle"} annale</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                placeholder="Matière (ex: Mathématiques)"
                value={form.matiere}
                onChange={(e) => setForm({ ...form, matiere: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                data-testid="input-matiere"
              />

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={form.serie}
                  onChange={(e) => setForm({ ...form, serie: e.target.value })}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                  data-testid="select-serie"
                >
                  {SERIES.map((s) => <option key={s} value={s}>Série {s}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Année"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                  data-testid="input-year"
                />
                <input
                  placeholder="Durée (ex: 3h)"
                  value={form.duree}
                  onChange={(e) => setForm({ ...form, duree: e.target.value })}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                  data-testid="input-duree"
                />
              </div>

              <input
                placeholder="Session (ex: Juin, Septembre, Bac Blanc)"
                value={form.session}
                onChange={(e) => setForm({ ...form, session: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                data-testid="input-session"
              />

              {/* SUJET */}
              <div className="rounded-lg border border-border p-3">
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">Sujet</label>

                {form.sujet_pdf_url ? (
                  <div className="mb-2 flex items-center justify-between rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                    <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> Fichier ajouté</span>
                    <button onClick={() => setForm({ ...form, sujet_pdf_url: "" })} className="text-xs underline">Retirer</button>
                  </div>
                ) : (
                  <div className="mb-2 flex gap-2">
                    <input
                      ref={sujetInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      capture="environment"
                      onChange={handleFileSujet}
                      className="hidden"
                      data-testid="input-file-sujet"
                    />
                    <button
                      type="button"
                      onClick={() => sujetInputRef.current?.click()}
                      disabled={uploadingSujet}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-sm text-muted-foreground hover-elevate"
                    >
                      {uploadingSujet ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {uploadingSujet ? "Envoi..." : "Photo ou PDF du sujet"}
                    </button>
                  </div>
                )}

                <textarea
                  placeholder="Ou collez le texte complet du sujet ici..."
                  value={form.sujet_contenu}
                  onChange={(e) => setForm({ ...form, sujet_contenu: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono"
                  rows={5}
                  data-testid="input-sujet-contenu"
                />
              </div>

              {/* CORRIGÉ */}
              <div className="rounded-lg border border-border p-3">
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">Corrigé</label>

                {form.corrige_pdf_url ? (
                  <div className="mb-2 flex items-center justify-between rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                    <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> Fichier ajouté</span>
                    <button onClick={() => setForm({ ...form, corrige_pdf_url: "" })} className="text-xs underline">Retirer</button>
                  </div>
                ) : (
                  <div className="mb-2 flex gap-2">
                    <input
                      ref={corrigeInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      capture="environment"
                      onChange={handleFileCorrige}
                      className="hidden"
                      data-testid="input-file-corrige"
                    />
                    <button
                      type="button"
                      onClick={() => corrigeInputRef.current?.click()}
                      disabled={uploadingCorrige}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-sm text-muted-foreground hover-elevate"
                    >
                      {uploadingCorrige ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {uploadingCorrige ? "Envoi..." : "Photo ou PDF du corrigé"}
                    </button>
                  </div>
                )}

                <textarea
                  placeholder="Ou collez le texte complet du corrigé ici..."
                  value={form.corrige_contenu}
                  onChange={(e) => setForm({ ...form, corrige_contenu: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono"
                  rows={5}
                  data-testid="input-corrige-contenu"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Vous pouvez soit uploader une photo/PDF, soit coller le texte — ou les deux.
              </p>

              <button
                onClick={handleSave}
                disabled={saving || !form.matiere || (!form.sujet_contenu && !form.sujet_pdf_url)}
                className="w-full rounded-lg bg-hero-gradient py-2.5 text-sm font-medium text-white disabled:opacity-50"
                data-testid="button-save-annal"
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

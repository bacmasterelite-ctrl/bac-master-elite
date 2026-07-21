import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

type Article = {
  id: string;
  titre: string;
  slug: string;
  extrait: string | null;
  image_couverture: string | null;
  created_at: string;
  categorie_id: string | null;
};

type Categorie = { id: string; nom: string; slug: string };

export default function DashboardBlog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieActive, setCategorieActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: cats } = await supabase.from("categories").select("*");
      setCategories(cats || []);

      let query = supabase
        .from("articles")
        .select("*")
        .eq("statut", "publie")
        .order("published_at", { ascending: false });

      if (categorieActive) query = query.eq("categorie_id", categorieActive);

      const { data: arts } = await query;
      setArticles(arts || []);
      setLoading(false);
    }
    fetchData();
  }, [categorieActive]);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conseils, méthodologie et actualités pour réussir ton BAC.</p>

        {/* Scrollable filter bar — single row on mobile, no wrapping */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <button
            onClick={() => setCategorieActive(null)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              !categorieActive ? "bg-hero-gradient text-white border-transparent" : "border-border text-muted-foreground hover-elevate"
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategorieActive(cat.id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                categorieActive === cat.id ? "bg-hero-gradient text-white border-transparent" : "border-border text-muted-foreground hover-elevate"
              }`}
            >
              {cat.nom}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-12 text-center text-muted-foreground">Chargement...</p>
        ) : articles.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">Aucun article pour le moment.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.id} href={`/dashboard/blog/${article.slug}`}>
                <article className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card hover-elevate">
                  {article.image_couverture && (
                    <img src={article.image_couverture} alt={article.titre} loading="lazy" decoding="async" className="h-40 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(article.created_at).toLocaleDateString("fr-FR")}
                    </div>
                    <h2 className="mt-2 text-base font-bold leading-snug">{article.titre}</h2>
                    {article.extrait && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.extrait}</p>}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Lire la suite <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

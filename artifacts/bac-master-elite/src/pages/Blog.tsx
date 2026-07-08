import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowRight } from "lucide-react";

type Article = {
  id: string;
  titre: string;
  slug: string;
  extrait: string | null;
  image_couverture: string | null;
  created_at: string;
  categorie_id: string | null;
};

type Categorie = {
  id: string;
  nom: string;
  slug: string;
};

export default function Blog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieActive, setCategorieActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Blog - BAC Master Elite";
  }, []);

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

      if (categorieActive) {
        query = query.eq("categorie_id", categorieActive);
      }

      const { data: arts } = await query;
      setArticles(arts || []);
      setLoading(false);
    }
    fetchData();
  }, [categorieActive]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight">
              BAC <span className="text-hero-gradient">MASTER ELITE</span>
            </span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Le <span className="text-hero-gradient">Blog</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Conseils, méthodologie et actualités pour réussir ton BAC.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCategorieActive(null)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              !categorieActive
                ? "bg-hero-gradient text-white border-transparent"
                : "border-border text-muted-foreground hover-elevate"
            }`}
            data-testid="filter-all"
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategorieActive(cat.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                categorieActive === cat.id
                  ? "bg-hero-gradient text-white border-transparent"
                  : "border-border text-muted-foreground hover-elevate"
              }`}
              data-testid={`filter-${cat.slug}`}
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
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.id} href={`/blog/${article.slug}`}>
                <article className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card hover-elevate">
                  {article.image_couverture && (
                    <img
                      src={article.image_couverture}
                      alt={article.titre}
                      loading="lazy"
                      decoding="async"
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(article.created_at).toLocaleDateString("fr-FR")}
                    </div>
                    <h2 className="mt-2 text-lg font-bold leading-snug">{article.titre}</h2>
                    {article.extrait && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.extrait}</p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Lire la suite <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

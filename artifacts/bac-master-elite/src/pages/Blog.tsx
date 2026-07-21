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
  langue: string;
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
  // FR/EN switcher temporarily disabled — no English articles in DB yet (all 57 articles are French).
  // Re-enable by uncommenting below and restoring the switcher UI + .eq("langue", langue) in the query.
  // const [langue, setLangue] = useState<"fr" | "en">("fr");
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
        .eq("langue", "fr") // hardcoded until EN articles are added to Supabase
        .order("published_at", { ascending: false });

      if (categorieActive) {
        query = query.eq("categorie_id", categorieActive);
      }

      const { data: arts } = await query;
      setArticles(arts || []);
      setLoading(false);
    }
    fetchData();
  }, [categorieActive]); // removed: langue (switcher disabled)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight">
              BAC <span className="text-hero-gradient">MASTER ELITE</span>
            </span>
          </Link>
          {/*
            TEMPORARILY HIDDEN — FR/EN language switcher.
            Re-enable once English articles (langue='en') exist in Supabase.
            Also restore: useState for langue, .eq("langue", langue), langue dependency, and all ternaries below.

            <div className="flex items-center gap-1 rounded-full border border-border p-0.5 text-sm">
              <button onClick={() => setLangue("fr")} data-testid="lang-fr"
                className={`rounded-full px-3 py-1 font-medium transition ${langue === "fr" ? "bg-hero-gradient text-white" : "text-muted-foreground"}`}>FR</button>
              <button onClick={() => setLangue("en")} data-testid="lang-en"
                className={`rounded-full px-3 py-1 font-medium transition ${langue === "en" ? "bg-hero-gradient text-white" : "text-muted-foreground"}`}>EN</button>
            </div>
          */}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Le <span className="text-hero-gradient">Blog</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Conseils, méthodologie et actualités pour réussir ton BAC.
        </p>

        {/* Scrollable filter bar — no wrap, avoids 5+ lines stacking on 375px mobile */}
        <div className="mt-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <button
              onClick={() => setCategorieActive(null)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
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
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
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

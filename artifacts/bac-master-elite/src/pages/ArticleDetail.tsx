import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowLeft } from "lucide-react";

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
  created_at: string;
};

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [similaires, setSimilaires] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("statut", "publie")
        .single();

      if (data) {
        setArticle(data);
        await supabase
          .from("articles")
          .update({ vues: (data as any).vues ? (data as any).vues + 1 : 1 })
          .eq("id", data.id);

        if (data.categorie_id) {
          const { data: sim } = await supabase
            .from("articles")
            .select("*")
            .eq("categorie_id", data.categorie_id)
            .eq("statut", "publie")
            .neq("id", data.id)
            .limit(3);
          setSimilaires(sim || []);
        }

        document.title = data.meta_titre || `${data.titre} - BAC Master Elite`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.meta_description) {
          metaDesc.setAttribute("content", data.meta_description);
        }
      }
      setLoading(false);
    }
    if (slug) fetchArticle();
  }, [slug]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Article introuvable.</p>
        <Link href="/blog" className="text-primary underline">Retour au blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight">
              BAC <span className="text-hero-gradient">MASTER ELITE</span>
            </span>
          </Link>
          <Link href="/blog" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover-elevate rounded-md px-3 py-1.5">
            <ArrowLeft className="h-4 w-4" /> Blog
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(article.created_at).toLocaleDateString("fr-FR")}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{article.titre}</h1>

        {article.image_couverture && (
          <img
            src={article.image_couverture}
            alt={article.titre}
            fetchPriority="high"
            decoding="async"
            className="mt-6 w-full rounded-xl object-cover"
          />
        )}

        <div
          className="prose prose-neutral dark:prose-invert mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />
      </article>

      {similaires.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold">Articles similaires</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {similaires.map((sim) => (
              <Link key={sim.id} href={`/blog/${sim.slug}`}>
                <div className="cursor-pointer rounded-lg border border-border p-4 hover-elevate">
                  <h3 className="text-sm font-semibold leading-snug">{sim.titre}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
EOFcat > src/pages/ArticleDetail.tsx << 'EOF'
import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowLeft } from "lucide-react";

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
  created_at: string;
};

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [similaires, setSimilaires] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("statut", "publie")
        .single();

      if (data) {
        setArticle(data);
        await supabase
          .from("articles")
          .update({ vues: (data as any).vues ? (data as any).vues + 1 : 1 })
          .eq("id", data.id);

        if (data.categorie_id) {
          const { data: sim } = await supabase
            .from("articles")
            .select("*")
            .eq("categorie_id", data.categorie_id)
            .eq("statut", "publie")
            .neq("id", data.id)
            .limit(3);
          setSimilaires(sim || []);
        }

        document.title = data.meta_titre || `${data.titre} - BAC Master Elite`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.meta_description) {
          metaDesc.setAttribute("content", data.meta_description);
        }
      }
      setLoading(false);
    }
    if (slug) fetchArticle();
  }, [slug]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Article introuvable.</p>
        <Link href="/blog" className="text-primary underline">Retour au blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight">
              BAC <span className="text-hero-gradient">MASTER ELITE</span>
            </span>
          </Link>
          <Link href="/blog" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover-elevate rounded-md px-3 py-1.5">
            <ArrowLeft className="h-4 w-4" /> Blog
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(article.created_at).toLocaleDateString("fr-FR")}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{article.titre}</h1>

        {article.image_couverture && (
          <img
            src={article.image_couverture}
            alt={article.titre}
            fetchPriority="high"
            decoding="async"
            className="mt-6 w-full rounded-xl object-cover"
          />
        )}

        <div
          className="prose prose-neutral dark:prose-invert mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />
      </article>

      {similaires.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold">Articles similaires</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {similaires.map((sim) => (
              <Link key={sim.id} href={`/blog/${sim.slug}`}>
                <div className="cursor-pointer rounded-lg border border-border p-4 hover-elevate">
                  <h3 className="text-sm font-semibold leading-snug">{sim.titre}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

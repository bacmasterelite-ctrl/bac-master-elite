import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowLeft, Languages } from "lucide-react";

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
  langue: string;
  article_lie_id: string | null;
};

type ArticleLie = {
  slug: string;
  titre: string;
  langue: string;
};

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [similaires, setSimilaires] = useState<Article[]>([]);
  const [articleLie, setArticleLie] = useState<ArticleLie | null>(null);
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
            .eq("langue", data.langue)
            .neq("id", data.id)
            .limit(3);
          setSimilaires(sim || []);
        }

        if (data.article_lie_id) {
          const { data: lie } = await supabase
            .from("articles")
            .select("slug, titre, langue")
            .eq("id", data.article_lie_id)
            .eq("statut", "publie")
            .single();
          setArticleLie(lie || null);
        } else {
          setArticleLie(null);
        }

        document.title = data.meta_titre || `${data.titre} - BAC Master Elite`;
        document.documentElement.lang = data.langue || "fr";

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.meta_description) {
          metaDesc.setAttribute("content", data.meta_description);
        }

        // hreflang: remove stale alternate links first, then inject fresh ones
        document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());

        // Self-referencing hreflang for the current article
        const selfHreflang = document.createElement("link");
        selfHreflang.rel = "alternate";
        selfHreflang.hreflang = data.langue || "fr";
        selfHreflang.href = `https://bac-master-elite.com/blog/${data.slug}`;
        document.head.appendChild(selfHreflang);
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

  // JSON-LD Article structured data for Google quality signals
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.titre,
    "description": article.extrait ?? article.meta_description ?? "",
    "image": article.image_couverture ? [article.image_couverture] : ["https://bac-master-elite.com/og-image.png"],
    "datePublished": article.created_at,
    "dateModified": article.created_at,
    "author": {
      "@type": "Organization",
      "name": "BAC Master Elite",
      "url": "https://bac-master-elite.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "BAC Master Elite",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bac-master-elite.com/logo-512.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://bac-master-elite.com/blog/${article.slug}`
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* JSON-LD structured data injected into head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(article.created_at).toLocaleDateString(article.langue === "fr" ? "fr-FR" : "en-US")}
          </div>
          {articleLie && (
            <Link
              href={`/blog/${articleLie.slug}`}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover-elevate"
              data-testid="link-translation"
            >
              <Languages className="h-3.5 w-3.5" />
              {articleLie.langue === "en" ? "Read in English" : "Lire en français"}
            </Link>
          )}
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

        {/*
          [&_img]:max-w-full [&_img]:h-auto — prevent wide images overflowing on mobile
          [&_table]:block [&_table]:overflow-x-auto — tables scroll horizontally instead of forcing page width
          [&_pre]:overflow-x-auto — code blocks scroll instead of stretching page
          [&_iframe]:max-w-full — embedded iframes stay within container
        */}
        <div
          className="prose prose-neutral dark:prose-invert mt-8 max-w-none [&_img]:max-w-full [&_img]:h-auto [&_table]:block [&_table]:overflow-x-auto [&_pre]:overflow-x-auto [&_iframe]:max-w-full"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />
      </article>

      {similaires.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold">
            {article.langue === "fr" ? "Articles similaires" : "Related articles"}
          </h2>
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

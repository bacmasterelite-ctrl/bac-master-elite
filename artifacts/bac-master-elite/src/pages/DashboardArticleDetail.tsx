import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Calendar, ChevronLeft } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

type Article = {
  id: string;
  titre: string;
  slug: string;
  contenu: string;
  image_couverture: string | null;
  categorie_id: string | null;
  created_at: string;
};

export default function DashboardArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [similaires, setSimilaires] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      const { data } = await supabase.from("articles").select("*").eq("slug", slug).eq("statut", "publie").single();

      if (data) {
        setArticle(data);
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
      }
      setLoading(false);
    }
    if (slug) fetchArticle();
  }, [slug]);

  if (loading) {
    return <DashboardLayout><p className="text-center text-muted-foreground py-16">Chargement...</p></DashboardLayout>;
  }

  if (!article) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Article introuvable.</p>
          <Link href="/dashboard/blog" className="text-primary underline">Retour au blog</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Link href="/dashboard/blog" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Blog
      </Link>

      <article className="mx-auto mt-4 max-w-3xl">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(article.created_at).toLocaleDateString("fr-FR")}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{article.titre}</h1>

        {article.image_couverture && (
          <img src={article.image_couverture} alt={article.titre} fetchPriority="high" decoding="async" className="mt-6 w-full rounded-xl object-cover" />
        )}

        <div className="prose prose-neutral dark:prose-invert mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: article.contenu }} />
      </article>

      {similaires.length > 0 && (
        <div className="mx-auto mt-10 max-w-3xl">
          <h2 className="text-lg font-bold">Articles similaires</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {similaires.map((sim) => (
              <Link key={sim.id} href={`/dashboard/blog/${sim.slug}`}>
                <div className="cursor-pointer rounded-lg border border-border p-3 hover-elevate">
                  <h3 className="text-sm font-semibold leading-snug">{sim.titre}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

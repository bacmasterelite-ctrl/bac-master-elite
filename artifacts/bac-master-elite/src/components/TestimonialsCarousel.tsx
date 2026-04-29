import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { useReviews, useAddReview, type Review } from "@/lib/extensions";
import { cn } from "@/lib/utils";

const FAKE_TESTIMONIALS: Review[] = [
  {
    name: "Aïcha Koné",
    rating: 5,
    comment:
      "BAC MASTER ELITE m'a aidée à décrocher ma mention TB en série D. Le Tuteur IA répond à 2h du matin quand je révise !",
    serie: "D",
  },
  {
    name: "Mamadou Diop",
    rating: 5,
    comment:
      "Les annales corrigées sont parfaites pour s'entraîner. J'ai progressé de 7 points en maths en 2 mois.",
    serie: "C",
  },
  {
    name: "Fatou Touré",
    rating: 5,
    comment:
      "Une plateforme conçue pour nous, élèves ivoiriens. Les exercices collent vraiment au programme du BAC.",
    serie: "A",
  },
  {
    name: "Ibrahim Sy",
    rating: 4,
    comment:
      "Très complet. La méthodologie m'a sauvé en philo, je sais enfin construire une dissertation.",
    serie: "D",
  },
  {
    name: "Kadidia Bah",
    rating: 5,
    comment:
      "Le classement entre élèves m'a motivée à travailler tous les jours. C'est devenu un jeu !",
    serie: "C",
  },
  {
    name: "Yao Konan",
    rating: 5,
    comment:
      "L'abonnement Premium en vaut largement la peine. Cours illimités, IA illimitée — un vrai accélérateur.",
    serie: "D",
  },
];

const Stars = ({ value }: { value: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3.5 w-3.5",
          i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
        )}
      />
    ))}
  </div>
);

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

type Props = {
  variant?: "landing" | "dashboard";
  showForm?: boolean;
};

export default function TestimonialsCarousel({
  variant = "landing",
  showForm = true,
}: Props) {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: realReviews = [] } = useReviews();
  const addReview = useAddReview();
  const { toast } = useToast();

  const all = useMemo<Review[]>(
    () => [...realReviews, ...FAKE_TESTIMONIALS],
    [realReviews],
  );

  const [page, setPage] = useState(0);
  const perPage = variant === "landing" ? 3 : 2;
  const totalPages = Math.max(1, Math.ceil(all.length / perPage));

  useEffect(() => {
    if (totalPages <= 1) return;
    const id = window.setInterval(() => {
      setPage((p) => (p + 1) % totalPages);
    }, 6000);
    return () => window.clearInterval(id);
  }, [totalPages]);

  const visible = all.slice(page * perPage, page * perPage + perPage);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!name && profile?.full_name) setName(profile.full_name);
  }, [profile?.full_name, name]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanComment = comment.trim();
    const cleanName = (name.trim() || profile?.full_name || "Élève anonyme").slice(0, 60);
    if (cleanComment.length < 10) {
      toast({
        title: "Avis trop court",
        description: "Écrivez au moins 10 caractères pour partager votre expérience.",
        variant: "destructive",
      });
      return;
    }
    try {
      await addReview.mutateAsync({
        user_id: user?.id ?? null,
        name: cleanName,
        rating,
        comment: cleanComment,
        serie: profile?.serie ?? null,
      });
      toast({ title: "Merci !", description: "Votre avis a bien été publié." });
      setComment("");
      setRating(5);
    } catch (err) {
      toast({
        title: "Impossible de publier",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const headerLabel = variant === "landing" ? "Ils témoignent" : "Voix de la communauté";

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          {headerLabel}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Ce que disent les élèves
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vraies réussites, vraies progressions.
        </p>
      </div>

      <div className="relative min-h-[220px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "grid gap-4",
              variant === "landing"
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2",
            )}
          >
            {visible.map((t, i) => (
              <div
                key={`${page}-${i}`}
                className="relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <Quote className="absolute right-4 top-4 h-6 w-6 text-blue-500/15" />
                <Stars value={t.rating} />
                <p className="text-sm text-foreground/90">"{t.comment}"</p>
                <div className="mt-auto flex items-center gap-3 pt-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hero-gradient text-xs font-bold text-white">
                    {initials(t.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    {t.serie && (
                      <p className="text-xs text-muted-foreground">Série {t.serie}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                aria-label={`Page ${i + 1}`}
                onClick={() => setPage(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === page ? "w-6 bg-blue-600" : "w-2 bg-muted-foreground/30",
                )}
                data-testid={`testimonial-dot-${i}`}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <p className="text-sm font-semibold">Partagez votre avis</p>
          <p className="text-xs text-muted-foreground">
            Aidez d'autres élèves en racontant votre expérience.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              data-testid="input-review-name"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Note :</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`Note ${n}`}
                  data-testid={`star-${n}`}
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      n <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40 hover:text-amber-400",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            className="mt-3"
            placeholder="Votre expérience avec BAC MASTER ELITE..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            data-testid="textarea-review"
          />
          <div className="mt-3 flex justify-end">
            <Button
              type="submit"
              disabled={addReview.isPending}
              className="rounded-full bg-hero-gradient text-white hover:opacity-90"
              data-testid="button-submit-review"
            >
              {addReview.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publier mon avis
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

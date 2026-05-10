import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Brain,
  Send,
  Sparkles,
  BookOpen,
  Calculator,
  Beaker,
  Globe2,
  AlertCircle,
  Loader2,
  Paperclip,
  X,
  ImageIcon,
  Crown,
  Lock,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PremiumLimitModal from "@/components/PremiumLimitModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAIResponse, isGeminiConfigured, fileToBase64, type ImageInput } from "@/lib/gemini";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile, usePremiumStatus, useIncrementAIQuestion } from "@/lib/queries";
import { useDailyAILimit, FREE_AI_DAILY_LIMIT } from "@/lib/premium";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "ai";
  content: string;
  imageUrl?: string;
  error?: boolean;
  id: string;
};

const SUGGESTIONS = [
  { icon: Calculator, text: "Explique le théorème de Pythagore avec un exemple." },
  { icon: Beaker, text: "Comment équilibrer une équation chimique ?" },
  { icon: BookOpen, text: "Qu'est-ce que la conscience selon Descartes ?" },
  { icon: Globe2, text: "Résume la décolonisation de l'Afrique." },
];

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_MIMES = ["image/png", "image/jpeg", "image/webp"];

const uid = () => Math.random().toString(36).slice(2, 10);

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:text-foreground
        prose-h1:text-base prose-h2:text-base prose-h3:text-sm
        prose-h2:mt-3 prose-h2:mb-1.5 prose-h3:mt-2 prose-h3:mb-1
        prose-p:my-1.5 prose-p:leading-relaxed
        prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
        prose-strong:text-foreground prose-strong:font-semibold
        prose-code:rounded prose-code:bg-blue-500/10 prose-code:px-1
        prose-code:py-0.5 prose-code:text-blue-700 prose-code:font-mono
        prose-code:text-[0.85em] prose-code:before:content-none
        prose-code:after:content-none
        prose-pre:my-2 prose-pre:rounded-xl prose-pre:bg-slate-900
        prose-pre:p-3 prose-pre:text-xs
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-blue-500 prose-blockquote:text-muted-foreground
        prose-hr:my-3"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export default function TuteurIA() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isPremium } = usePremiumStatus(user?.id);
  const serie = profile?.serie ?? "D";
  const limit = useDailyAILimit(user?.id);
  const { mutateAsync: incrementAI } = useIncrementAIQuestion();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    file: File;
    dataUrl: string;
    image: ImageInput;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const configured = isGeminiConfigured();

  // Build the welcome message reactively (depends on premium status + serie)
  useEffect(() => {
    setMessages([
      {
        id: uid(),
        role: "ai",
        content: isPremium
          ? `Bonjour ! Je suis votre **professeur ivoirien IA** pour la **Série ${serie}**.\n\nVous êtes membre **Premium** : posez autant de questions que vous voulez et envoyez-moi des **photos d'exercices** à analyser. ✨`
          : `Bonjour ! Je suis votre **professeur ivoirien IA** pour la **Série ${serie}**.\n\nEn formule **gratuite**, vous avez ${FREE_AI_DAILY_LIMIT} questions par jour. Pour des questions illimitées et l'analyse de photos d'exercices, passez **Premium** 👑.`,
      },
    ]);
    // We intentionally re-init when premium status flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, serie]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const blockedByQuota = !isPremium && limit.reached;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isPremium) {
      setImageError("L'analyse de photos est réservée aux membres Premium.");
      return;
    }
    if (!ACCEPTED_MIMES.includes(file.type)) {
      setImageError("Format non supporté. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image trop lourde (max 4 Mo).");
      return;
    }

    try {
      const { base64, dataUrl } = await fileToBase64(file);
      setAttachedImage({
        file,
        dataUrl,
        image: { base64, mimeType: file.type },
      });
    } catch {
      setImageError("Impossible de lire l'image.");
    }
  };

  const send = async (text: string) => {
    const image = attachedImage?.image;
    const dataUrl = attachedImage?.dataUrl;
    const trimmed = text.trim();

    if (!trimmed && !image) return;
    if (isLoading) return;
    if (blockedByQuota) {
      setLimitModalOpen(true);
      return;
    }
    if (image && !isPremium) return;

    if (!isPremium && user?.id) {
      try {
        const res = await incrementAI(user.id);
        if (!res.allowed) {
          setLimitModalOpen(true);
          return;
        }
      } catch (err) {
        console.warn("[ai quota]", err);
      }
    }

    const promptForUser = trimmed || (image ? "Aide-moi avec cet exercice." : "");
    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: promptForUser,
      imageUrl: dataUrl,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setAttachedImage(null);
    setImageError(null);
    setIsLoading(true);

    try {
      const contextual = `Élève en Série ${serie}. ${
        image ? "Voici une photo qu'il/elle envoie. " : ""
      }Question : ${promptForUser}`;
      const reply = await getAIResponse(contextual, image);
      setMessages((m) => [...m, { id: uid(), role: "ai", content: reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      setMessages((m) => [...m, { id: uid(), role: "ai", content: message, error: true }]);
      toast({
        title: "Tuteur IA indisponible",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <DashboardLayout>
      <PremiumLimitModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        type="chatbot"
      />
      <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-4xl flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">IA</p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
              Tuteur IA
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Propulsé par Google Gemini · Série {serie}
              {isPremium ? " · Photos activées" : ` · ${limit.remaining}/${FREE_AI_DAILY_LIMIT} questions restantes aujourd'hui`}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                configured
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-rose-500/15 text-rose-700"
              }`}
              data-testid="ai-status"
            >
              <span
                className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                  configured ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {configured ? "En ligne" : "Hors ligne"}
            </span>
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-400/20 to-orange-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <Crown className="h-3 w-3" />
                Premium
              </span>
            )}
          </div>
        </div>

        {!configured && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Clé API Gemini manquante. Ajoutez la variable <code className="rounded bg-rose-100 px-1 dark:bg-rose-900/40">VITE_GEMINI_API_KEY</code> dans les secrets.
            </p>
          </div>
        )}

        {!isPremium && configured && (
          <FreeTierBanner remaining={limit.remaining} reached={limit.reached} />
        )}

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-sm"
          data-testid="chat-window"
        >
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "ai" && (
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                      m.error ? "bg-rose-500" : "bg-hero-gradient"
                    }`}
                  >
                    {m.error ? <AlertCircle className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                  </div>
                )}
                <div
                  className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : m.error
                        ? "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                        : "bg-muted text-foreground"
                  }`}
                  data-testid={`message-${m.role}`}
                >
                  {m.imageUrl && (
                    <a
                      href={m.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border border-white/30"
                    >
                      <img
                        src={m.imageUrl}
                        alt="Pièce jointe"
                        className="max-h-56 w-auto object-cover"
                      />
                    </a>
                  )}
                  {m.role === "ai" && !m.error ? (
                    <MarkdownMessage content={m.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hero-gradient text-white">
                <Brain className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Le tuteur réfléchit...
              </div>
            </motion.div>
          )}
        </div>

        {messages.length <= 1 && !blockedByQuota && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              Suggestions
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  disabled={isLoading || !configured || blockedByQuota}
                  className="flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left text-sm hover-elevate disabled:opacity-50"
                  data-testid={`suggestion-${s.text.slice(0, 10)}`}
                >
                  <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(attachedImage || imageError) && (
          <div className="mt-3">
            {attachedImage && (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-3 shadow-sm">
                <img
                  src={attachedImage.dataUrl}
                  alt="Aperçu"
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="flex-1 text-xs">
                  <p className="font-semibold">{attachedImage.file.name}</p>
                  <p className="text-muted-foreground">
                    {(attachedImage.file.size / 1024).toFixed(0)} Ko · prêt à analyser
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="rounded-full p-1.5 hover:bg-muted"
                  aria-label="Retirer l'image"
                  data-testid="button-remove-image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {imageError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {imageError}
              </p>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIMES.join(",")}
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-file"
          />
          {isPremium ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !configured}
              className="rounded-full"
              aria-label="Joindre une image"
              data-testid="button-attach"
              title="Joindre une photo d'exercice"
            >
              {attachedImage ? (
                <ImageIcon className="h-4 w-4 text-violet-600" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Link href="/dashboard/upgrade">
              <Button
                type="button"
                variant="outline"
                className="rounded-full text-amber-700"
                aria-label="Photos réservées au Premium"
                data-testid="button-attach-locked"
                title="L'analyse de photos est réservée aux membres Premium"
              >
                <Lock className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              !configured
                ? "IA indisponible"
                : blockedByQuota
                  ? "Limite quotidienne atteinte — passez Premium"
                  : attachedImage
                    ? "Décrivez ce que vous voulez (optionnel)..."
                    : isPremium
                      ? "Posez votre question ou joignez une photo..."
                      : "Posez votre question..."
            }
            disabled={isLoading || !configured || blockedByQuota}
            className="rounded-full"
            data-testid="input-question"
          />
          <Button
            type="submit"
            disabled={
              isLoading ||
              !configured ||
              blockedByQuota ||
              (!input.trim() && !attachedImage)
            }
            className="rounded-full bg-hero-gradient text-white hover:opacity-90"
            data-testid="button-send"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}

function FreeTierBanner({ remaining, reached }: { remaining: number; reached: boolean }) {
  return (
    <div
      className={`mb-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        reached
          ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20"
          : "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/20"
      }`}
      data-testid="banner-free-tier"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
            reached
              ? "bg-rose-500"
              : "bg-gradient-to-br from-amber-400 to-orange-500"
          }`}
        >
          {reached ? <Lock className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-bold">
            {reached
              ? "Limite quotidienne atteinte"
              : `Formule gratuite — ${remaining} ${remaining > 1 ? "questions restantes" : "question restante"} aujourd'hui`}
          </p>
          <p className="text-xs text-muted-foreground">
            Avec Premium : questions illimitées + analyse de photos d'exercices.
          </p>
        </div>
      </div>
      <Link href="/dashboard/upgrade">
        <Button
          className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
          data-testid="button-upgrade-from-tutor"
        >
          <Crown className="mr-1.5 h-4 w-4" />
          {reached
            ? "Passer Premium pour continuer à discuter"
            : "Devenir Premium"}
        </Button>
      </Link>
    </div>
  );
}

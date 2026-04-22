import { useState, useRef, useEffect } from "react";
import { useGetMe, useAiChat, useRequestUploadUrl } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Bot, Send, ImagePlus, Crown, Loader2, X, Lock } from "lucide-react";
import { Link } from "wouter";

interface Msg { role: "user" | "assistant"; content: string; image?: string }

const FREE_MESSAGE_LIMIT = 3;

const PLAIN_INSTRUCTION =
  "IMPORTANT: Réponds en texte brut uniquement. N'utilise PAS de Markdown (pas de **gras**, pas de *italique*, pas de #titres, pas de listes avec - ou *, pas de tableaux, pas de blocs de code). Écris uniquement des paragraphes simples séparés par des sauts de ligne.";

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?|```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, (m) => m)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function AITutorPage() {
  const { data: profile } = useGetMe();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const chat = useAiChat();
  const requestUpload = useRequestUploadUrl();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chat.isPending]);

  const isPremium = !!profile?.isPremium;
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const limitReached = !isPremium && userMessageCount >= FREE_MESSAGE_LIMIT;
  const remaining = Math.max(0, FREE_MESSAGE_LIMIT - userMessageCount);

  const handleFile = async (file: File) => {
    if (!isPremium) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);

      const res = await requestUpload.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type },
      });
      await fetch(res.uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      setImageUrl(res.uploadURL.split("?")[0] ?? null);
    } catch (e) {
      console.log("ERREUR_APP:", e);
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    if (limitReached) return;
    if (!input.trim() && !imageUrl) return;
    const userMsg: Msg = { role: "user", content: input || "(image)", image: imageBase64 ?? undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    const sentImage = imageUrl;
    setImageUrl(null);
    setImageBase64(null);

    const apiMessages = newMessages.map((m, idx) =>
      idx === 0 && m.role === "user"
        ? { role: m.role, content: `${PLAIN_INSTRUCTION}\n\n${m.content}` }
        : { role: m.role, content: m.content },
    );

    try {
      const res = await chat.mutateAsync({
        data: { messages: apiMessages, imageUrl: sentImage },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: stripMarkdown(res.reply) }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessaye." }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl">
      <PageHeader
        title="Tuteur IA"
        subtitle="Pose tes questions, demande des explications, vérifie tes réponses."
      />

      {!isPremium && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-900">
          <span className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            {limitReached
              ? "Limite gratuite atteinte (3 messages)."
              : `Mode gratuit — ${remaining} message${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}.`}
          </span>
          <Link href="/premium">
            <Button size="sm" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white" data-testid="button-go-premium-banner">
              Passer au Premium
            </Button>
          </Link>
        </div>
      )}

      <Card className="flex-1 rounded-2xl border-0 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-4">
                <Bot className="w-8 h-8" />
              </div>
              <div className="font-semibold text-gray-700">Bonjour ! Je suis BAC TUTOR.</div>
              <div className="text-sm mt-1 max-w-sm">Demande-moi d'expliquer un cours, corriger un exercice, ou résumer un chapitre.</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                {m.image && <img src={m.image} alt="" className="rounded-lg mb-2 max-h-60" />}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            </div>
          ))}
          {chat.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> BAC TUTOR réfléchit...
              </div>
            </div>
          )}
          {limitReached && (
            <div className="flex flex-col items-center justify-center text-center py-6 px-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <div className="font-semibold text-gray-900">Tu as utilisé tes 3 messages gratuits</div>
              <div className="text-sm text-gray-600 mt-1 max-w-sm">
                Passe au Premium pour continuer à discuter avec BAC TUTOR sans limite et envoyer des images.
              </div>
              <Link href="/premium">
                <Button className="mt-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white" data-testid="button-go-premium-block">
                  <Crown className="w-4 h-4 mr-2" /> Passer au Premium
                </Button>
              </Link>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-gray-100 p-4">
          {imageBase64 && (
            <div className="mb-2 inline-flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-lg">
              <img src={imageBase64} alt="" className="w-10 h-10 object-cover rounded" />
              <span className="text-xs text-blue-900">Image jointe</span>
              <button onClick={() => { setImageUrl(null); setImageBase64(null); }} className="text-blue-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={limitReached ? "Passe au Premium pour continuer..." : "Pose ta question ici..."}
              rows={2}
              disabled={limitReached}
              className="rounded-xl resize-none"
              data-testid="textarea-question"
            />
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              data-testid="input-file"
            />
            {isPremium ? (
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-xl shrink-0 h-12 w-12"
                data-testid="button-attach-image"
                title="Joindre une image"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImagePlus className="w-5 h-5" />}
              </Button>
            ) : (
              <Link href="/premium">
                <Button variant="outline" size="icon" className="rounded-xl shrink-0 h-12 w-12 text-amber-600" title="Premium requis">
                  <Crown className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Button
              onClick={send}
              disabled={chat.isPending || limitReached || (!input.trim() && !imageUrl)}
              className="rounded-xl shrink-0 h-12 w-12"
              size="icon"
              data-testid="button-send"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {!isPremium && !limitReached && (
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              L'analyse d'image est réservée aux membres Premium. <Link href="/premium"><a className="text-blue-600 font-medium hover:underline">Découvrir</a></Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

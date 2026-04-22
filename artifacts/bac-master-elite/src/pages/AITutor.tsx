import { useState, useRef, useEffect } from "react";
import { useGetMe, useAiChat, useRequestUploadUrl } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Bot, Send, ImagePlus, Crown, Loader2, X } from "lucide-react";
import { Link } from "wouter";

interface Msg { role: "user" | "assistant"; content: string; image?: string }

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

  const handleFile = async (file: File) => {
    if (!isPremium) return;
    setUploading(true);
    try {
      // Show preview immediately
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
      // Use the uploadURL stripped of query string for OpenAI image_url
      setImageUrl(res.uploadURL.split("?")[0] ?? null);
    } catch (e) {
      console.log("ERREUR_APP:", e);
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    if (!input.trim() && !imageUrl) return;
    const userMsg: Msg = { role: "user", content: input || "(image)", image: imageBase64 ?? undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    const sentImage = imageUrl;
    setImageUrl(null);
    setImageBase64(null);
    try {
      const res = await chat.mutateAsync({
        data: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          imageUrl: sentImage,
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessaye." }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl">
      <PageHeader
        title="Tuteur IA"
        subtitle="Pose tes questions, demande des explications, vérifie tes réponses."
      />

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
              placeholder="Pose ta question ici..."
              rows={2}
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
              disabled={chat.isPending || (!input.trim() && !imageUrl)}
              className="rounded-xl shrink-0 h-12 w-12"
              size="icon"
              data-testid="button-send"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {!isPremium && (
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

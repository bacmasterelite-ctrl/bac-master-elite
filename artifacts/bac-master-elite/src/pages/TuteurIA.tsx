import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Brain, Send, Sparkles, BookOpen, Calculator, Beaker, Globe2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "user" | "ai"; content: string };

const suggestions = [
  { icon: Calculator, text: "Explique-moi le théorème de Pythagore" },
  { icon: Beaker, text: "Comment équilibrer une équation chimique ?" },
  { icon: BookOpen, text: "Qu'est-ce que la conscience selon Descartes ?" },
  { icon: Globe2, text: "Résume la décolonisation de l'Afrique" },
];

export default function TuteurIA() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Bonjour ! Je suis votre tuteur IA personnel. Posez-moi n'importe quelle question sur vos cours et je vous expliquerai avec des exemples adaptés à votre niveau. ✨",
    },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          content:
            "Excellente question ! Voici une explication claire pour vous aider à comprendre. (Connectez votre clé API pour activer les réponses IA en temps réel.)",
        },
      ]);
    }, 600);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-4xl flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">IA</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Tuteur IA</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            En ligne
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-sm">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "ai" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hero-gradient text-white">
                  <Brain className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}

          {messages.length === 1 && (
            <div className="pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quelques idées pour commencer
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s.text)}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-left text-sm hover-elevate"
                    data-testid={`suggestion-${i}`}
                  >
                    <s.icon className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="pl-9"
              data-testid="input-ai-question"
            />
          </div>
          <Button type="submit" className="bg-hero-gradient text-white hover:opacity-90" data-testid="button-send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}

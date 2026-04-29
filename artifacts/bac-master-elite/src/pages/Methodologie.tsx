import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Target,
  ListChecks,
  Lightbulb,
  Compass,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { methodologyExamples, type MethodologyExample } from "@/lib/methodologyExamples";

const methods: Array<{
  exampleKey: keyof typeof methodologyExamples;
  icon: typeof Target;
  titre: string;
  color: string;
  iconBg: string;
  steps: string[];
}> = [
  {
    exampleKey: "dissertation",
    icon: Target,
    titre: "Méthode de la dissertation",
    color: "border-l-blue-600",
    iconBg: "bg-blue-500/10 text-blue-600",
    steps: [
      "Analyser et reformuler le sujet",
      "Construire une problématique",
      "Bâtir un plan en 2 ou 3 parties",
      "Rédiger introduction et conclusion en dernier",
    ],
  },
  {
    exampleKey: "maths",
    icon: ListChecks,
    titre: "Résolution d'un problème de Maths",
    color: "border-l-violet-600",
    iconBg: "bg-violet-500/10 text-violet-600",
    steps: [
      "Lire l'énoncé deux fois et noter les hypothèses",
      "Identifier le théorème ou la formule clé",
      "Poser le calcul de manière structurée",
      "Vérifier l'unité et la cohérence du résultat",
    ],
  },
  {
    exampleKey: "commentaire",
    icon: Lightbulb,
    titre: "Commentaire de texte",
    color: "border-l-rose-500",
    iconBg: "bg-rose-500/10 text-rose-600",
    steps: [
      "Repérer figures de style et champs lexicaux",
      "Dégager les axes de lecture",
      "Citer le texte avec analyse précise",
      "Conclure sur l'intérêt littéraire",
    ],
  },
  {
    exampleKey: "histoire",
    icon: Compass,
    titre: "Étude de document (Histoire-Géo)",
    color: "border-l-indigo-500",
    iconBg: "bg-indigo-500/10 text-indigo-600",
    steps: [
      "Présenter source, auteur, date et contexte",
      "Dégager l'idée principale du document",
      "Apporter des connaissances extérieures",
      "Critiquer la portée et les limites",
    ],
  },
];

export default function Methodologie() {
  const [activeExample, setActiveExample] = useState<MethodologyExample | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Préparation
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Méthodologie</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les méthodes éprouvées pour structurer vos copies et gagner des points le jour J.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {methods.map((m, i) => (
            <motion.div
              key={m.titre}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border border-border ${m.color} border-l-4 bg-card p-6 shadow-sm hover-elevate`}
              data-testid={`card-method-${i}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${m.iconBg}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold">{m.titre}</h3>
                  <ol className="mt-3 space-y-2">
                    {m.steps.map((s, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          <span className="font-semibold text-foreground">Étape {j + 1}.</span>{" "}
                          <span className="text-muted-foreground">{s}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    onClick={() => setActiveExample(methodologyExamples[m.exampleKey])}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    data-testid={`button-method-example-${m.exampleKey}`}
                  >
                    Voir un exemple
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={!!activeExample} onOpenChange={(open) => !open && setActiveExample(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0">
          {activeExample && (
            <>
              <DialogHeader className="border-b border-border bg-muted/40 px-6 py-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                  <BookOpen className="h-3.5 w-3.5" />
                  Exemple — {activeExample.type}
                </div>
                <DialogTitle className="text-xl">Sujet traité</DialogTitle>
                <DialogDescription className="italic text-foreground/80">
                  {activeExample.sujet}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
                <article className="prose prose-sm max-w-none dark:prose-invert sm:prose-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeExample.exemple}
                  </ReactMarkdown>
                </article>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

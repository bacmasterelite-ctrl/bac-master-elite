import { motion } from "framer-motion";
import {
  Target,
  ListChecks,
  Lightbulb,
  Compass,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const methods = [
  {
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
                  <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                    Voir un exemple
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

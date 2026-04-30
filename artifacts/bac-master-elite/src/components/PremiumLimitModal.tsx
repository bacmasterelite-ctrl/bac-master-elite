import { Crown, Lock, Sparkles, Zap } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  /** "lessons" | "chatbot" */
  type: "lessons" | "chatbot";
};

const CONTENT = {
  lessons: {
    icon: Lock,
    accent: "bg-blue-600",
    title: "Limite de leçons atteinte",
    description:
      "Vous avez consulté 3 leçons aujourd'hui. La limite quotidienne des comptes gratuits est de 3 leçons.",
    perks: [
      "Leçons illimitées chaque jour",
      "Accès PDF aux cours (imprimables)",
      "Tuteur IA illimité",
      "Annales + exercices premium",
    ],
  },
  chatbot: {
    icon: Sparkles,
    accent: "bg-violet-600",
    title: "Limite de questions atteinte",
    description:
      "Vous avez posé 3 questions aujourd'hui. La limite quotidienne des comptes gratuits est de 3 questions.",
    perks: [
      "Questions IA illimitées par jour",
      "Analyse de photos / documents",
      "Réponses plus détaillées",
      "Accès à toutes les leçons",
    ],
  },
};

export default function PremiumLimitModal({ open, onClose, type }: Props) {
  const c = CONTENT[type];
  const Icon = c.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${c.accent} text-white shadow-lg`}
          >
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-xl">
            {c.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {c.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800/40 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Avec BAC MASTER ELITE Premium
            </span>
          </div>
          <ul className="space-y-1.5">
            {c.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/dashboard/upgrade">
            <Button
              className="w-full bg-hero-gradient text-white hover:opacity-90"
              data-testid="button-upgrade-from-modal"
            >
              <Crown className="mr-2 h-4 w-4" />
              Passer Premium
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
            data-testid="button-close-limit-modal"
          >
            Continuer demain
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

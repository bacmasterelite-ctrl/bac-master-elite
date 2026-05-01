// Color & icon mapping per subject (matière)
import {
  Calculator,
  Atom,
  FlaskConical,
  Leaf,
  BookOpen,
  Brain,
  Globe2,
  Languages,
  Music,
  type LucideIcon,
} from "lucide-react";

export type SubjectStyle = {
  label: string;
  icon: LucideIcon;
  border: string;
  bg: string;
  text: string;
  dot: string;
};

const STYLES: Record<string, SubjectStyle> = {
  math: {
    label: "Mathématiques",
    icon: Calculator,
    border: "border-l-blue-600",
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    dot: "#1e40af",
  },
  physique: {
    label: "Physique",
    icon: Atom,
    border: "border-l-violet-600",
    bg: "bg-violet-500/10",
    text: "text-violet-600",
    dot: "#7c3aed",
  },
  chimie: {
    label: "Chimie",
    icon: FlaskConical,
    border: "border-l-pink-500",
    bg: "bg-pink-500/10",
    text: "text-pink-600",
    dot: "#ec4899",
  },
  svt: {
    label: "SVT",
    icon: Leaf,
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    dot: "#10b981",
  },
  francais: {
    label: "Français",
    icon: BookOpen,
    border: "border-l-rose-500",
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    dot: "#f43f5e",
  },
  philo: {
    label: "Philosophie",
    icon: Brain,
    border: "border-l-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    dot: "#f59e0b",
  },
  histoire: {
    label: "Histoire-Géo",
    icon: Globe2,
    border: "border-l-indigo-500",
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
    dot: "#6366f1",
  },
  anglais: {
    label: "Anglais",
    icon: Languages,
    border: "border-l-cyan-500",
    bg: "bg-cyan-500/10",
    text: "text-cyan-600",
    dot: "#06b6d4",
  },
  litterature: {
    label: "Littérature",
    icon: Music,
    border: "border-l-fuchsia-500",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600",
    dot: "#d946ef",
  },
};

const ALIASES: Record<string, keyof typeof STYLES> = {
  maths: "math",
  mathematiques: "math",
  mathématiques: "math",
  physics: "physique",
  chemistry: "chimie",
  bio: "svt",
  biology: "svt",
  french: "francais",
  français: "francais",
  philosophy: "philo",
  philosophie: "philo",
  "philosophie-": "philo",
  history: "histoire",
  geography: "histoire",
  "histoire-géo": "histoire",
  english: "anglais",
};

export function styleForSubject(name?: string | null): SubjectStyle {
  if (!name) return STYLES.math;
  const key = name
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (STYLES[key as keyof typeof STYLES]) return STYLES[key as keyof typeof STYLES];
  if (ALIASES[key]) return STYLES[ALIASES[key]];
  for (const [k, v] of Object.entries(STYLES)) {
    if (key.includes(k)) return v;
  }
  return STYLES.math;
}

// Subjects available per série
export const SUBJECTS_BY_SERIE: Record<string, string[]> = {
  A: ["Philosophie", "Français", "Histoire-Géo", "Anglais", "Littérature"],
  C: ["Mathématiques", "Physique", "Chimie", "Physique-Chimie", "SVT", "Philosophie", "Anglais"],
  D: ["SVT", "Physique", "Chimie", "Physique-Chimie", "Mathématiques", "Philosophie", "Anglais"],
};

export function subjectsForSerie(serie?: string | null): string[] {
  return SUBJECTS_BY_SERIE[serie?.toUpperCase() ?? "D"] ?? SUBJECTS_BY_SERIE.D;
}

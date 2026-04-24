import { motion } from "framer-motion";
import { ScrollText, Download, ArrowRight, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAnnals } from "@/lib/queries";

const fallback = [
  { matiere: "Mathématiques", serie: "D", annee: 2024, duree: "4h", session: "Juin" },
  { matiere: "Philosophie", serie: "A", annee: 2024, duree: "4h", session: "Juin" },
  { matiere: "Sciences Physiques", serie: "C", annee: 2024, duree: "3h", session: "Juin" },
  { matiere: "Français", serie: "A/C/D", annee: 2023, duree: "3h", session: "Juin" },
  { matiere: "SVT", serie: "D", annee: 2023, duree: "3h", session: "Septembre" },
  { matiere: "Histoire-Géo", serie: "A", annee: 2023, duree: "3h", session: "Juin" },
  { matiere: "Anglais", serie: "A/C/D", annee: 2022, duree: "3h", session: "Juin" },
  { matiere: "Mathématiques", serie: "C", annee: 2022, duree: "4h", session: "Juin" },
];

export default function Annales() {
  const { data: annals = [], isLoading } = useAnnals();
  const items =
    annals.length > 0
      ? annals.map((a) => {
          const r = a as Record<string, unknown>;
          return {
            matiere: (r.subject as string) ?? (r.matiere as string) ?? "Matière",
            serie: (r.serie as string) ?? "A/C/D",
            annee: (r.year as number) ?? (r.annee as number) ?? 2024,
            duree: (r.duration as string) ?? "3h",
            session: (r.session as string) ?? "Juin",
          };
        })
      : fallback;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">Examens officiels</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Annales du BAC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tous les sujets officiels avec corrections détaillées rédigées par des professeurs.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a, i) => (
              <motion.div
                key={a.matiere + a.annee + i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm hover-elevate"
                data-testid={`card-annal-${i}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                    <ScrollText className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Série {a.serie}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold leading-tight">{a.matiere}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Session {a.session} {a.annee} • {a.duree}
                </p>
                <div className="mt-5 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Sujet
                  </Button>
                  <Button size="sm" className="flex-1 bg-hero-gradient text-white hover:opacity-90">
                    Corrigé
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

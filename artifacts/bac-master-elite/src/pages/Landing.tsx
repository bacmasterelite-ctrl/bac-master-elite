import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  GraduationCap,
  Sparkles,
  BookOpen,
  Target,
  Trophy,
  Users,
  Brain,
  CheckCircle2,
  Layers,
  PenLine,
  Beaker,
  Calculator,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import TeachersSection from "@/components/TeachersSection";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const stats = [
  { icon: Users, label: "5 000+ Élèves", sub: "Préparés au BAC" },
  { icon: BookOpen, label: "300+ Cours", sub: "Toutes matières" },
  { icon: PenLine, label: "1 000+ Exercices", sub: "Corrigés détaillés" },
];

const series = [
  {
    code: "A",
    titre: "Série A — Littéraire",
    color: "from-fuchsia-500 to-violet-600",
    icon: Globe2,
    matieres: ["Philosophie", "Français", "Histoire-Géo", "Langues", "Littérature"],
    desc: "Maîtrisez l'analyse, la dissertation et la culture générale pour exceller en filière littéraire.",
  },
  {
    code: "C",
    titre: "Série C — Mathématiques",
    color: "from-blue-600 to-cyan-500",
    icon: Calculator,
    matieres: ["Mathématiques", "Physique", "Chimie", "SVT", "Philosophie"],
    desc: "Approfondissez vos compétences en maths et sciences exactes pour viser l'excellence scientifique.",
  },
  {
    code: "D",
    titre: "Série D — Sciences",
    color: "from-emerald-500 to-teal-500",
    icon: Beaker,
    matieres: ["SVT", "Physique-Chimie", "Mathématiques", "Philosophie", "Anglais"],
    desc: "Préparez votre orientation médicale, biologique ou scientifique avec un programme complet.",
  },
];

const features = [
  {
    icon: Brain,
    titre: "Tuteur IA personnalisé",
    desc: "Posez vos questions à n'importe quelle heure et recevez des explications adaptées à votre niveau.",
  },
  {
    icon: Target,
    titre: "Suivi de progression",
    desc: "Visualisez vos forces, vos faiblesses et progressez matière par matière sur la durée.",
  },
  {
    icon: Layers,
    titre: "Annales corrigées",
    desc: "Entraînez-vous sur les vrais sujets du BAC avec des corrections rédigées par des professeurs.",
  },
  {
    icon: Trophy,
    titre: "Mention garantie",
    desc: "Une méthodologie qui a déjà permis à des milliers d'élèves d'obtenir une mention.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 hover-elevate active-elevate-2 rounded-lg px-2 py-1.5 -mx-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient shadow-md">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              BAC <span className="text-hero-gradient">MASTER ELITE</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#series" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover-elevate">Séries</a>
            <a href="#features" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover-elevate">Fonctionnalités</a>
            <a href="#temoignages" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover-elevate">Témoignages</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="button-nav-login">Connexion</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-hero-gradient text-white hover:opacity-90" data-testid="button-nav-signup">
                S'inscrire
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                <span>Plateforme #1 de préparation au BAC</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Préparez votre <br />
                <span className="text-hero-gradient">BAC avec confiance</span>
              </h1>

              <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                Cours interactifs, exercices corrigés, annales et tuteur IA — tous les outils pour décrocher
                votre BAC avec mention dans les séries A, C et D.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="group bg-hero-gradient text-white hover:opacity-90 shadow-lg shadow-blue-600/25"
                    data-testid="button-hero-start"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" data-testid="button-hero-login">
                    J'ai déjà un compte
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-6">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm hover-elevate"
                    data-testid={`badge-${s.label.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <s.icon className="mx-auto h-5 w-5 text-blue-600" />
                    <p className="mt-2 text-sm font-bold text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative"
            >
              <div className="relative rounded-3xl border border-border bg-card p-2 shadow-2xl">
                <div className="rounded-2xl bg-hero-gradient p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/70">Tuteur IA</p>
                      <p className="font-semibold text-white">Disponible 24/7</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="rounded-xl bg-white/15 p-4 backdrop-blur">
                      <p className="text-sm text-white">
                        "Explique-moi le théorème de Pythagore avec un exemple."
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-md">
                      <p className="text-sm text-slate-700">
                        Bien sûr ! Le théorème de Pythagore dit que dans un triangle rectangle,
                        le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés…
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Réponse personnalisée pour la série C</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-4">
                  <div className="rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-950/40">
                    <BookOpen className="mx-auto h-4 w-4 text-blue-600" />
                    <p className="mt-1 text-xs font-semibold">Cours</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/40">
                    <PenLine className="mx-auto h-4 w-4 text-emerald-600" />
                    <p className="mt-1 text-xs font-semibold">Exercices</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center dark:bg-amber-950/40">
                    <Trophy className="mx-auto h-4 w-4 text-amber-600" />
                    <p className="mt-1 text-xs font-semibold">Annales</p>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 -top-4 hidden rounded-2xl border border-border bg-card p-3 shadow-xl sm:block"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">Mention TB</p>
                    <p className="text-[10px] text-muted-foreground">94% de réussite</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SERIES */}
      <section id="series" className="border-t border-border bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Programmes</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Une préparation adaptée à votre série
            </h2>
            <p className="mt-4 text-muted-foreground">
              Choisissez votre série et accédez à un programme complet pensé par des professeurs
              spécialisés du BAC.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {series.map((s, i) => (
              <motion.div
                key={s.code}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm hover-elevate"
                data-testid={`card-serie-${s.code}`}
              >
                <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${s.color} opacity-10 transition-opacity group-hover:opacity-20`} />
                <div className="relative">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-md`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{s.titre}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {s.matieres.map((m) => (
                      <span
                        key={m}
                        className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/signup"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:gap-2.5 transition-all"
                    data-testid={`link-serie-${s.code}`}
                  >
                    Découvrir le programme
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Pourquoi nous</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Tout ce qu'il faut pour réussir
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.titre}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm hover-elevate"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-bold">{f.titre}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages dynamiques */}
      <section id="temoignages-dynamiques" className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <TestimonialsCarousel variant="landing" showForm={false} />
        </div>
      </section>

      {/* Recommandations professeurs */}
      <section id="professeurs" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <TeachersSection />
        </div>
      </section>

      {/* CTA */}
      <section id="cta-final" className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-hero-gradient p-10 text-center shadow-2xl sm:p-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Prêt à transformer votre préparation au BAC ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/85">
            Rejoignez des milliers d'élèves qui se préparent chaque jour avec BAC MASTER ELITE.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-white/90" data-testid="button-cta-start">
                Créer mon compte gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                Me connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <span>© {new Date().getFullYear()} BAC MASTER ELITE. Tous droits réservés.</span>
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Confidentialité</a>
            <a href="#" className="hover:text-foreground">Conditions</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

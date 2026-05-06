import { useState, type FormEvent } from "react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Calculator,
  Beaker,
  Globe2,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SERIES = [
  {
    code: "A",
    titre: "Série A",
    sub: "Littéraire",
    icon: Globe2,
    color: "from-fuchsia-500 to-violet-600",
  },
  {
    code: "C",
    titre: "Série C",
    sub: "Mathématiques",
    icon: Calculator,
    color: "from-blue-600 to-cyan-500",
  },
  {
    code: "D",
    titre: "Série D",
    sub: "Sciences",
    icon: Beaker,
    color: "from-emerald-500 to-teal-500",
  },
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serie, setSerie] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "Les deux mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    if (!serie) {
      toast({
        title: "Choisissez votre série",
        description: "La sélection de votre série est obligatoire pour personnaliser votre parcours.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, { full_name: fullName, serie });
    setSubmitting(false);
    if (error) {
      toast({ title: "Inscription échouée", description: error, variant: "destructive" });
      return;
    }
    toast({
      title: "Compte créé !",
      description: "Bienvenue sur BAC MASTER ELITE.",
    });
    setLocation("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">BAC MASTER ELITE</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Créer votre compte</h1>
          <p className="mt-2 text-muted-foreground">Commencez gratuitement, sans carte bancaire.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aïcha Koné"
                  className="pl-9"
                  data-testid="input-fullname"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="pl-9"
                  data-testid="input-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  className="pl-9 pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  className={cn("pl-9 pr-10", confirmPassword && password !== confirmPassword ? "border-rose-500 focus-visible:ring-rose-500" : "")}
                  data-testid="input-confirm-password"
                  type={showConfirm ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-rose-500">Les mots de passe ne correspondent pas.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Votre série <span className="text-rose-600">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {SERIES.map((s) => {
                  const active = serie === s.code;
                  return (
                    <button
                      type="button"
                      key={s.code}
                      onClick={() => setSerie(s.code)}
                      className={cn(
                        "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all hover-elevate",
                        active
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                          : "border-border bg-card",
                      )}
                      data-testid={`serie-${s.code}`}
                    >
                      {active && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-sm`}
                      >
                        <s.icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold">{s.titre}</p>
                      <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                    </button>
                  );
                })}
              </div>
              {!serie && (
                <p className="text-xs text-muted-foreground">
                  Sélectionnez votre série pour personnaliser cours et exercices.
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full rounded-full bg-hero-gradient text-white hover:opacity-90"
              data-testid="button-submit-signup"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-hero-gradient lg:block order-1 lg:order-2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">BAC MASTER ELITE</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold leading-tight">
              Rejoignez 5 000+ élèves préparés à l'excellence.
            </h2>
            <p className="mt-4 text-white/85">
              Cours • Exercices • Annales • Tuteur IA disponible 24/7
            </p>
          </motion.div>
          <p className="text-sm text-white/70">© {new Date().getFullYear()} BAC MASTER ELITE</p>
        </div>
      </div>
    </div>
  );
}

import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  PenLine,
  ScrollText,
  Brain,
  LogOut,
  Menu,
  X,
  Sparkles,
  User as UserIcon,
  Trophy,
  Crown,
  ShieldCheck,
  Compass,
  Lightbulb,
  Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useProfile } from "@/lib/queries";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/cours", label: "Cours", icon: BookOpen },
  { href: "/dashboard/exercices", label: "Exercices", icon: PenLine },
  { href: "/dashboard/annales", label: "Annales", icon: ScrollText },
  { href: "/dashboard/methodologie", label: "Méthodologie", icon: Compass },
  { href: "/dashboard/astuces", label: "Astuces BAC", icon: Lightbulb },
  { href: "/dashboard/tuteur-ia", label: "Tuteur IA", icon: Brain, badge: "IA" },
  { href: "/dashboard/quiz", label: "Quiz", icon: Sparkles, badge: "+pts" },
  { href: "/dashboard/leaderboard", label: "Classement", icon: Trophy },
  { href: "/dashboard/parrainage", label: "Parrainage", icon: UsersIcon },
  { href: "/dashboard/profile", label: "Profil", icon: UserIcon },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fullName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "Élève";
  const serie = profile?.serie ?? (user?.user_metadata?.serie as string | undefined) ?? "—";
  const isPremium = profile?.is_premium === true;
  const isAdmin = profile?.is_admin === true;

  const initials =
    fullName
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  const items = isAdmin
    ? [...navItems, { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck }]
    : navItems;

  const Sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">BAC MASTER</p>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Elite</p>
          </div>
        </Link>
        <button
          className="lg:hidden text-sidebar-foreground/70"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? location === "/dashboard"
              : location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover-elevate",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80",
              )}
              data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className={cn("h-4 w-4", active ? "text-blue-400" : "text-sidebar-foreground/60")} />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!isPremium && (
          <div className="mb-3 rounded-2xl bg-gradient-to-br from-blue-600/20 to-emerald-500/20 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <p className="text-xs font-bold">Passez à Premium</p>
            </div>
            <p className="mt-1 text-[11px] text-sidebar-foreground/70">
              Cours, annales et IA en illimité.
            </p>
            <Link href="/dashboard/upgrade">
              <Button size="sm" className="mt-3 w-full rounded-full bg-white text-blue-700 hover:bg-white/90">
                <Crown className="mr-1 h-3.5 w-3.5" />
                Découvrir
              </Button>
            </Link>
          </div>
        )}

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-xl bg-sidebar-accent/40 p-2.5 hover-elevate"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hero-gradient text-sm font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold">{fullName}</p>
            <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
              <span>Série {serie}</span>
              {isPremium && <Crown className="h-3 w-3 text-amber-400" />}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signOut();
            }}
            className="rounded-lg p-2 text-sidebar-foreground/70 hover-elevate"
            aria-label="Se déconnecter"
            data-testid="button-signout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border lg:block">
        {Sidebar}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            >
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover-elevate lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-sm font-semibold">
              Bonjour, {fullName.split(" ")[0]} 👋
            </p>
          </div>
          {isPremium ? (
            <span className="hidden items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 sm:inline-flex">
              <Crown className="h-3.5 w-3.5" />
              Premium
            </span>
          ) : (
            <Link href="/dashboard/upgrade">
              <Button size="sm" className="hidden rounded-full bg-hero-gradient text-white hover:opacity-90 sm:inline-flex">
                <Crown className="mr-1 h-3.5 w-3.5" />
                Premium
              </Button>
            </Link>
          )}
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

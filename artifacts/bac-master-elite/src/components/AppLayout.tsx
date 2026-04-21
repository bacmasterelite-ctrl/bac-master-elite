import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  PenSquare,
  FileText,
  Lightbulb,
  Trophy,
  Bot,
  Crown,
  Users,
  CreditCard,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/subjects", icon: BookOpen, label: "Matières" },
  { href: "/lessons", icon: GraduationCap, label: "Cours" },
  { href: "/exercises", icon: PenSquare, label: "Exercices" },
  { href: "/annals", icon: FileText, label: "Annales" },
  { href: "/methodology", icon: Lightbulb, label: "Méthodologie" },
  { href: "/ranking", icon: Trophy, label: "Classement" },
  { href: "/ai-tutor", icon: Bot, label: "Tuteur IA" },
  { href: "/premium", icon: Crown, label: "Premium" },
];

const ADMIN_NAV = [
  { href: "/admin/stats", icon: BarChart3, label: "Statistiques" },
  { href: "/admin/users", icon: Users, label: "Utilisateurs" },
  { href: "/admin/payments", icon: CreditCard, label: "Paiements" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: profile } = useGetMe();
  const { user, signOut } = useSupabaseAuth();

  const initial = (profile?.fullName || profile?.email || user?.email || "?")[0]?.toUpperCase();

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center shrink-0 hover:opacity-90"
          data-testid="button-user-menu"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <div className="px-3 py-2 text-xs text-gray-500 truncate">{user?.email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")} data-testid="menu-profile">
          <UserIcon className="w-4 h-4 mr-2" /> Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          data-testid="menu-signout"
          className="text-red-600 focus:text-red-700"
        >
          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const NavLinks = ({ items }: { items: typeof NAV }) => (
    <nav className="space-y-1">
      {items.map((item) => {
        const active =
          location === item.href ||
          (item.href !== "/" && location.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            data-testid={`link-${item.href.replace(/\//g, "-") || "home"}`}
          >
            <a
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </a>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-gray-700"
          data-testid="button-mobile-menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-900">BAC MASTER</span>
        </div>
        <UserMenu />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-white p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">BAC MASTER</div>
                  <div className="text-[10px] text-gray-500 -mt-0.5">ELITE</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <NavLinks items={NAV} />
            {profile?.isAdmin && (
              <>
                <div className="text-xs uppercase tracking-wider text-gray-500 mt-6 mb-2 px-3">
                  Administration
                </div>
                <NavLinks items={ADMIN_NAV} />
              </>
            )}
          </aside>
        </div>
      )}

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200 lg:p-4">
          <div className="flex items-center gap-2.5 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">BAC MASTER</div>
              <div className="text-[10px] text-gray-500 -mt-0.5 tracking-wider">ELITE</div>
            </div>
          </div>

          <NavLinks items={NAV} />
          {profile?.isAdmin && (
            <>
              <div className="text-xs uppercase tracking-wider text-gray-500 mt-6 mb-2 px-3">
                Administration
              </div>
              <NavLinks items={ADMIN_NAV} />
            </>
          )}

          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2 py-2">
              <UserMenu />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {profile?.fullName || profile?.email}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {profile?.serie && (
                    <Badge variant="secondary" className="h-5 text-[10px]">
                      Série {profile.serie}
                    </Badge>
                  )}
                  {profile?.isPremium && (
                    <Badge className="h-5 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
                      <Crown className="w-3 h-3 mr-0.5" />Premium
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-10 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}

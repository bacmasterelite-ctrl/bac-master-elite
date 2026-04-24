import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Lightbulb,
  Trophy,
  Bot,
  Crown,
  User,
  Menu,
  X,
  LogOut,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/subjects", icon: BookOpen, label: "Matières" },
  { href: "/lessons", icon: GraduationCap, label: "Cours" },
  { href: "/exercises", icon: FileText, label: "Exercices" },
  { href: "/annals", icon: FileText, label: "Annales" },
  { href: "/methodology", icon: Lightbulb, label: "Méthode & Astuces" },
  { href: "/ranking", icon: Trophy, label: "Classement" },
  { href: "/ai-tutor", icon: Bot, label: "Tuteur IA" },
  { href: "/premium", icon: Crown, label: "Premium" },
  { href: "/profile", icon: User, label: "Profil" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [location] = useLocation();
  const [isPremium, setIsPremium] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function checkPremium() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();
        setIsPremium(profile?.is_premium === true);
      }
    }
    checkPremium();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Déconnexion réussie" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900">BAC MASTER</span>
            <span className="text-xs text-gray-500 block -mt-1">ELITE</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-xl">
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full bg-white shadow-xl transition-all duration-300 ease-in-out
        ${isMobile ? 'w-72' : 'w-64'}
        ${isMobile ? (isMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl text-gray-900">BAC MASTER</span>
                <p className="text-xs text-gray-500 -mt-0.5">ELITE</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => isMobile && setIsMenuOpen(false)}>
                  <div className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border border-blue-100' 
                      : 'text-gray-600 hover:bg-gray-50'}
                  `}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.label === "Premium" && !isPremium && (
                      <span className="ml-auto text-[10px] bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`${!isMobile ? 'lg:ml-64' : ''} pt-16 lg:pt-0 min-h-screen`}>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay mobile */}
      {isMobile && isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}
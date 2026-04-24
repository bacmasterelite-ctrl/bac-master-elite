import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSupabaseAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Rediriger vers onboarding si pas de série
  if (!session?.user?.user_metadata?.serie && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}
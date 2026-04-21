import { useGetMe } from "@workspace/api-client-react";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useGetMe();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Impossible de charger le profil. Réessayez.
      </div>
    );
  }

  if (!data.serie && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}

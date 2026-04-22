import { useGetMe } from "@workspace/api-client-react";
import { Redirect, useLocation } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError, refetch, isFetching } = useGetMe();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { signOut } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <div>
          <p className="font-medium text-gray-900">Impossible de charger le profil</p>
          <p className="text-sm text-gray-500 mt-1">
            Vérifie ta connexion et réessaie.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} disabled={isFetching} data-testid="button-retry-profile">
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Réessayer"}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
            data-testid="button-signout-error"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  if (!data.serie && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}

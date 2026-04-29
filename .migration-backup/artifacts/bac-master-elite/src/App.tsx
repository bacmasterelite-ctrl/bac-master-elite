import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import {
  SupabaseAuthProvider,
  useAuth,
} from "@/contexts/SupabaseAuthProvider";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Cours from "@/pages/Cours";
import Exercices from "@/pages/Exercices";
import Annales from "@/pages/Annales";
import TuteurIA from "@/pages/TuteurIA";
import Methodologie from "@/pages/Methodologie";
import AstucesBAC from "@/pages/AstucesBAC";
import Upgrade from "@/pages/Upgrade";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Redirect to="/" />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        <PublicOnlyRoute>
          <Landing />
        </PublicOnlyRoute>
      </Route>
      <Route path="/login">
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      </Route>
      <Route path="/signup">
        <PublicOnlyRoute>
          <Signup />
        </PublicOnlyRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/cours">
        <ProtectedRoute>
          <Cours />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/exercices">
        <ProtectedRoute>
          <Exercices />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/annales">
        <ProtectedRoute>
          <Annales />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/methodologie">
        <ProtectedRoute>
          <Methodologie />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/astuces">
        <ProtectedRoute>
          <AstucesBAC />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/tuteur-ia">
        <ProtectedRoute>
          <TuteurIA />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/upgrade">
        <ProtectedRoute>
          <Upgrade />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/leaderboard">
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/admin">
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;

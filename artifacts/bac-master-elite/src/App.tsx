import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import {
  SupabaseAuthProvider,
  useAuth,
} from "@/contexts/SupabaseAuthProvider";
const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Cours = lazy(() => import("@/pages/Cours"));
const Lecon = lazy(() => import("@/pages/Lecon"));
const Exercices = lazy(() => import("@/pages/Exercices"));
const Exercice = lazy(() => import("@/pages/Exercice"));
const Annales = lazy(() => import("@/pages/Annales"));
const TuteurIA = lazy(() => import("@/pages/TuteurIA"));
const Methodologie = lazy(() => import("@/pages/Methodologie"));
const AstucesBAC = lazy(() => import("@/pages/AstucesBAC"));
const Upgrade = lazy(() => import("@/pages/Upgrade"));
const Profile = lazy(() => import("@/pages/Profile"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Admin = lazy(() => import("@/pages/Admin"));
const Success = lazy(() => import("@/pages/Success"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
import NotFound from "@/pages/not-found";
const Quiz = lazy(() => import("@/pages/Quiz"));
const Parrainage = lazy(() => import("@/pages/Parrainage"));
import RefTracker from "@/components/RefTracker";

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
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>}><Switch>
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
      <Route path="/dashboard/lecon/:id">
        <ProtectedRoute>
          <Lecon />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/exercices">
        <ProtectedRoute>
          <Exercices />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/exercice/:id">
        <ProtectedRoute>
          <Exercice />
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
      <Route path="/dashboard/quiz">
        <ProtectedRoute>
          <Quiz />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/parrainage">
        <ProtectedRoute>
          <Parrainage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/admin">
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </Route>

      <Route path="/success">
        <Success />
      </Route>

      <Route path="/reset-password">
        <ResetPassword />
      </Route>

      <Route component={NotFound} />
    </Switch></Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RefTracker />
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;

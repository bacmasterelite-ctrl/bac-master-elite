import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/Login";
import OnboardingPage from "@/pages/Onboarding";
import DashboardPage from "@/pages/Dashboard";
import SubjectsPage from "@/pages/Subjects";
import LessonsPage from "@/pages/Lessons";
import LessonDetailPage from "@/pages/LessonDetail";
import ExercisesPage from "@/pages/Exercises";
import ExerciseDetailPage from "@/pages/ExerciseDetail";
import AnnalsPage from "@/pages/Annals";
import MethodologyPage from "@/pages/Methodology";
import RankingPage from "@/pages/Ranking";
import AITutorPage from "@/pages/AITutor";
import PremiumPage from "@/pages/Premium";
import ProfilePage from "@/pages/Profile";
import AdminUsersPage from "@/pages/AdminUsers";
import AdminPaymentsPage from "@/pages/AdminPayments";
import AdminStatsPage from "@/pages/AdminStats";
import { AppLayout } from "@/components/AppLayout";
import { ProfileGate } from "@/components/ProfileGate";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function ProtectedRoutes() {
  return (
    <ProfileGate>
      <AppLayout>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/subjects" component={SubjectsPage} />
          <Route path="/lessons" component={LessonsPage} />
          <Route path="/lessons/:id" component={LessonDetailPage} />
          <Route path="/exercises" component={ExercisesPage} />
          <Route path="/exercises/:id" component={ExerciseDetailPage} />
          <Route path="/annals" component={AnnalsPage} />
          <Route path="/methodology" component={MethodologyPage} />
          <Route path="/ranking" component={RankingPage} />
          <Route path="/ai-tutor" component={AITutorPage} />
          <Route path="/premium" component={PremiumPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/admin/users" component={AdminUsersPage} />
          <Route path="/admin/payments" component={AdminPaymentsPage} />
          <Route path="/admin/stats" component={AdminStatsPage} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </ProfileGate>
  );
}

function AuthRouter() {
  const { session, loading } = useSupabaseAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!session) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route><Redirect to="/login" /></Route>
      </Switch>
    );
  }
  return (
    <Switch>
      <Route path="/login"><Redirect to="/" /></Route>
      <Route path="/onboarding" component={OnboardingPage} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

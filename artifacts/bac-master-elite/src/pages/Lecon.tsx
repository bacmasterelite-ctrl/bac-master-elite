import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Loader2, Lock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PremiumLimitModal from "@/components/PremiumLimitModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import { useLessons, useCheckCourseAccess, type Course } from "@/lib/queries";

function formatContent(text: string): string {
  if (!text) return "";
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export default function Lecon() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: lessons = [], isLoading } = useLessons();
  const checkCourseAccess = useCheckCourseAccess();
  const [accessDenied, setAccessDenied] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const lesson = useMemo(() => 
    lessons.find((l) => String(l.id) === String(params.id)),
    [lessons, params.id]
  );

  useEffect(() => {
    if (!user?.id || !params.id) return;

    checkCourseAccess.mutate(user.id, {
      onSuccess: (result) => {
        console.log("Quota Check:", result);
        if (result.allowed === false) {
          setAccessDenied(true);
          setLimitModalOpen(true);
        }
      }
    });
  }, [user?.id, params.id]);

  if (isLoading) return <DashboardLayout><Loader2 className="mx-auto animate-spin" /></DashboardLayout>;
  if (!lesson) return <DashboardLayout><div className="text-center">Leçon introuvable</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PremiumLimitModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} type="lessons" />
      <div className="mx-auto max-w-3xl p-6">
        <Link href="/dashboard/cours"><Button variant="ghost"><ArrowLeft className="mr-2" /> Retour</Button></Link>
        
        {accessDenied ? (
          <div className="mt-10 rounded-3xl border p-12 text-center shadow-sm">
            <Lock className="mx-auto h-12 w-12 text-rose-600" />
            <h2 className="mt-4 text-xl font-bold">Limite de 3 cours atteinte</h2>
            <p className="text-muted-foreground">Passez Premium pour débloquer tout le contenu.</p>
            <Link href="/dashboard/upgrade"><Button className="mt-6 bg-orange-500"><Crown className="mr-2" /> Devenir Premium</Button></Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <h1 className="text-3xl font-bold">{lesson.titre || lesson.title}</h1>
            <div className="mt-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(lesson.contenu || lesson.content) }} />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

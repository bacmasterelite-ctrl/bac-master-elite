import { useGetLesson } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LessonDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetLesson(id!);

  if (isLoading) return <div className="text-sm text-gray-500">Chargement...</div>;
  if (!data) return <div>Cours introuvable.</div>;

  return (
    <div className="max-w-3xl">
      <Link href="/lessons">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux cours
        </Button>
      </Link>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <GraduationCap className="w-4 h-4" /> {data.subjectName} · Série {data.serie}
        {data.durationMinutes && (<span className="flex items-center gap-1 ml-2"><Clock className="w-3 h-3" />{data.durationMinutes} min</span>)}
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{data.title}</h1>
      <Card className="p-8 rounded-2xl border-0 shadow-sm">
        <article className="prose prose-blue max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed">
          {data.content}
        </article>
      </Card>
    </div>
  );
}

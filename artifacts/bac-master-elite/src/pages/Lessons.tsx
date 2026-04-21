import { useGetMe, useListLessons, useListSubjects } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Link, useSearch } from "wouter";
import { Clock, GraduationCap } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useMemo } from "react";

export default function LessonsPage() {
  const { data: profile } = useGetMe();
  const search = useSearch();
  const initialSubject = useMemo(() => new URLSearchParams(search).get("subjectId") ?? "all", [search]);
  const [subjectId, setSubjectId] = useState(initialSubject);

  const { data: subjects } = useListSubjects(profile?.serie ? { serie: profile.serie as "A" | "C" | "D" } : undefined);
  const { data: lessons, isLoading } = useListLessons({
    serie: profile?.serie as "A" | "C" | "D" | undefined,
    subjectId: subjectId !== "all" ? subjectId : undefined,
  });

  return (
    <div>
      <PageHeader
        title="Cours"
        subtitle={`Tous les cours de la série ${profile?.serie ?? ""}`}
        action={
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="w-56 rounded-xl" data-testid="select-subject-filter">
              <SelectValue placeholder="Toutes les matières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {subjects?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <div className="text-sm text-gray-500">Chargement...</div>
      ) : !lessons?.length ? (
        <div className="text-sm text-gray-500 py-12 text-center">Aucun cours disponible.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((l) => (
            <Link key={l.id} href={`/lessons/${l.id}`}>
              <a data-testid={`link-lesson-${l.id}`}>
                <Card className="p-5 rounded-2xl border-0 shadow-sm hover-elevate cursor-pointer h-full">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {l.subjectName}
                  </div>
                  <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{l.title}</div>
                  <div className="text-sm text-gray-500 line-clamp-2">{l.summary}</div>
                  {l.durationMinutes && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                      <Clock className="w-3 h-3" /> {l.durationMinutes} min
                    </div>
                  )}
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

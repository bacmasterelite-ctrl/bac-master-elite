import { useGetMe, useListExercises, useListSubjects } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Link } from "wouter";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

const DIFF_COLORS: Record<string, string> = {
  facile: "bg-emerald-100 text-emerald-700",
  moyen: "bg-amber-100 text-amber-700",
  difficile: "bg-red-100 text-red-700",
};

export default function ExercisesPage() {
  const { data: profile } = useGetMe();
  const [subjectId, setSubjectId] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const { data: subjects } = useListSubjects(profile?.serie ? { serie: profile.serie as "A" | "C" | "D" } : undefined);
  const { data: exercises, isLoading } = useListExercises({
    serie: profile?.serie as "A" | "C" | "D" | undefined,
    subjectId: subjectId !== "all" ? subjectId : undefined,
    difficulty: difficulty !== "all" ? (difficulty as "facile" | "moyen" | "difficile") : undefined,
  });

  return (
    <div>
      <PageHeader
        title="Exercices"
        subtitle="Entraîne-toi avec des QCM corrigés."
        action={
          <div className="flex gap-2">
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-44 rounded-xl" data-testid="select-subject"><SelectValue placeholder="Matière"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes matières</SelectItem>
                {subjects?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-36 rounded-xl" data-testid="select-difficulty"><SelectValue placeholder="Difficulté"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="facile">Facile</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="difficile">Difficile</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      {isLoading ? (
        <div className="text-sm text-gray-500">Chargement...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises?.map((e) => (
            <Link key={e.id} href={`/exercises/${e.id}`}>
              <a data-testid={`link-exercise-${e.id}`}>
                <Card className="p-5 rounded-2xl border-0 shadow-sm hover-elevate cursor-pointer h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-gray-500">{e.subjectName}</div>
                    <Badge className={`${DIFF_COLORS[e.difficulty] || "bg-gray-100"} hover:${DIFF_COLORS[e.difficulty]}`}>{e.difficulty}</Badge>
                  </div>
                  <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{e.title}</div>
                  <div className="text-xs text-gray-500">{e.questions.length} questions</div>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

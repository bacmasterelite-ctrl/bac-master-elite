import { useGetMe, useListAnnals, useListSubjects } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Crown, FileText, Lock, Download } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

export default function AnnalsPage() {
  const { data: profile } = useGetMe();
  const [subjectId, setSubjectId] = useState("all");
  const [year, setYear] = useState("all");

  const { data: subjects } = useListSubjects(profile?.serie ? { serie: profile.serie as "A" | "C" | "D" } : undefined);
  const { data: annals, isLoading } = useListAnnals({
    serie: profile?.serie as "A" | "C" | "D" | undefined,
    subjectId: subjectId !== "all" ? subjectId : undefined,
    year: year !== "all" ? parseInt(year, 10) : undefined,
  });

  const isPremium = !!profile?.isPremium;

  return (
    <div>
      <PageHeader
        title="Annales"
        subtitle="Sujets corrigés des années précédentes."
        action={
          <div className="flex gap-2">
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-44 rounded-xl"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes matières</SelectItem>
                {subjects?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32 rounded-xl"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes années</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {isLoading ? (
        <div className="text-sm text-gray-500">Chargement...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {annals?.map((a) => {
            const locked = a.isPremium && !isPremium;
            return (
              <Card key={a.id} className="p-5 rounded-2xl border-0 shadow-sm hover-elevate" data-testid={`card-annal-${a.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  {a.isPremium && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      <Crown className="w-3 h-3 mr-0.5" />Premium
                    </Badge>
                  )}
                </div>
                <div className="font-semibold text-gray-900 line-clamp-2 mb-1">{a.title}</div>
                <div className="text-xs text-gray-500 mb-4">{a.subjectName} · {a.year}</div>
                {locked ? (
                  <Link href="/premium">
                    <Button variant="outline" size="sm" className="w-full rounded-lg" data-testid={`button-unlock-${a.id}`}>
                      <Lock className="w-3.5 h-3.5 mr-1.5" /> Débloquer
                    </Button>
                  </Link>
                ) : (
                  <Button asChild size="sm" className="w-full rounded-lg" data-testid={`button-download-${a.id}`}>
                    <a href={a.pdfUrl} target="_blank" rel="noreferrer">
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Télécharger
                    </a>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

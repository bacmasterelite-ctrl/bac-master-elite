import { useGetMe, useListSubjects } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function SubjectsPage() {
  const { data: profile } = useGetMe();
  const { data: subjects, isLoading } = useListSubjects(
    profile?.serie ? { serie: profile.serie as "A" | "C" | "D" } : undefined,
  );

  return (
    <div>
      <PageHeader
        title="Matières"
        subtitle={`Explore les matières de la série ${profile?.serie ?? ""}`}
      />
      {isLoading ? (
        <div className="text-sm text-gray-500">Chargement...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects?.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/lessons?subjectId=${s.id}`}>
                <a data-testid={`link-subject-${s.slug}`}>
                  <Card className="group p-6 rounded-2xl border-0 shadow-sm hover-elevate cursor-pointer h-full">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-4"
                      style={{ background: s.color }}
                    >
                      {s.name[0]}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</div>
                    <div className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 font-medium">
                      Voir les cours <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Card>
                </a>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useListMethodology } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";

export default function MethodologyPage() {
  const { data, isLoading } = useListMethodology();
  const [openId, setOpenId] = useState<string | null>(null);
  const card = data?.find((c) => c.id === openId);

  return (
    <div>
      <PageHeader title="Méthodologie" subtitle="Astuces pour bien travailler et réussir." />
      {isLoading ? (
        <div className="text-sm text-gray-500">Chargement...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((c) => {
            const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] || LucideIcons.BookOpen;
            return (
              <Card
                key={c.id}
                onClick={() => setOpenId(c.id)}
                className="p-6 rounded-2xl border-0 shadow-sm hover-elevate cursor-pointer h-full"
                data-testid={`card-methodology-${c.slug}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="font-semibold text-gray-900 mb-1">{c.title}</div>
                <div className="text-sm text-gray-500 line-clamp-3">{c.summary}</div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{card?.title}</DialogTitle>
          </DialogHeader>
          <article className="prose prose-blue max-w-none whitespace-pre-wrap text-gray-800 max-h-[60vh] overflow-y-auto">
            {card?.content}
          </article>
        </DialogContent>
      </Dialog>
    </div>
  );
}

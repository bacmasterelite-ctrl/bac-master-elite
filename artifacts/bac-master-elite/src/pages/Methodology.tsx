import { useListMethodology } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function MethodologyPage() {
  const { data, isLoading } = useListMethodology();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <PageHeader title="Méthodologie" subtitle="Astuces pour bien travailler et réussir." />
      {isLoading ? (
        <div className="text-sm text-gray-500">Chargement...</div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {data?.map((c) => {
            const Icon =
              (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] ||
              LucideIcons.BookOpen;
            const isOpen = openIds.has(c.id);
            return (
              <Card
                key={c.id}
                className="rounded-2xl border-0 shadow-sm overflow-hidden"
                data-testid={`card-methodology-${c.slug}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isOpen}
                  data-testid={`button-toggle-${c.slug}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{c.title}</div>
                    {!isOpen && (
                      <div className="text-sm text-gray-500 line-clamp-1">{c.summary}</div>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                    <article className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                      {c.content}
                    </article>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

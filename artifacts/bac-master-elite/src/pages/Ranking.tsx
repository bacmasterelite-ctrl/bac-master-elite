import { useGetMe, useGetRanking } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Trophy, Crown, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RankingPage() {
  const { data: me } = useGetMe();
  const { data, isLoading } = useGetRanking(me?.serie ? { serie: me.serie as "A" | "C" | "D" } : undefined);

  const medal = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 text-center text-sm font-semibold text-gray-500">{rank}</span>;
  };

  return (
    <div>
      <PageHeader title="Classement" subtitle={`Top élèves de la série ${me?.serie ?? ""}`} />
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-gray-500">Chargement...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data?.map((r) => {
              const isMe = r.userId === me?.userId;
              return (
                <div
                  key={r.userId}
                  className={`flex items-center gap-4 px-5 py-3 ${isMe ? "bg-blue-50" : ""}`}
                  data-testid={`row-rank-${r.rank}`}
                >
                  <div className="w-7 flex justify-center">{medal(r.rank)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {r.fullName} {isMe && <span className="text-xs text-blue-600 ml-1">(toi)</span>}
                    </div>
                    {r.serie && <div className="text-xs text-gray-500">Série {r.serie}</div>}
                  </div>
                  {r.isPremium && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      <Crown className="w-3 h-3 mr-0.5"/>Premium
                    </Badge>
                  )}
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{r.score}</div>
                    <div className="text-[10px] text-gray-500">pts</div>
                  </div>
                </div>
              );
            })}
            {!data?.length && (
              <div className="p-12 text-center text-sm text-gray-500">
                Pas encore de classement. Sois le premier !
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

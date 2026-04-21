import { useAdminListUsers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Crown, Shield } from "lucide-react";

export default function AdminUsersPage() {
  const { data, isLoading } = useAdminListUsers();
  return (
    <div>
      <PageHeader title="Utilisateurs" subtitle={`${data?.length ?? 0} utilisateurs`} />
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-gray-500">Chargement...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data?.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3" data-testid={`row-user-${u.id}`}>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                  {(u.fullName || u.email)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{u.fullName || "(sans nom)"}</div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {u.serie && <Badge variant="secondary">Série {u.serie}</Badge>}
                  {u.isPremium && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Crown className="w-3 h-3 mr-0.5"/>Premium</Badge>}
                  {u.isAdmin && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Shield className="w-3 h-3 mr-0.5"/>Admin</Badge>}
                </div>
                <div className="text-right text-sm text-gray-500">{u.score} pts</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

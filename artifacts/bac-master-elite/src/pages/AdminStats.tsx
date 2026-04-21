import { useAdminGetStats } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Users, Crown, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

export default function AdminStatsPage() {
  const { data, isLoading } = useAdminGetStats();

  return (
    <div>
      <PageHeader title="Statistiques" subtitle="Vue d'ensemble de l'activité." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Utilisateurs", value: data?.totalUsers ?? 0, icon: Users, color: "from-blue-500 to-blue-600" },
          { label: "Premium", value: data?.premiumUsers ?? 0, icon: Crown, color: "from-amber-500 to-orange-500" },
          { label: "Paiements en attente", value: data?.pendingPayments ?? 0, icon: Clock, color: "from-purple-500 to-purple-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 rounded-2xl border-0 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5"/>
              </div>
              <div className="text-3xl font-bold text-gray-900">{isLoading ? "—" : s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl border-0 shadow-sm">
          <div className="font-semibold text-gray-900 mb-4">Répartition par série</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.usersBySerie ?? []}
                  dataKey="count"
                  nameKey="serie"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(e) => `${e.serie}: ${e.count}`}
                >
                  {(data?.usersBySerie ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-0 shadow-sm">
          <div className="font-semibold text-gray-900 mb-4">Inscriptions par mois</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.signupsByMonth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useUpdateMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

const SERIES = [
  { id: "A", title: "Série A", desc: "Lettres, philosophie, langues" },
  { id: "C", title: "Série C", desc: "Maths, physique, sciences" },
  { id: "D", title: "Série D", desc: "Sciences naturelles, biologie" },
] as const;

export default function OnboardingPage() {
  const { user } = useSupabaseAuth();
  const [serie, setSerie] = useState<"A" | "C" | "D" | "">("");
  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const [fullName, setFullName] = useState(meta.full_name || meta.name || "");
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const update = useUpdateMe({
    mutation: {
      onSuccess: async (data) => {
        queryClient.setQueryData(["/api/me"], data);
        await queryClient.invalidateQueries();
        navigate("/");
      },
    },
  });

  const submit = () => {
    if (!serie) return;
    update.mutate({ data: { serie, fullName } });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 rounded-3xl shadow-xl border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenue !</h1>
            <p className="text-sm text-gray-500">
              Quelques infos pour personnaliser ton expérience.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="name">Ton nom complet</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex. Aïcha Diop"
              className="mt-2"
              data-testid="input-fullname"
            />
          </div>

          <div>
            <Label>Choisis ta série</Label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SERIES.map((s) => {
                const active = serie === s.id;
                return (
                  <motion.button
                    key={s.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSerie(s.id)}
                    data-testid={`button-serie-${s.id}`}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      active
                        ? "border-blue-600 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="text-2xl font-bold text-blue-600">{s.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{s.desc}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <Button
            disabled={!serie || update.isPending}
            onClick={submit}
            className="w-full rounded-xl h-12 text-base"
            data-testid="button-submit-onboarding"
          >
            {update.isPending ? "Enregistrement..." : "Commencer"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

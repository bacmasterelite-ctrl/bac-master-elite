import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function ProfilePage() {
  const { data } = useGetMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [serie, setSerie] = useState("");

  useEffect(() => {
    if (data) {
      setFullName(data.fullName ?? "");
      setSerie(data.serie ?? "");
    }
  }, [data]);

  const update = useUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast({ title: "Profil mis à jour" });
      },
    },
  });

  return (
    <div className="max-w-xl">
      <PageHeader title="Mon profil" />
      <Card className="p-6 rounded-2xl border-0 shadow-sm space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={data?.email ?? ""} disabled className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="name">Nom complet</Label>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" data-testid="input-fullname" />
        </div>
        <div>
          <Label>Série</Label>
          <Select value={serie} onValueChange={setSerie}>
            <SelectTrigger className="mt-1.5"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Série A</SelectItem>
              <SelectItem value="C">Série C</SelectItem>
              <SelectItem value="D">Série D</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => update.mutate({ data: { fullName, serie: serie as "A" | "C" | "D" } })}
          disabled={update.isPending}
          className="rounded-xl"
          data-testid="button-save-profile"
        >
          {update.isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </Card>
    </div>
  );
}

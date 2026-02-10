import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (companyErr || !company) {
      toast.error("Erro ao criar empresa");
      setLoading(false);
      return;
    }

    const { error: memberErr } = await supabase
      .from("company_memberships")
      .insert({ company_id: company.id, user_id: user.id, role: "admin" });

    if (memberErr) {
      toast.error("Erro ao vincular membership");
      setLoading(false);
      return;
    }

    toast.success("Empresa criada com sucesso!");
    // Force page reload to update auth context
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center gap-2 text-2xl font-bold">
            <Wifi className="h-7 w-7 text-primary" />
            Greattings
          </div>
          <CardTitle>Bem-vindo! 🎉</CardTitle>
          <CardDescription>Crie sua empresa para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da empresa</Label>
              <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sua Empresa Ltda" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar empresa
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

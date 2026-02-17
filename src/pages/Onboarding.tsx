import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const { user, loading, companyId } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (companyId) return <Navigate to="/dashboard" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.rpc("create_company_with_membership", {
        _name: name.trim(),
      });

      if (error) {
        console.error("Onboarding error:", error);
        toast.error("Erro ao criar empresa");
        setSubmitting(false);
        return;
      }

      toast.success("Empresa criada com sucesso!");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Onboarding unexpected error:", err);
      toast.error("Erro inesperado ao criar empresa");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center gap-2 text-2xl font-bold">
            Toqler
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
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar empresa
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function DashboardSettings() {
  const { user, companyId, companyRole } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [form, setForm] = useState({ name: "", primary_color: "#0ea5e9", hide_branding: false, follow_up_email: false });

  const isAdmin = companyRole === "admin";

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      setLoading(true);
      const [compRes, membersRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", companyId).single(),
        supabase.from("company_memberships").select("*").eq("company_id", companyId),
      ]);
      if (compRes.data) {
        setCompany(compRes.data);
        setForm({
          name: compRes.data.name,
          primary_color: compRes.data.primary_color || "#0ea5e9",
          hide_branding: compRes.data.hide_branding || false,
          follow_up_email: compRes.data.follow_up_email || false,
        });
      }
      setMembers(membersRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update(form).eq("id", companyId);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Configurações salvas!");
  };

  const removeMember = async (membershipId: string) => {
    if (!confirm("Remover este membro?")) return;
    await supabase.from("company_memberships").delete().eq("id", membershipId);
    setMembers(members.filter((m) => m.id !== membershipId));
    toast.success("Membro removido");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua empresa e equipe</p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Nome da empresa</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Cor primária</Label>
              <div className="flex gap-2">
                <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-10 rounded border border-input cursor-pointer" />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Remover branding</Label><p className="text-xs text-muted-foreground">Ocultar "Powered by Greattings"</p></div>
              <Switch checked={form.hide_branding} onCheckedChange={(v) => setForm({ ...form, hide_branding: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Email de follow-up</Label><p className="text-xs text-muted-foreground">Enviar email automático após contato</p></div>
              <Switch checked={form.follow_up_email} onCheckedChange={(v) => setForm({ ...form, follow_up_email: v })} />
            </div>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Equipe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{m.user_id === user?.id ? "Você" : m.user_id.slice(0, 8)}</p>
                  <Badge variant="secondary" className="text-xs mt-1">{m.role === "admin" ? "Admin" : "Membro"}</Badge>
                </div>
                {isAdmin && m.user_id !== user?.id && (
                  <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Upload, Send, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import type { Company, TeamMember, Invitation } from "@/types/entities";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function DashboardSettings() {
  const { user, companyId, companyRole } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: "", primary_color: "#0ea5e9", hide_branding: false, follow_up_email: false });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  const isAdmin = companyRole === "admin";

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);

    const [compRes, invRes] = await Promise.all([
      supabase.from("companies").select("*").eq("id", companyId).single(),
      supabase.from("invitations").select("*").eq("company_id", companyId).eq("status", "pending").order("created_at", { ascending: false }),
    ]);

    if (compRes.data) {
      setCompany(compRes.data);
      setForm({
        name: compRes.data.name,
        primary_color: compRes.data.primary_color || "#0ea5e9",
        hide_branding: compRes.data.hide_branding || false,
        follow_up_email: compRes.data.follow_up_email || false,
      });
      setLogoPreview(compRes.data.logo_url || null);
    }

    setInvitations(invRes.data ?? []);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-team-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ company_id: companyId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
      const { data } = await supabase.from("company_memberships").select("*").eq("company_id", companyId);
      setMembers(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [companyId]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo deve ter no máximo 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);

    let logo_url = company?.logo_url || null;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `companies/${companyId}/logo.${ext}`;
      const { error } = await supabase.storage.from("assets").upload(path, logoFile, { upsert: true });
      if (error) { toast.error("Erro ao enviar logo"); setSaving(false); return; }
      logo_url = `${SUPABASE_URL}/storage/v1/object/public/assets/${path}?t=${Date.now()}`;
    }

    const { error } = await supabase.from("companies").update({ ...form, logo_url }).eq("id", companyId);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    setLogoFile(null);
    setCompany(prev => prev ? { ...prev, ...form, logo_url } : null);
    toast.success("Configurações salvas!");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !user) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setInviting(true);
    const { error } = await supabase.from("invitations").insert({
      company_id: companyId,
      email,
      role: inviteRole,
      invited_by: user.id,
    });
    setInviting(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("Este email já foi convidado");
      } else {
        toast.error("Erro ao enviar convite");
      }
      return;
    }

    toast.success(`Convite enviado para ${email}`);
    setInviteEmail("");
    setInviteRole("member");
    fetchData();
  };

  const cancelInvitation = async (id: string) => {
    await supabase.from("invitations").update({ status: "cancelled" }).eq("id", id);
    setInvitations(invitations.filter((inv) => inv.id !== id));
    toast.success("Convite cancelado");
  };

  const removeMember = async (membershipId: string) => {
    const confirmed = await confirm({
      title: "Remover membro",
      description: "Tem certeza que deseja remover este membro da equipe?",
      confirmLabel: "Remover",
      variant: "destructive",
    });
    if (!confirmed) return;
    await supabase.from("company_memberships").delete().eq("id", membershipId);
    setMembers(members.filter((m) => m.id !== membershipId));
    toast.success("Membro removido");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <ConfirmDialog {...dialogProps} />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua empresa e equipe</p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo da empresa</Label>
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => logoInputRef.current?.click()}>
                  {logoPreview ? "Trocar logo" : "Adicionar logo"}
                </button>
              </div>
            </div>

            <div className="space-y-2"><Label>Nome da empresa</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Cor primária</Label>
              <div className="flex gap-2">
                <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-10 rounded border border-input cursor-pointer" />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Remover branding</Label><p className="text-xs text-muted-foreground">Ocultar "Powered by Toqler"</p></div>
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
          {isAdmin && (
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(v: "admin" | "member") => setInviteRole(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviting} className="gap-2">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Convidar
              </Button>
            </form>
          )}

          {invitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Convites pendentes</p>
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-card-foreground">{inv.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">{inv.role === "admin" ? "Admin" : "Membro"}</Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => cancelInvitation(inv.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Membros ativos</p>
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {m.user_id === user?.id ? "Você" : (m.email || m.user_id.slice(0, 8))}
                  </p>
                  {m.user_id === user?.id && m.email && (
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  )}
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

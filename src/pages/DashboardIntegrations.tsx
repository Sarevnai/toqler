import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Webhook, Plus, Trash2, Loader2, ExternalLink, Zap, Send, Globe, Mail, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const UPCOMING_INTEGRATIONS = [
  { name: "Salesforce", cat: "CRM", desc: "Sincronize leads automaticamente", icon: BarChart3 },
  { name: "HubSpot", cat: "CRM", desc: "Integração nativa com HubSpot CRM", icon: BarChart3 },
  { name: "Pipedrive", cat: "CRM", desc: "Envie leads direto para o Pipedrive", icon: BarChart3 },
  { name: "RD Station", cat: "CRM", desc: "Conecte com RD Station Marketing", icon: BarChart3 },
  { name: "Zapier", cat: "Automação", desc: "Conecte com milhares de apps via webhook", icon: Zap },
  { name: "Make", cat: "Automação", desc: "Automações avançadas com Make", icon: Zap },
  { name: "Slack", cat: "Notificações", desc: "Notificações em tempo real", icon: Send },
  { name: "Mailchimp", cat: "Email", desc: "Adicione leads às suas listas", icon: Mail },
  { name: "Google Sheets", cat: "Exportação", desc: "Exporte leads para planilhas", icon: Globe },
  { name: "Google Calendar", cat: "Calendário", desc: "Agende reuniões automaticamente", icon: Calendar },
];

export default function DashboardIntegrations() {
  const { companyId, companyRole } = useAuth();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ url: "", secret: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const isAdmin = companyRole === "admin";

  const fetchWebhooks = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("integrations")
      .select("*")
      .eq("company_id", companyId)
      .eq("type", "webhook")
      .order("created_at", { ascending: false });
    setWebhooks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchWebhooks(); }, [companyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    const config = { url: form.url, secret: form.secret || undefined, name: form.name || undefined };
    const { error } = await supabase.from("integrations").insert({
      company_id: companyId,
      type: "webhook",
      config,
    });
    setSaving(false);
    if (error) {
      if (error.code === "23505") toast.error("Já existe um webhook configurado");
      else toast.error("Erro ao criar webhook");
      return;
    }
    toast.success("Webhook criado!");
    setDialogOpen(false);
    setForm({ url: "", secret: "", name: "" });
    fetchWebhooks();
  };

  const toggleWebhook = async (id: string, current: boolean) => {
    await supabase.from("integrations").update({ active: !current }).eq("id", id);
    fetchWebhooks();
    toast.success(!current ? "Webhook ativado" : "Webhook desativado");
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm("Excluir este webhook?")) return;
    await supabase.from("integrations").delete().eq("id", id);
    fetchWebhooks();
    toast.success("Webhook excluído");
  };

  const testWebhook = async (id: string, config: any) => {
    setTesting(id);
    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.secret ? { "X-Webhook-Secret": config.secret } : {}),
        },
        body: JSON.stringify({
          event: "test",
          timestamp: new Date().toISOString(),
          company_id: companyId,
          lead: { name: "Teste", email: "teste@exemplo.com", phone: null },
        }),
      });
      if (response.ok) toast.success("Webhook respondeu com sucesso!");
      else toast.error(`Webhook retornou status ${response.status}`);
    } catch {
      toast.error("Erro ao testar webhook — verifique a URL");
    }
    setTesting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
          <p className="text-muted-foreground">Conecte com suas ferramentas favoritas</p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />Novo webhook
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar webhook</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome (opcional)</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Zapier, HubSpot, CRM..." />
            </div>
            <div className="space-y-2">
              <Label>URL do webhook *</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required type="url" placeholder="https://hooks.zapier.com/..." />
              <p className="text-xs text-muted-foreground">A URL receberá um POST com os dados do lead em JSON</p>
            </div>
            <div className="space-y-2">
              <Label>Secret (opcional)</Label>
              <Input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="Um token para validar a autenticidade" />
              <p className="text-xs text-muted-foreground">Enviado no header X-Webhook-Secret</p>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar webhook
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Active webhooks */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Webhooks configurados</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Webhook className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum webhook configurado</p>
              <p className="text-xs text-muted-foreground mt-1">Configure um webhook para receber os dados dos leads automaticamente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {webhooks.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Webhook className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-card-foreground">{w.config?.name || "Webhook"}</p>
                        <p className="text-xs text-muted-foreground truncate">{w.config?.url}</p>
                        {w.config?.secret && <Badge variant="outline" className="text-xs mt-1">Com secret</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(w.id, w.config)}
                        disabled={testing === w.id}
                        className="gap-1"
                      >
                        {testing === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                        Testar
                      </Button>
                      <Switch checked={w.active} onCheckedChange={() => toggleWebhook(w.id, w.active)} />
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => deleteWebhook(w.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming integrations */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Em breve</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {UPCOMING_INTEGRATIONS.map((i, idx) => (
            <motion.div key={i.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className="h-full opacity-60">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i.icon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-card-foreground text-sm">{i.name}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">Em breve</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{i.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Plus, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardCards() {
  const { companyId } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ label: "", tag_uid: "" });
  const [saving, setSaving] = useState(false);

  const fetchCards = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("nfc_cards")
      .select("*, profiles(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    setCards(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, [companyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase.from("nfc_cards").insert({ ...form, company_id: companyId });
    setSaving(false);
    if (error) { toast.error("Erro ao criar cartão"); return; }
    toast.success("Cartão criado!");
    setDialogOpen(false);
    setForm({ label: "", tag_uid: "" });
    fetchCards();
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "inactive" : "active";
    await supabase.from("nfc_cards").update({ status: newStatus }).eq("id", id);
    fetchCards();
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Excluir este cartão?")) return;
    await supabase.from("nfc_cards").delete().eq("id", id);
    fetchCards();
    toast.success("Cartão excluído");
  };

  const filtered = cards.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()) || c.tag_uid.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cartões NFC</h1>
          <p className="text-muted-foreground">Gerencie seus cartões e tags NFC</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Novo cartão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar cartão NFC</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Nome do cartão *</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required placeholder="Ex: Cartão do João" /></div>
              <div className="space-y-2"><Label>UID da tag *</Label><Input value={form.tag_uid} onChange={(e) => setForm({ ...form, tag_uid: e.target.value })} required placeholder="Ex: 04:A2:B1:C3:D4:E5" /></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar cartão</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar cartão..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground truncate">UID: {c.tag_uid} {c.profiles?.name ? `• ${c.profiles.name}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: ptBR })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={c.status === "active"} onCheckedChange={() => toggleStatus(c.id, c.status)} />
                    <Button variant="ghost" size="icon" onClick={() => deleteCard(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum cartão encontrado</p>}
        </div>
      )}
    </div>
  );
}

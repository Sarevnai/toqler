import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Plus, Search, Trash2, Loader2, Link2, Copy, Lock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog, useConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import type { NfcCardWithProfile, Profile } from "@/types/entities";

const SLUG_REGEX = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;
const BASE_URL = "https://greattings.lovable.app/c/";

function generateSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function validateSlug(slug: string): string | null {
  if (!slug) return "Slug é obrigatório";
  if (slug.length < 3) return "Mínimo 3 caracteres";
  if (slug.length > 60) return "Máximo 60 caracteres";
  if (!SLUG_REGEX.test(slug)) return "Use apenas letras minúsculas, números, hífens e barras";
  return null;
}

export default function DashboardCards() {
  const { companyId } = useAuth();
  const [cards, setCards] = useState<NfcCardWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Pick<Profile, "id" | "name">[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ label: "", profile_id: "", slug: "" });
  const [slugError, setSlugError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    const [cardsRes, profilesRes] = await Promise.all([
      supabase.from("nfc_cards").select("*, profiles(name)").eq("company_id", companyId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name").eq("company_id", companyId).order("name"),
    ]);
    setCards((cardsRes.data as NfcCardWithProfile[]) ?? []);
    setProfiles(profilesRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [companyId]);

  const generateTagUid = () => {
    const bytes = Array.from({ length: 7 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase());
    return bytes.join(":");
  };

  const handleLabelChange = (label: string) => {
    const slug = generateSlug(label);
    setForm((f) => ({ ...f, label, slug }));
    setSlugError(validateSlug(slug));
  };

  const handleSlugChange = (slug: string) => {
    setForm((f) => ({ ...f, slug }));
    setSlugError(validateSlug(slug));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateSlug(form.slug);
    if (err) { setSlugError(err); return; }
    if (!companyId) return;
    setSaving(true);
    const tag_uid = generateTagUid();
    const insertData = {
      label: form.label,
      tag_uid,
      company_id: companyId,
      slug: form.slug,
      ...(form.profile_id ? { profile_id: form.profile_id } : {}),
    };
    const { error } = await supabase.from("nfc_cards").insert(insertData);
    setSaving(false);
    if (error) {
      if (error.code === "23505") { toast.error("Este slug já está em uso"); return; }
      toast.error("Erro ao criar cartão");
      return;
    }
    toast.success("Cartão criado!");
    setDialogOpen(false);
    setForm({ label: "", profile_id: "", slug: "" });
    setSlugError(null);
    fetchData();
  };

  const updateProfile = async (cardId: string, profileId: string | null) => {
    await supabase.from("nfc_cards").update({ profile_id: profileId }).eq("id", cardId);
    fetchData();
    toast.success("Perfil vinculado!");
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "inactive" : "active";
    await supabase.from("nfc_cards").update({ status: newStatus }).eq("id", id);
    fetchData();
  };

  const lockSlug = async (id: string) => {
    const confirmed = await confirm({
      title: "Travar slug",
      description: "Após travar, o slug não poderá mais ser alterado. Deseja continuar?",
      confirmLabel: "Travar",
    });
    if (!confirmed) return;
    await supabase.from("nfc_cards").update({ slug_locked: true }).eq("id", id);
    fetchData();
    toast.success("Slug travado!");
  };

  const deleteCard = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir cartão",
      description: "Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!confirmed) return;
    await supabase.from("nfc_cards").delete().eq("id", id);
    fetchData();
    toast.success("Cartão excluído");
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${BASE_URL}${slug}`);
    toast.success("Link copiado!");
  };

  const filtered = cards.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.tag_uid.toLowerCase().includes(search.toLowerCase()) ||
    (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <ConfirmDialog {...dialogProps} />

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
              <div className="space-y-2">
                <Label>Nome do cartão *</Label>
                <Input value={form.label} onChange={(e) => handleLabelChange(e.target.value)} required placeholder="Ex: Cartão do João" />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL personalizada) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">/c/</span>
                  <Input value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="empresa/joao-silva" />
                </div>
                {slugError && <p className="text-xs text-destructive">{slugError}</p>}
                {form.slug && !slugError && (
                  <p className="text-xs text-muted-foreground truncate">Link: {BASE_URL}{form.slug}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Vincular a um perfil</Label>
                <Select value={form.profile_id} onValueChange={(v) => setForm({ ...form, profile_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um perfil (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saving || !!slugError}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar cartão
              </Button>
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
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-card-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground truncate">UID: {c.tag_uid}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select value={c.profile_id || "none"} onValueChange={(v) => updateProfile(c.id, v === "none" ? null : v)}>
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <Link2 className="h-3 w-3 mr-1 shrink-0" />
                          <SelectValue placeholder="Vincular perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Switch checked={c.status === "active"} onCheckedChange={() => toggleStatus(c.id, c.status)} />
                      <Button variant="ghost" size="icon" onClick={() => deleteCard(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  {c.slug && (
                    <div className="flex items-center gap-2 sm:pl-14">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5 min-w-0 flex-1">
                        {c.slug_locked && <Lock className="h-3 w-3 shrink-0 text-primary" />}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{BASE_URL}{c.slug}</span>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={() => copyLink(c.slug!)}>
                        <Copy className="h-3 w-3" />Copiar
                      </Button>
                      {!c.slug_locked && (
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={() => lockSlug(c.id)}>
                          <Lock className="h-3 w-3" />Travar
                        </Button>
                      )}
                    </div>
                  )}
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

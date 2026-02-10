import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Plus, Eye, MousePointerClick, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function DashboardProfiles() {
  const { companyId } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role_title: "", bio: "", whatsapp: "", instagram: "", linkedin: "", website: "" });
  const [saving, setSaving] = useState(false);

  const fetchProfiles = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, [companyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").insert({ ...form, company_id: companyId });
    setSaving(false);
    if (error) { toast.error("Erro ao criar perfil"); return; }
    toast.success("Perfil criado!");
    setDialogOpen(false);
    setForm({ name: "", role_title: "", bio: "", whatsapp: "", instagram: "", linkedin: "", website: "" });
    fetchProfiles();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("profiles").update({ published: !current }).eq("id", id);
    fetchProfiles();
    toast.success(!current ? "Perfil publicado!" : "Perfil despublicado");
  };

  const deleteProfile = async (id: string) => {
    if (!confirm("Excluir este perfil?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    fetchProfiles();
    toast.success("Perfil excluído");
  };

  const filtered = profiles.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfis</h1>
          <p className="text-muted-foreground">Gerencie os perfis digitais da equipe</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Novo perfil</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar perfil</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Bio</Label><Input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
                <div className="space-y-2"><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
                <div className="space-y-2"><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
                <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar perfil
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar perfil..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden">
                <div className="aspect-[3/2] bg-muted flex items-center justify-center">
                  {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> : <User className="h-12 w-12 text-muted-foreground" />}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-card-foreground">{p.name}</p>
                      {p.role_title && <p className="text-xs text-muted-foreground">{p.role_title}</p>}
                    </div>
                    <button onClick={() => togglePublish(p.id, p.published)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors ${p.published ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {p.published ? "Publicado" : "Rascunho"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {p.published && (
                      <a href={`/p/${p.id}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1"><Eye className="h-3 w-3" />Ver</Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteProfile(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

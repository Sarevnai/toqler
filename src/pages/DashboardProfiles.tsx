import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Plus, Eye, Search, Trash2, Loader2, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ConfirmDialog, useConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import type { Profile } from "@/types/entities";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const emptyForm = { name: "", role_title: "", bio: "", email: "", whatsapp: "", instagram: "", linkedin: "", website: "", youtube: "", tiktok: "", github: "", twitter: "", pinterest: "", video_url: "" };

export default function DashboardProfiles() {
  const { companyId } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  const fetchProfiles = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, [companyId]);

  const openCreate = () => {
    setEditingProfile(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Profile) => {
    setEditingProfile(p);
    setForm({
      name: p.name || "",
      role_title: p.role_title || "",
      bio: p.bio || "",
      email: (p as any).email || "",
      whatsapp: p.whatsapp || "",
      instagram: p.instagram || "",
      linkedin: p.linkedin || "",
      website: p.website || "",
      youtube: (p as any).youtube || "",
      tiktok: (p as any).tiktok || "",
      github: (p as any).github || "",
      twitter: (p as any).twitter || "",
      pinterest: (p as any).pinterest || "",
      video_url: p.video_url || "",
    });
    setPhotoFile(null);
    setPhotoPreview(p.photo_url || null);
    setDialogOpen(true);
  };

  const uploadPhoto = async (profileId: string): Promise<string | null> => {
    if (!photoFile) return editingProfile?.photo_url || null;
    setUploadingPhoto(true);
    const ext = photoFile.name.split(".").pop();
    const path = `profiles/${profileId}/photo.${ext}`;
    const { error } = await supabase.storage.from("assets").upload(path, photoFile, { upsert: true });
    setUploadingPhoto(false);
    if (error) { toast.error("Erro ao enviar foto"); return editingProfile?.photo_url || null; }
    return `${SUPABASE_URL}/storage/v1/object/public/assets/${path}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);

    if (editingProfile) {
      const photo_url = await uploadPhoto(editingProfile.id);
      const { error } = await supabase.from("profiles").update({ ...form, photo_url }).eq("id", editingProfile.id);
      setSaving(false);
      if (error) { toast.error("Erro ao salvar perfil"); return; }
      toast.success("Perfil atualizado!");
    } else {
      const { data, error } = await supabase.from("profiles").insert({ ...form, company_id: companyId }).select("id").single();
      if (error || !data) { setSaving(false); toast.error("Erro ao criar perfil"); return; }
      if (photoFile) {
        const photo_url = await uploadPhoto(data.id);
        if (photo_url) await supabase.from("profiles").update({ photo_url }).eq("id", data.id);
      }
      setSaving(false);
      toast.success("Perfil criado!");
    }

    setDialogOpen(false);
    setForm(emptyForm);
    setEditingProfile(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    fetchProfiles();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("profiles").update({ published: !current }).eq("id", id);
    fetchProfiles();
    toast.success(!current ? "Perfil publicado!" : "Perfil despublicado");
  };

  const deleteProfile = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir perfil",
      description: "Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!confirmed) return;
    await supabase.from("profiles").delete().eq("id", id);
    fetchProfiles();
    toast.success("Perfil excluído");
  };

  const filtered = profiles.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <ConfirmDialog {...dialogProps} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfis</h1>
          <p className="text-muted-foreground">Gerencie os perfis digitais da equipe</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Novo perfil</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditingProfile(null); setPhotoFile(null); setPhotoPreview(null); } setDialogOpen(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingProfile ? "Editar perfil" : "Criar perfil"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => fileInputRef.current?.click()}>
                {photoPreview ? "Trocar foto" : "Adicionar foto"}
              </button>
            </div>

            <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Cargo</Label><Input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@empresa.com" /></div>
            <div className="space-y-2"><Label>URL do vídeo</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div className="space-y-2"><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
              <div className="space-y-2"><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
              <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div className="space-y-2"><Label>YouTube</Label><Input value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} placeholder="canal ou URL" /></div>
              <div className="space-y-2"><Label>TikTok</Label><Input value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} placeholder="@usuario" /></div>
              <div className="space-y-2"><Label>GitHub</Label><Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="usuario" /></div>
              <div className="space-y-2"><Label>X (Twitter)</Label><Input value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@usuario" /></div>
              <div className="space-y-2"><Label>Pinterest</Label><Input value={form.pinterest} onChange={(e) => setForm({ ...form, pinterest: e.target.value })} placeholder="usuario" /></div>
            </div>
            <Button type="submit" className="w-full" disabled={saving || uploadingPhoto}>
              {(saving || uploadingPhoto) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProfile ? "Salvar alterações" : "Criar perfil"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

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
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(p)}>
                      <Pencil className="h-3 w-3" />Editar
                    </Button>
                    {p.published && (
                      <a href={`/p/${p.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1"><Eye className="h-3 w-3" />Ver</Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteProfile(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-full">Nenhum perfil encontrado</p>}
        </div>
      )}
    </div>
  );
}

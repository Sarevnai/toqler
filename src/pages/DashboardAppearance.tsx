import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Save, GripVertical, User, MessageCircle, Instagram, Linkedin, Globe, Download, Send,
  Phone, Mail,
} from "lucide-react";
import { toast } from "sonner";

/* ── CTA / Social config ── */
const CTA_ICONS: Record<string, any> = { whatsapp: MessageCircle, instagram: Instagram, linkedin: Linkedin, website: Globe };
const CTA_LABELS: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", linkedin: "LinkedIn", website: "Website" };

/* ── Design tokens (matches PublicProfile) ── */
const T = {
  bg: "#f5f4f0",
  card: "#ffffff",
  accent: "#D4E84B",
  text1: "#1a1a1a",
  text2: "#6b6b6b",
  text3: "#999999",
  border: "#e8e8e5",
} as const;

/* ── Section toggle definitions ── */
const SECTION_TOGGLES: [string, string][] = [
  ["show_company_header", "Cabeçalho da empresa"],
  ["show_save_contact", "Botão Salvar Contato"],
  ["show_lead_form", "Botão Trocar Contato"],
  ["show_bio", "Seção Bio"],
  ["show_contact", "Seção Contato"],
  ["show_social", "Seção Social"],
  ["show_video", "Seção Vídeo"],
];

const defaultLayout = {
  show_company_header: true,
  show_save_contact: true,
  show_lead_form: true,
  show_bio: true,
  show_contact: true,
  show_social: true,
  show_video: true,
  cta_order: ["whatsapp", "instagram", "linkedin", "website"],
  // Keep legacy fields for DB compat
  layout_style: "card",
  button_style: "rounded",
  font_style: "default",
  background_style: "solid",
  show_stats_row: true,
};

export default function DashboardAppearance() {
  const { companyId } = useAuth();
  const [layout, setLayout] = useState<any>(defaultLayout);
  const [company, setCompany] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [previewProfile, setPreviewProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [layoutId, setLayoutId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      setLoading(true);
      const [layoutRes, companyRes, profilesRes] = await Promise.all([
        supabase.from("profile_layouts").select("*").eq("company_id", companyId).maybeSingle(),
        supabase.from("companies").select("*").eq("id", companyId).single(),
        supabase.from("profiles").select("*").eq("company_id", companyId).limit(5),
      ]);
      if (layoutRes.data) {
        setLayout({ ...defaultLayout, ...layoutRes.data });
        setLayoutId(layoutRes.data.id);
      }
      setCompany(companyRes.data);
      setProfiles(profilesRes.data ?? []);
      if (profilesRes.data?.[0]) setPreviewProfile(profilesRes.data[0]);
      setLoading(false);
    };
    fetch();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    const payload = {
      company_id: companyId,
      layout_style: layout.layout_style,
      button_style: layout.button_style,
      font_style: layout.font_style,
      background_style: layout.background_style,
      show_company_header: layout.show_company_header,
      show_save_contact: layout.show_save_contact,
      show_lead_form: layout.show_lead_form,
      show_stats_row: layout.show_stats_row,
      show_bio: layout.show_bio,
      show_contact: layout.show_contact,
      show_social: layout.show_social,
      show_video: layout.show_video,
      cta_order: layout.cta_order,
    };

    if (layoutId) {
      const { error } = await supabase.from("profile_layouts").update(payload).eq("id", layoutId);
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("profile_layouts").insert(payload).select("id").single();
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return; }
      setLayoutId(data.id);
    }
    setSaving(false);
    toast.success("Aparência salva!");
  };

  const moveCTA = (index: number, direction: "up" | "down") => {
    const order = [...layout.cta_order];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    setLayout({ ...layout, cta_order: order });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const ctaOrder = layout.cta_order as string[];
  const p = previewProfile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aparência</h1>
        <p className="text-muted-foreground">Personalize a aparência dos perfis públicos</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* ── Editor controls ── */}
        <div className="space-y-4">
          {/* Section toggles */}
          <Card>
            <CardHeader><CardTitle className="text-base">Seções visíveis</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {SECTION_TOGGLES.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch checked={layout[key]} onCheckedChange={(v) => setLayout({ ...layout, [key]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CTA order */}
          <Card>
            <CardHeader><CardTitle className="text-base">Ordem dos ícones sociais</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ctaOrder.map((cta, i) => {
                const Icon = CTA_ICONS[cta] || Globe;
                return (
                  <div key={cta} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Icon className="h-4 w-4" />
                    <span className="text-sm flex-1">{CTA_LABELS[cta]}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => moveCTA(i, "up")} className="h-7 w-7 p-0">↑</Button>
                      <Button variant="ghost" size="sm" disabled={i === ctaOrder.length - 1} onClick={() => moveCTA(i, "down")} className="h-7 w-7 p-0">↓</Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar aparência
          </Button>
        </div>

        {/* ── Live preview (miniature of new card) ── */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview</CardTitle>
                {profiles.length > 1 && (
                  <Select value={previewProfile?.id} onValueChange={(v) => setPreviewProfile(profiles.find((pp) => pp.id === v))}>
                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{profiles.map((pp) => <SelectItem key={pp.id} value={pp.id}>{pp.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-lg overflow-hidden" style={{ background: T.bg }}>
                {/* Hero */}
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 3.2", background: "#2a2a2a" }}>
                  {p?.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-full h-full object-cover object-[center_20%]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="h-10 w-10" style={{ color: T.text3 }} /></div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%)" }} />
                </div>

                {/* Card body */}
                <div className="relative z-10 -mt-4 rounded-t-xl px-4 pt-5 pb-3" style={{ background: T.card }}>
                  <h2 className="font-display text-xl font-semibold leading-tight" style={{ color: T.text1 }}>{p?.name || "Nome do perfil"}</h2>
                  {p?.role_title && (
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: T.text2 }}>
                      {p.role_title}{company ? ` at ${company.name}` : ""}
                    </p>
                  )}

                  {/* Brand row */}
                  {layout.show_company_header && company && (
                    <div className="flex items-center justify-between mt-3 pb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                      {company.logo_url ? <img src={company.logo_url} alt="" className="h-4 opacity-85" /> : <span className="text-[9px] font-medium" style={{ color: T.text2 }}>{company.name}</span>}
                      <span className="text-[8px] italic" style={{ color: T.text2 }}>We connect. For real.</span>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {layout.show_save_contact && (
                      <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-semibold" style={{ border: `1px solid ${T.border}`, color: T.text1 }}>
                        <Download className="w-3 h-3" /> Salvar
                      </div>
                    )}
                    {layout.show_lead_form && (
                      <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-semibold" style={{ background: T.accent, color: T.text1 }}>
                        <Send className="w-3 h-3" /> Trocar
                      </div>
                    )}
                  </div>
                </div>

                {/* Sections */}
                <div className="px-3 pb-4 space-y-2" style={{ background: T.bg }}>
                  {/* Bio */}
                  {layout.show_bio && p?.bio && (
                    <div className="rounded-lg p-3 shadow-sm" style={{ background: T.card }}>
                      <p className="text-[9px] font-bold mb-1" style={{ color: T.text1 }}>Minha Bio</p>
                      <p className="text-[8px] leading-relaxed line-clamp-2" style={{ color: T.text2 }}>{p.bio}</p>
                    </div>
                  )}

                  {/* Contact */}
                  {layout.show_contact && p?.whatsapp && (
                    <div className="rounded-lg p-3 shadow-sm" style={{ background: T.card }}>
                      <p className="text-[9px] font-bold mb-1" style={{ color: T.text1 }}>Contato</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: T.bg }}><Phone className="w-3 h-3" style={{ color: T.text1 }} /></div>
                        <span className="text-[8px]" style={{ color: T.text2 }}>{p.whatsapp}</span>
                      </div>
                    </div>
                  )}

                  {/* Social */}
                  {layout.show_social && (
                    <div className="rounded-lg p-3 shadow-sm" style={{ background: T.card }}>
                      <p className="text-[9px] font-bold mb-1" style={{ color: T.text1 }}>Social</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {ctaOrder.map((key) => {
                          const Icon = CTA_ICONS[key] || Globe;
                          return (
                            <div key={key} className="flex flex-col items-center gap-1 py-2 rounded" style={{ background: T.bg }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: T.text1 }} />
                              <span className="text-[6px] uppercase tracking-wider" style={{ color: T.text2 }}>{CTA_LABELS[key]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Video */}
                  {layout.show_video && p?.video_url && (
                    <div className="rounded-lg overflow-hidden shadow-sm" style={{ background: T.card }}>
                      <div className="w-full aspect-video bg-muted flex items-center justify-center">
                        <span className="text-[9px]" style={{ color: T.text3 }}>▶ Vídeo</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {!company?.hide_branding && (
                  <div className="text-center py-3" style={{ background: T.bg }}>
                    <span className="text-[7px] uppercase tracking-wider" style={{ color: T.text3 }}>Powered by Toqler</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

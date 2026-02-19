import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Loader2, Save, GripVertical, User, Globe, Download, Send,
  Phone, Mail, Upload, X, ImageIcon, ChevronDown } from
"lucide-react";
import { toast } from "sonner";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import LinkedInIcon from "@/components/icons/LinkedInIcon";
import InstagramIcon from "@/components/icons/InstagramIcon";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";
import GitHubIcon from "@/components/icons/GitHubIcon";
import XIcon from "@/components/icons/XIcon";
import PinterestIcon from "@/components/icons/PinterestIcon";
import ColorInput from "@/components/dashboard/ColorInput";
import { buildTokens } from "@/lib/color-utils";

/* ── CTA / Social config ── */
const CTA_ICONS: Record<string, any> = { whatsapp: WhatsAppIcon, instagram: InstagramIcon, linkedin: LinkedInIcon, website: Globe, youtube: YouTubeIcon, tiktok: TikTokIcon, github: GitHubIcon, twitter: XIcon, pinterest: PinterestIcon };
const CTA_LABELS: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", linkedin: "LinkedIn", website: "Website", youtube: "YouTube", tiktok: "TikTok", github: "GitHub", twitter: "X (Twitter)", pinterest: "Pinterest" };

/* ── Font options ── */
const FONT_OPTIONS = [
{ value: "Inter", label: "Inter" },
{ value: "DM Sans", label: "DM Sans" },
{ value: "Playfair Display", label: "Playfair Display" },
{ value: "JetBrains Mono", label: "JetBrains Mono" }];

/* ── Section toggle definitions ── */
const SECTION_TOGGLES: [string, string][] = [
["show_company_header", "Cabeçalho da empresa"],
["show_save_contact", "Botão Salvar Contato"],
["show_lead_form", "Botão Trocar Contato"],
["show_bio", "Seção Bio"],
["show_contact", "Seção Contato"],
["show_social", "Seção Social"],
["show_video", "Seção Vídeo"]];


const defaultLayout = {
  show_company_header: true,
  show_save_contact: true,
  show_lead_form: true,
  show_bio: true,
  show_contact: true,
  show_social: true,
  show_video: true,
  cta_order: ["whatsapp", "instagram", "linkedin", "website", "youtube", "tiktok", "github", "twitter", "pinterest"],
  layout_style: "card",
  button_style: "rounded",
  font_style: "default",
  background_style: "solid",
  show_stats_row: true,
  accent_color: "#D4E84B",
  bg_color: "#f5f4f0",
  card_color: "#ffffff",
  text_color: "#1a1a1a",
  font_family: "Inter",
  button_color: "#D4E84B",
  button_text_color: "#1a1a1a",
  icon_bg_color: "#f5f4f0",
  icon_color: "#1a1a1a",
  cover_url: null as string | null,
  bg_image_url: null as string | null
};

/* ── Collapsible Section helper ── */
function BrandSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-1 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function DashboardAppearance() {
  const { companyId } = useAuth();
  const [layout, setLayout] = useState<any>(defaultLayout);
  const [company, setCompany] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [previewProfile, setPreviewProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const fetchLayout = async () => {
      setLoading(true);
      try {
        const [layoutRes, companyRes, profilesRes] = await Promise.all([
        supabase.from("profile_layouts").select("*").eq("company_id", companyId).maybeSingle(),
        supabase.from("companies").select("*").eq("id", companyId).single(),
        supabase.from("profiles").select("*").eq("company_id", companyId).limit(5)]
        );
        if (layoutRes.error || companyRes.error) {
          console.error("Appearance load error:", layoutRes.error, companyRes.error);
          toast.error("Erro ao carregar aparência.");
        }
        if (layoutRes.data) {
          const savedOrder = layoutRes.data.cta_order as string[] || [];
          const allNetworks = defaultLayout.cta_order;
          const mergedOrder = [
          ...savedOrder,
          ...allNetworks.filter((n) => !savedOrder.includes(n))];

          setLayout({ ...defaultLayout, ...layoutRes.data, cta_order: mergedOrder });
          setLayoutId(layoutRes.data.id);
        }
        setCompany(companyRes.data);
        setProfiles(profilesRes.data ?? []);
        if (profilesRes.data?.[0]) setPreviewProfile(profilesRes.data[0]);
      } catch (err) {
        console.error("Appearance fetch error:", err);
        toast.error("Erro ao carregar aparência.");
      }
      setLoading(false);
    };
    fetchLayout();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
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
        accent_color: layout.accent_color,
        bg_color: layout.bg_color,
        card_color: layout.card_color,
        text_color: layout.text_color,
        font_family: layout.font_family,
        button_color: layout.button_color,
        button_text_color: layout.button_text_color,
        icon_bg_color: layout.icon_bg_color,
        icon_color: layout.icon_color,
        cover_url: layout.cover_url || null,
        bg_image_url: layout.bg_image_url || null
      };

      if (company) {
        await supabase.from("companies").update({ tagline: company.tagline }).eq("id", companyId);
      }

      if (layoutId) {
        const { error } = await supabase.from("profile_layouts").update(payload).eq("id", layoutId);
        if (error) {toast.error("Erro ao salvar aparência");setSaving(false);return;}
      } else {
        const { data, error } = await supabase.from("profile_layouts").insert(payload).select("id").single();
        if (error) {toast.error("Erro ao salvar aparência");setSaving(false);return;}
        setLayoutId(data.id);
      }
      toast.success("Aparência salva!");
    } catch (err) {
      console.error("Appearance save error:", err);
      toast.error("Erro ao salvar aparência.");
    }
    setSaving(false);
  };

  const moveCTA = (index: number, direction: "up" | "down") => {
    const order = [...layout.cta_order];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    setLayout({ ...layout, cta_order: order });
  };
  const handleImageUpload = async (file: File, field: "cover_url" | "bg_image_url") => {
    if (!companyId) return;
    const setter = field === "cover_url" ? setUploadingCover : setUploadingBg;
    setter(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${companyId}/${field}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao fazer upload"); setter(false); return; }
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
    setLayout({ ...layout, [field]: urlData.publicUrl });
    setter(false);
  };

  const removeImage = (field: "cover_url" | "bg_image_url") => {
    setLayout({ ...layout, [field]: null });
  };

  const ctaOrder = layout.cta_order as string[];
  const p = previewProfile;
  const T = buildTokens(layout);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aparência</h1>
        <p className="text-muted-foreground">Personalize a aparência dos perfis públicos</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* ── Editor controls ── */}
        <div className="space-y-4">
          {/* Brand Kit - 5 collapsible sections */}
          <Card>
            <CardHeader><CardTitle className="text-base">Kit de Marca</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {/* 1. Fundo */}
              <BrandSection title="Fundo" defaultOpen>
                <ColorInput label="Cor de fundo" value={layout.bg_color} onChange={(hex) => setLayout({ ...layout, bg_color: hex })} />
                <p className="text-xs text-muted-foreground">Background da página</p>
                {/* Background image inline */}
                <Label className="text-sm">Imagem de fundo</Label>
                <p className="text-xs text-muted-foreground">Textura ou imagem com overlay para legibilidade</p>
                {layout.bg_image_url ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={layout.bg_image_url} alt="Fundo" className="w-full h-24 object-cover" />
                    <button onClick={() => removeImage("bg_image_url")} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-20 rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    {uploadingBg ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                      <>
                        <ImageIcon className="h-5 w-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Clique para fazer upload</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "bg_image_url"); }} />
                  </label>
                )}
              </BrandSection>

              <div className="border-t border-border" />

              {/* 2. Cards */}
              <BrandSection title="Cards">
                <ColorInput label="Cor dos cards" value={layout.card_color} onChange={(hex) => setLayout({ ...layout, card_color: hex })} />
                <p className="text-xs text-muted-foreground">Cards de bio, contato, social</p>
              </BrandSection>

              <div className="border-t border-border" />

              {/* 3. Botões (ícones) */}
              <BrandSection title="Botões (ícones)">
                <ColorInput label="Cor de fundo dos ícones" value={layout.icon_bg_color} onChange={(hex) => setLayout({ ...layout, icon_bg_color: hex })} />
                <p className="text-xs text-muted-foreground">Fundo dos ícones de contato e redes sociais</p>
                <ColorInput label="Cor dos ícones" value={layout.icon_color} onChange={(hex) => setLayout({ ...layout, icon_color: hex })} />
                <p className="text-xs text-muted-foreground">Cor dos ícones em si</p>
              </BrandSection>

              <div className="border-t border-border" />

              {/* 4. CTA */}
              <BrandSection title="CTA">
                <ColorInput label="Cor dos botões CTA" value={layout.button_color} onChange={(hex) => setLayout({ ...layout, button_color: hex })} />
                <p className="text-xs text-muted-foreground">Fundo dos botões Salvar/Trocar Contato</p>
                <ColorInput label="Cor do texto CTA" value={layout.button_text_color} onChange={(hex) => setLayout({ ...layout, button_text_color: hex })} />
                <p className="text-xs text-muted-foreground">Texto dentro dos botões</p>
              </BrandSection>

              <div className="border-t border-border" />

              {/* 5. Textos */}
              <BrandSection title="Textos">
                <ColorInput label="Cor do texto" value={layout.text_color} onChange={(hex) => setLayout({ ...layout, text_color: hex })} />
                <p className="text-xs text-muted-foreground">Textos principais e títulos</p>
                <ColorInput label="Cor de acento" value={layout.accent_color} onChange={(hex) => setLayout({ ...layout, accent_color: hex })} />
                <p className="text-xs text-muted-foreground">Destaques e acentos</p>
              </BrandSection>

              <div className="border-t border-border" />

              {/* Font */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-sm">Fonte</Label>
                <Select value={layout.font_family} onValueChange={(v) => setLayout({ ...layout, font_family: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) =>
                    <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                        {f.label}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tagline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Tagline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Texto da tagline</Label>
                <textarea
                   className="flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                   rows={2}
                   value={company?.tagline || ""}
                   onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                   placeholder="We connect. For real." />
              </div>
            </CardContent>
          </Card>

          {/* Section toggles */}
          <Card>
            <CardHeader><CardTitle className="text-base">Seções visíveis</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {SECTION_TOGGLES.map(([key, label]) =>
              <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch checked={layout[key]} onCheckedChange={(v) => setLayout({ ...layout, [key]: v })} />
                </div>
              )}
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
                  </div>);
              })}
            </CardContent>
          </Card>

          {/* Cover photo */}
          <Card>
            <CardHeader><CardTitle className="text-base">Foto de Capa</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Banner no topo do perfil, atrás da foto de perfil</p>
              {layout.cover_url ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={layout.cover_url} alt="Capa" className="w-full h-32 object-cover" />
                  <button onClick={() => removeImage("cover_url")} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  {uploadingCover ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Clique para fazer upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "cover_url"); }} />
                </label>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar aparência
          </Button>
        </div>

        {/* ── Live preview ── */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview</CardTitle>
                {profiles.length > 1 &&
                <Select value={previewProfile?.id} onValueChange={(v) => setPreviewProfile(profiles.find((pp) => pp.id === v))}>
                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{profiles.map((pp) => <SelectItem key={pp.id} value={pp.id}>{pp.name}</SelectItem>)}</SelectContent>
                  </Select>
                }
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-lg overflow-hidden relative" style={{ background: T.bg, fontFamily: layout.font_family }}>
                {/* BG image overlay */}
                {layout.bg_image_url && (
                  <>
                    <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${layout.bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div className="absolute inset-0 z-0" style={{ background: T.bg, opacity: 0.85 }} />
                  </>
                )}

                {/* Hero - Cover + Profile Photo */}
                {layout.cover_url ? (
                  <>
                    {/* Cover banner */}
                    <div className="relative z-[1] w-full overflow-hidden" style={{ aspectRatio: "16 / 7" }}>
                      <img src={layout.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    {/* Profile photo overlapping */}
                    <div className="relative z-[2] flex justify-center -mt-28">
                      <div className="w-56 h-56 rounded-2xl overflow-hidden border-4 shadow-lg" style={{ borderColor: T.bg, background: "#2a2a2a" }}>
                        {p?.photo_url ? (
                          <img src={p.photo_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: `${(p as any).photo_offset_x ?? 50}% ${(p as any).photo_offset_y ?? 30}%` }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><User className="h-8 w-8" style={{ color: T.text3 }} /></div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="relative z-[1] w-full overflow-hidden" style={{ aspectRatio: "4 / 3.2", background: "#2a2a2a" }}>
                    {p?.photo_url ? (
                      <img src={p.photo_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: `${(p as any).photo_offset_x ?? 50}% ${(p as any).photo_offset_y ?? 30}%` }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User className="h-10 w-10" style={{ color: T.text3 }} /></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none" style={{ background: `linear-gradient(to top, ${T.bg} 0%, transparent 100%)` }} />
                    <div className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none" style={{ background: `linear-gradient(to top, ${T.bg} 20%, transparent 100%)` }} />
                  </div>
                )}

                {/* Card body */}
                <div className={`relative z-10 rounded-2xl pt-5 pb-3 px-[25px] mx-[16px] mb-[17px] py-0 my-[34px] ${layout.cover_url ? "mt-3" : "-mt-4"}`} style={{ background: T.card, position: "relative", zIndex: 1 }}>
                  <h2 className="font-display text-xl font-semibold leading-tight" style={{ color: T.text1 }}>{p?.name || "Nome do perfil"}</h2>
                  {p?.role_title &&
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: T.text2 }}>
                      {p.role_title}{company ? ` at ${company.name}` : ""}
                    </p>
                  }

                  {layout.show_company_header && company &&
                   <div className="flex items-center justify-between gap-2 mt-3 pb-3" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
                      {company.logo_url ? <img src={company.logo_url} alt="" className="h-40 opacity-85 shrink-0" /> : <span className="text-[9px] font-medium shrink-0" style={{ color: T.text2 }}>{company.name}</span>}
                      {company.tagline && <span className="text-[8px] italic text-right whitespace-pre-line" style={{ color: T.text2 }}>{company.tagline}</span>}
                    </div>
                  }

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {layout.show_save_contact &&
                    <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-semibold" style={{ border: `1px solid ${T.cardBorder}`, background: T.card, color: T.buttonText }}>
                        <Download className="w-3 h-3" /> Salvar
                      </div>
                    }
                    {layout.show_lead_form &&
                    <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-semibold" style={{ background: T.button, color: T.buttonText }}>
                        <Send className="w-3 h-3" /> Trocar
                      </div>
                    }
                  </div>
                </div>

                {/* Sections */}
                <div className="relative z-[1] px-3 pb-4 space-y-2" style={{ background: layout.bg_image_url ? "transparent" : T.bg }}>
                  {layout.show_bio && p?.bio &&
                  <div className="rounded-lg p-3 shadow-sm" style={{ background: T.card }}>
                      <p className="text-[9px] font-bold mb-1" style={{ color: T.text1 }}>Minha Bio</p>
                      <p className="text-[8px] leading-relaxed line-clamp-2" style={{ color: T.text2 }}>{p.bio}</p>
                    </div>
                  }

                  {layout.show_contact && (p?.whatsapp || p?.email) &&
                  <div className="rounded-lg p-3 shadow-sm" style={{ background: T.card }}>
                      <p className="text-[9px] font-bold mb-1" style={{ color: T.text1 }}>Contato</p>
                      <div className="flex flex-col gap-1.5">
                        {p?.whatsapp &&
                      <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: T.iconBg }}><Phone className="w-3 h-3" style={{ color: T.iconColor }} /></div>
                            <span className="text-[8px]" style={{ color: T.text2 }}>{p.whatsapp}</span>
                          </div>
                      }
                        {p?.email &&
                      <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: T.iconBg }}><Mail className="w-3 h-3" style={{ color: T.iconColor }} /></div>
                            <span className="text-[8px]" style={{ color: T.text2 }}>{p.email}</span>
                          </div>
                      }
                      </div>
                    </div>
                  }

                  {layout.show_social &&
                  <div className="rounded-lg p-3 shadow-sm" style={{ background: T.card }}>
                      <p className="text-[9px] font-bold mb-1" style={{ color: T.text1 }}>Social</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {ctaOrder.filter((key) => p?.[key]).map((key) => {
                        const Icon = CTA_ICONS[key] || Globe;
                        return (
                          <div key={key} className="flex items-center justify-center py-2 rounded" style={{ background: T.iconBg }}>
                              <Icon className="w-[18px] h-[18px]" style={{ color: T.iconColor }} />
                            </div>);
                      })}
                      </div>
                    </div>
                  }

                  {layout.show_video && p?.video_url &&
                  <div className="rounded-lg overflow-hidden shadow-sm" style={{ background: T.card }}>
                      <div className="w-full aspect-video bg-muted flex items-center justify-center">
                        <span className="text-[9px]" style={{ color: T.text3 }}>▶ Vídeo</span>
                      </div>
                    </div>
                  }
                </div>

                {!company?.hide_branding &&
                <div className="text-center py-3" style={{ background: T.bg }}>
                    <span className="text-[7px] uppercase tracking-wider" style={{ color: T.text3 }}>Powered by Toqler</span>
                  </div>
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

}

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, GripVertical, User, MessageCircle, Instagram, Linkedin, Globe, Download, Wifi } from "lucide-react";
import { toast } from "sonner";

const CTA_ICONS: Record<string, any> = { whatsapp: MessageCircle, instagram: Instagram, linkedin: Linkedin, website: Globe };
const CTA_LABELS: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", linkedin: "LinkedIn", website: "Website" };
const CTA_COLORS: Record<string, string> = { whatsapp: "bg-green-500", instagram: "bg-pink-500", linkedin: "bg-blue-600", website: "bg-primary" };

const LAYOUT_OPTIONS = [
  { value: "card", label: "Card" },
  { value: "minimal", label: "Minimalista" },
  { value: "bold", label: "Destaque" },
];
const BUTTON_OPTIONS = [
  { value: "rounded", label: "Arredondado" },
  { value: "square", label: "Quadrado" },
  { value: "pill", label: "Pílula" },
];
const FONT_OPTIONS = [
  { value: "default", label: "Padrão" },
  { value: "serif", label: "Serifada" },
  { value: "mono", label: "Monoespaçada" },
];
const BG_OPTIONS = [
  { value: "solid", label: "Sólido" },
  { value: "gradient", label: "Gradiente" },
  { value: "mesh", label: "Mesh" },
];

const defaultLayout = {
  layout_style: "card",
  button_style: "rounded",
  font_style: "default",
  background_style: "solid",
  show_company_header: true,
  show_save_contact: true,
  show_lead_form: true,
  show_stats_row: true,
  cta_order: ["whatsapp", "instagram", "linkedin", "website"],
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

  const primaryColor = company?.primary_color || "#0ea5e9";
  const fontClass = layout.font_style === "serif" ? "font-serif" : layout.font_style === "mono" ? "font-mono" : "font-sans";
  const btnRadius = layout.button_style === "pill" ? "rounded-full" : layout.button_style === "square" ? "rounded-none" : "rounded-xl";
  const bgStyle = layout.background_style === "gradient"
    ? { background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }
    : layout.background_style === "mesh"
      ? { background: `radial-gradient(circle at 20% 50%, ${primaryColor}10, transparent 50%), radial-gradient(circle at 80% 50%, ${primaryColor}08, transparent 50%)` }
      : {};

  const ctaOrder = layout.cta_order as string[];
  const p = previewProfile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aparência</h1>
        <p className="text-muted-foreground">Personalize a aparência dos perfis públicos</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Editor controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Estilo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select value={layout.layout_style} onValueChange={(v) => setLayout({ ...layout, layout_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LAYOUT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Botões</Label>
                  <Select value={layout.button_style} onValueChange={(v) => setLayout({ ...layout, button_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BUTTON_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fonte</Label>
                  <Select value={layout.font_style} onValueChange={(v) => setLayout({ ...layout, font_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FONT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fundo</Label>
                  <Select value={layout.background_style} onValueChange={(v) => setLayout({ ...layout, background_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BG_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Seções visíveis</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {([
                ["show_company_header", "Cabeçalho da empresa"],
                ["show_save_contact", "Botão Salvar Contato"],
                ["show_lead_form", "Formulário de lead"],
                ["show_stats_row", "Estatísticas"],
              ] as [string, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch checked={layout[key]} onCheckedChange={(v) => setLayout({ ...layout, [key]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Ordem dos CTAs</CardTitle></CardHeader>
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

        {/* Live preview */}
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
              <div
                className={`${fontClass} p-4 space-y-4 rounded-b-lg min-h-[500px]`}
                style={bgStyle}
              >
                {/* Company header */}
                {layout.show_company_header && company && (
                  <div className="text-center">
                    {company.logo_url && <img src={company.logo_url} alt="" className="h-6 mx-auto mb-1" />}
                    <p className="text-[10px] text-muted-foreground">{company.name}</p>
                  </div>
                )}

                {/* Photo */}
                <div className={`aspect-[4/5] ${btnRadius} overflow-hidden bg-muted`}>
                  {p?.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="h-12 w-12 text-muted-foreground" /></div>
                  )}
                </div>

                {/* Name */}
                <div>
                  <h2 className="text-lg font-bold text-foreground">{p?.name || "Nome do perfil"}</h2>
                  {p?.role_title && <p className="text-xs text-muted-foreground">{p.role_title}</p>}
                  {p?.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio}</p>}
                </div>

                {/* Save contact */}
                {layout.show_save_contact && (
                  <div
                    className={`w-full py-2.5 text-center text-sm font-medium text-primary-foreground ${btnRadius}`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Download className="inline h-3.5 w-3.5 mr-1.5" />Salvar Contato
                  </div>
                )}

                {/* CTAs */}
                <div className="space-y-2">
                  {ctaOrder.map((type) => {
                    const Icon = CTA_ICONS[type] || Globe;
                    return (
                      <div key={type} className={`flex items-center gap-3 p-3 ${btnRadius} border border-border`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground ${CTA_COLORS[type]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{CTA_LABELS[type]}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Lead form */}
                {layout.show_lead_form && (
                  <div className={`border border-border ${btnRadius} p-4 space-y-2`}>
                    <p className="text-sm font-semibold">Deixe seu contato</p>
                    <div className="space-y-1.5">
                      <div className="h-8 bg-muted rounded" />
                      <div className="h-8 bg-muted rounded" />
                      <div
                        className={`h-8 text-center text-xs text-primary-foreground flex items-center justify-center ${btnRadius}`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        Enviar
                      </div>
                    </div>
                  </div>
                )}

                {/* Branding */}
                {!company?.hide_branding && (
                  <div className="text-center pt-2">
                    <span className="text-[10px] text-muted-foreground/50 inline-flex items-center gap-1">
                      <Wifi className="h-2.5 w-2.5" />Powered by Greattings
                    </span>
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

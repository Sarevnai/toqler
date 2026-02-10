import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, MessageCircle, Instagram, Linkedin, Globe, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

/**
 * Extracts a safe embed URL from YouTube or Vimeo links.
 * Returns null for unsupported URLs.
 */
function getSafeVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be") {
      let videoId: string | null = null;
      if (parsed.hostname === "youtu.be") {
        videoId = parsed.pathname.slice(1);
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1]?.split(/[?/]/)[0];
      } else {
        videoId = parsed.searchParams.get("v");
      }
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    // Vimeo: vimeo.com/ID, player.vimeo.com/video/ID
    if (parsed.hostname.includes("vimeo.com")) {
      const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }
  } catch {
    // Invalid URL
  }
  return null;
}

const leadSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().max(20).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Consentimento obrigatório" }) }),
});

const CTA_ICONS: Record<string, typeof MessageCircle> = { whatsapp: MessageCircle, instagram: Instagram, linkedin: Linkedin, website: Globe };
const CTA_COLORS: Record<string, string> = { whatsapp: "bg-green-500", instagram: "bg-pink-500", linkedin: "bg-blue-600" };
const CTA_LABELS: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", linkedin: "LinkedIn", website: "Website" };

function getDevice(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export default function PublicProfile() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [layout, setLayout] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", consent: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    const fetch = async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", profileId).eq("published", true).maybeSingle();
      if (!p) { setLoading(false); return; }
      setProfile(p);

      const [layoutRes, companyRes] = await Promise.all([
        supabase.from("profile_layouts").select("*").eq("company_id", p.company_id).maybeSingle(),
        supabase.from("companies").select("*").eq("id", p.company_id).maybeSingle(),
      ]);
      setLayout(layoutRes.data);
      setCompany(companyRes.data);
      setLoading(false);

      // Track view
      const urlParams = new URLSearchParams(window.location.search);
      await supabase.from("events").insert({
        event_type: "profile_view",
        profile_id: p.id,
        company_id: p.company_id,
        device: getDevice(),
        source: urlParams.get("utm_source") || null,
      });
    };
    fetch();
  }, [profileId]);

  const trackCTA = async (ctaType: string) => {
    if (!profile) return;
    await supabase.from("events").insert({
      event_type: "cta_click",
      profile_id: profile.id,
      company_id: profile.company_id,
      cta_type: ctaType,
      device: getDevice(),
    });
  };

  const handleCTA = (type: string) => {
    trackCTA(type);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/${profile.whatsapp?.replace(/\D/g, "")}`,
      instagram: `https://instagram.com/${profile.instagram?.replace("@", "")}`,
      linkedin: profile.linkedin?.startsWith("http") ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`,
      website: profile.website?.startsWith("http") ? profile.website : `https://${profile.website}`,
    };
    if (urls[type]) window.open(urls[type], "_blank");
  };

  const generateVCard = () => {
    trackCTA("save_contact");
    const vcard = [
      "BEGIN:VCARD", "VERSION:3.0",
      `FN:${profile.name}`,
      profile.role_title ? `TITLE:${profile.role_title}` : "",
      company?.name ? `ORG:${company.name}` : "",
      profile.whatsapp ? `TEL;TYPE=CELL:${profile.whatsapp}` : "",
      profile.website ? `URL:${profile.website}` : "",
      profile.linkedin ? `X-SOCIALPROFILE;type=linkedin:${profile.linkedin}` : "",
      "END:VCARD",
    ].filter(Boolean).join("\n");
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(leadForm);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    setSubmitting(true);
    const leadData = {
      company_id: profile.company_id,
      profile_id: profile.id,
      name: leadForm.name.trim(),
      email: leadForm.email.trim(),
      phone: leadForm.phone?.trim() || null,
      consent: true,
    };
    const { data: insertedLead, error } = await supabase.from("leads").insert(leadData).select("id").single();
    await supabase.from("events").insert({
      event_type: "lead_submit",
      profile_id: profile.id,
      company_id: profile.company_id,
      device: getDevice(),
    });

    // Dispatch webhooks and follow-up email using lead_id (fire and forget)
    if (insertedLead?.id) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const payload = JSON.stringify({ lead_id: insertedLead.id });
      const headers = { "Content-Type": "application/json", apikey };
      fetch(`${supabaseUrl}/functions/v1/webhook-dispatcher`, { method: "POST", headers, body: payload }).catch(() => {});
      fetch(`${supabaseUrl}/functions/v1/send-follow-up`, { method: "POST", headers, body: payload }).catch(() => {});
    }

    setSubmitting(false);
    if (error) { toast.error("Erro ao enviar"); return; }
    toast.success("Contato enviado com sucesso!");
    setLeadForm({ name: "", email: "", phone: "", consent: false });
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Perfil não encontrado</p></div>;

  // Layout settings
  const showSaveContact = layout?.show_save_contact !== false;
  const showLeadForm = layout?.show_lead_form !== false;
  const showCompanyHeader = layout?.show_company_header !== false;
  const hideBranding = company?.hide_branding;
  const ctaOrder = (layout?.cta_order as string[] | null) ?? ["whatsapp", "instagram", "linkedin", "website"];
  const availableCTAs = ctaOrder.filter((t: string) => profile[t]);

  // Style settings
  const primaryColor = company?.primary_color || "#0ea5e9";
  const fontStyle = layout?.font_style || "default";
  const buttonStyle = layout?.button_style || "rounded";
  const backgroundStyle = layout?.background_style || "solid";

  const fontClass = fontStyle === "serif" ? "font-serif" : fontStyle === "mono" ? "font-mono" : "font-sans";
  const btnRadius = buttonStyle === "pill" ? "rounded-full" : buttonStyle === "square" ? "rounded-none" : "rounded-xl";

  const bgStyle: React.CSSProperties = backgroundStyle === "gradient"
    ? { background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }
    : backgroundStyle === "mesh"
      ? { background: `radial-gradient(circle at 20% 50%, ${primaryColor}10, transparent 50%), radial-gradient(circle at 80% 50%, ${primaryColor}08, transparent 50%)` }
      : {};

  return (
    <div className={`min-h-screen bg-background flex items-start justify-center py-8 px-4 ${fontClass}`} style={bgStyle}>
      <div className="w-full max-w-md space-y-6">
        {/* Company header */}
        {showCompanyHeader && company && (
          <div className="text-center">
            {company.logo_url && <img src={company.logo_url} alt={company.name} className="h-8 mx-auto mb-2" />}
            <p className="text-xs text-muted-foreground">{company.name}</p>
          </div>
        )}

        {/* Profile photo */}
        <div className="relative">
          <div className={`aspect-[4/5] ${btnRadius} overflow-hidden bg-muted`}>
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><User className="h-20 w-20 text-muted-foreground" /></div>
            )}
          </div>
        </div>

        {/* Name & info */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
          {profile.role_title && <p className="text-muted-foreground">{profile.role_title}{company ? ` • ${company.name}` : ""}</p>}
          {profile.bio && <p className="text-sm text-muted-foreground pt-2">{profile.bio}</p>}
        </div>

        {/* Save contact */}
        {showSaveContact && (
          <button
            onClick={generateVCard}
            className={`w-full py-3 px-4 font-medium text-center transition-opacity hover:opacity-90 ${btnRadius}`}
            style={{ backgroundColor: primaryColor, color: "#fff" }}
          >
            <Download className="inline h-4 w-4 mr-2" />Salvar Contato
          </button>
        )}

        {/* CTAs */}
        {availableCTAs.length > 0 && (
          <div className="space-y-3">
            {availableCTAs.map((type: string) => {
              const Icon = CTA_ICONS[type] || Globe;
              return (
                <button key={type} onClick={() => handleCTA(type)} className={`flex items-center gap-4 w-full p-4 ${btnRadius} border border-border hover:bg-muted/50 transition-colors`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground ${CTA_COLORS[type] || ""}`} style={!CTA_COLORS[type] ? { backgroundColor: primaryColor } : {}}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{CTA_LABELS[type] || type}</p>
                    <p className="text-xs text-muted-foreground">{profile[type]}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Video (only YouTube/Vimeo) */}
        {profile.video_url && (() => {
          const embedUrl = getSafeVideoEmbedUrl(profile.video_url);
          if (!embedUrl) return null;
          return (
            <div className={`${btnRadius} overflow-hidden`}>
              <iframe
                src={embedUrl}
                className="w-full aspect-video"
                allowFullScreen
                title="Video"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })()}

        {/* Lead form */}
        {showLeadForm && (
          <div className={`border border-border ${btnRadius} p-6 space-y-4`}>
            <h3 className="font-semibold text-foreground">Deixe seu contato</h3>
            <form onSubmit={handleLeadSubmit} className="space-y-3">
              <Input placeholder="Nome *" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} required className={btnRadius} />
              <Input type="email" placeholder="Email *" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} required className={btnRadius} />
              <Input placeholder="Telefone" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} className={btnRadius} />
              <div className="flex items-start gap-2">
                <Checkbox id="consent" checked={leadForm.consent} onCheckedChange={(v) => setLeadForm({ ...leadForm, consent: v === true })} />
                <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed">
                  Concordo com o compartilhamento dos meus dados de acordo com a LGPD.
                </Label>
              </div>
              <button
                type="submit"
                disabled={submitting || !leadForm.consent}
                className={`w-full py-2.5 px-4 font-medium text-center transition-opacity hover:opacity-90 disabled:opacity-50 ${btnRadius}`}
                style={{ backgroundColor: primaryColor, color: "#fff" }}
              >
                {submitting && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}Enviar
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        {!hideBranding && (
          <div className="text-center py-4">
            <a href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Powered by Greattings
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

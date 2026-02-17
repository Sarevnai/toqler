import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  User,
  Globe,
  Download,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import LinkedInIcon from "@/components/icons/LinkedInIcon";
import InstagramIcon from "@/components/icons/InstagramIcon";
import { motion } from "framer-motion";

/* ── Helpers ── */

function getSafeVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be") {
      let videoId: string | null = null;
      if (parsed.hostname === "youtu.be") videoId = parsed.pathname.slice(1);
      else if (parsed.pathname.startsWith("/embed/")) videoId = parsed.pathname.split("/embed/")[1]?.split(/[?/]/)[0];
      else videoId = parsed.searchParams.get("v");
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }
  } catch { /* invalid url */ }
  return null;
}

const leadSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().max(20).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Consentimento obrigatório" }) }),
});

function getDevice(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/* ── Design tokens (local to public card) ── */
const T = {
  bg: "#f5f4f0",
  card: "#ffffff",
  accent: "#D4E84B",
  accentHover: "#c5d93f",
  text1: "#1a1a1a",
  text2: "#6b6b6b",
  text3: "#999999",
  border: "#e8e8e5",
} as const;

/* ── Animation variants ── */
const fadeInPhoto = { hidden: { opacity: 0, scale: 1.05 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.8, delay: 0.2 } } };
const slideUp = (delay = 0.3) => ({ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } } });
const fadeInUp = (delay: number) => ({ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } } });

/* ── Social / CTA config ── */
const SOCIAL_ITEMS = [
  { key: "linkedin", label: "LinkedIn", icon: LinkedInIcon, url: (v: string) => v.startsWith("http") ? v : `https://linkedin.com/in/${v}` },
  { key: "instagram", label: "Instagram", icon: InstagramIcon, url: (v: string) => `https://instagram.com/${v.replace("@", "")}` },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, url: (v: string) => `https://wa.me/${v.replace(/\D/g, "")}` },
  { key: "website", label: "Website", icon: Globe, url: (v: string) => v.startsWith("http") ? v : `https://${v}` },
] as const;

/* ── Component ── */

export default function PublicProfile({ profileId: propProfileId }: { profileId?: string } = {}) {
  const { profileId: paramProfileId } = useParams();
  const profileId = propProfileId || paramProfileId;
  const [profile, setProfile] = useState<any>(null);
  const [layout, setLayout] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    const load = async () => {
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
      const urlParams = new URLSearchParams(window.location.search);
      await supabase.from("events").insert({ event_type: "profile_view", profile_id: p.id, company_id: p.company_id, device: getDevice(), source: urlParams.get("utm_source") || null });
    };
    load();
  }, [profileId]);

  const trackCTA = async (ctaType: string) => {
    if (!profile) return;
    await supabase.from("events").insert({ event_type: "cta_click", profile_id: profile.id, company_id: profile.company_id, cta_type: ctaType, device: getDevice() });
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
    const { error } = await supabase.from("leads").insert({
      company_id: profile.company_id, profile_id: profile.id,
      name: leadForm.name.trim(), email: leadForm.email.trim(),
      phone: leadForm.phone?.trim() || null, consent: true,
    });
    await supabase.from("events").insert({ event_type: "lead_submit", profile_id: profile.id, company_id: profile.company_id, device: getDevice() });
    setSubmitting(false);
    if (error) { toast.error("Erro ao enviar"); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const payload = JSON.stringify({ company_id: profile.company_id, email: leadForm.email.trim(), name: leadForm.name.trim(), phone: leadForm.phone?.trim() || null, profile_id: profile.id });
    const headers = { "Content-Type": "application/json", apikey };
    fetch(`${supabaseUrl}/functions/v1/webhook-dispatcher`, { method: "POST", headers, body: payload }).catch(() => {});
    fetch(`${supabaseUrl}/functions/v1/send-follow-up`, { method: "POST", headers, body: payload }).catch(() => {});
    setSubmitted(true);
    setTimeout(() => { setDrawerOpen(false); setSubmitted(false); setLeadForm({ name: "", email: "", phone: "", consent: false }); }, 2500);
  };

  /* ── Loading / Not found ── */
  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ background: T.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: T.text2 }} /></div>;
  if (!profile) return <div className="flex min-h-screen items-center justify-center" style={{ background: T.bg }}><p style={{ color: T.text2 }}>Perfil não encontrado</p></div>;

  /* ── Layout flags ── */
  const showSaveContact = layout?.show_save_contact !== false;
  const showLeadForm = layout?.show_lead_form !== false;
  const showCompanyHeader = layout?.show_company_header !== false;
  const showBio = layout?.show_bio !== false;
  const showContact = layout?.show_contact !== false;
  const showSocial = layout?.show_social !== false;
  const showVideo = layout?.show_video !== false;
  const hideBranding = company?.hide_branding;

  const availableSocials = SOCIAL_ITEMS.filter((s) => profile[s.key]);

  /* ── Contact items ── */
  const contactItems = [
    profile.whatsapp && { icon: Phone, label: "Telefone", value: profile.whatsapp, href: `tel:${profile.whatsapp}` },
    profile.website && { icon: Globe, label: "Website", value: profile.website.replace(/^https?:\/\//, ""), href: profile.website.startsWith("http") ? profile.website : `https://${profile.website}` },
  ].filter(Boolean) as { icon: any; label: string; value: string; href: string }[];

  return (
    <div className="min-h-screen flex justify-center items-start" style={{ background: T.bg }}>
      <div className="w-full max-w-[430px] min-h-screen" style={{ background: T.bg }}>

        {/* ── Hero ── */}
        <motion.div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 3.2", background: "#2a2a2a" }} variants={fadeInPhoto} initial="hidden" animate="visible">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover object-[center_20%]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><User className="h-24 w-24" style={{ color: T.text3 }} /></div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%)" }} />
        </motion.div>

        {/* ── Card Body ── */}
        <motion.div className="relative z-10 -mt-6 rounded-t-2xl px-6 pt-8 pb-5" style={{ background: T.card }} variants={slideUp(0.3)} initial="hidden" animate="visible">
          <h1 className="font-display text-4xl font-semibold leading-tight -tracking-wide" style={{ color: T.text1 }}>{profile.name}</h1>
          {profile.role_title && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: T.text2 }}>
              {profile.role_title}{company ? ` at ${company.name}` : ""}
            </p>
          )}

          {/* Brand row */}
          {showCompanyHeader && company && (
            <div className="flex items-center justify-between mt-5 pb-5 mb-0" style={{ borderBottom: `1px solid ${T.border}` }}>
              {company.logo_url ? <img src={company.logo_url} alt={company.name} className="h-7 opacity-85" /> : <span className="text-sm font-medium" style={{ color: T.text2 }}>{company.name}</span>}
              <span className="text-[0.8rem] italic" style={{ color: T.text2 }}>We connect. For real.</span>
            </div>
          )}

          {/* CTAs */}
          <motion.div className="grid grid-cols-2 gap-3 mt-5" variants={slideUp(0.5)} initial="hidden" animate="visible">
            {showSaveContact && (
              <button
                onClick={generateVCard}
                className="flex items-center justify-center gap-2.5 py-4 px-5 rounded-xl text-[0.85rem] font-semibold transition-all active:scale-[0.97]"
                style={{ background: T.card, color: T.text1, border: `1.5px solid ${T.border}` }}
              >
                <Download className="w-[18px] h-[18px]" />
                Salvar Contato
              </button>
            )}
            {showLeadForm && (
              <Drawer open={drawerOpen} onOpenChange={(open) => { setDrawerOpen(open); if (!open) { setSubmitted(false); } }}>
                <DrawerTrigger asChild>
                  <button
                    className="flex items-center justify-center gap-2.5 py-4 px-5 rounded-xl text-[0.85rem] font-semibold transition-all active:scale-[0.97]"
                    style={{ background: T.accent, color: T.text1, border: "1.5px solid transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.accentHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
                  >
                    <Send className="w-[18px] h-[18px]" />
                    Trocar Contato
                  </button>
                </DrawerTrigger>
                <DrawerContent className="max-w-[430px] mx-auto" style={{ background: T.card }}>
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <CheckCircle2 className="w-12 h-12" style={{ color: T.accent }} />
                      <p className="font-display text-xl font-semibold" style={{ color: T.text1 }}>Contato Enviado!</p>
                      <p className="text-sm" style={{ color: T.text2 }}>{profile.name} receberá seus dados em breve.</p>
                    </div>
                  ) : (
                    <div className="px-6 pb-12">
                      <DrawerHeader className="px-0 text-left">
                        <DrawerTitle className="font-display text-2xl font-semibold" style={{ color: T.text1 }}>Trocar Contato</DrawerTitle>
                        <DrawerDescription className="text-[0.85rem] leading-relaxed" style={{ color: T.text2 }}>
                          Compartilhe seus dados e {profile.name} receberá suas informações de contato.
                        </DrawerDescription>
                      </DrawerHeader>
                      <form onSubmit={handleLeadSubmit} className="space-y-4 mt-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: T.text2 }}>Nome</label>
                          <input
                            className="w-full py-3.5 px-4 rounded-lg text-[0.9rem] outline-none transition-colors"
                            style={{ background: T.bg, border: `1.5px solid ${T.border}`, color: T.text1 }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                            placeholder="Seu nome completo"
                            value={leadForm.name}
                            onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: T.text2 }}>Email</label>
                          <input
                            type="email"
                            className="w-full py-3.5 px-4 rounded-lg text-[0.9rem] outline-none transition-colors"
                            style={{ background: T.bg, border: `1.5px solid ${T.border}`, color: T.text1 }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                            placeholder="seu@email.com"
                            value={leadForm.email}
                            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: T.text2 }}>Telefone</label>
                          <input
                            className="w-full py-3.5 px-4 rounded-lg text-[0.9rem] outline-none transition-colors"
                            style={{ background: T.bg, border: `1.5px solid ${T.border}`, color: T.text1 }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                            placeholder="+55 11 99999-9999"
                            value={leadForm.phone}
                            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="flex items-start gap-2 pt-1">
                          <Checkbox id="consent-drawer" checked={leadForm.consent} onCheckedChange={(v) => setLeadForm({ ...leadForm, consent: v === true })} />
                          <Label htmlFor="consent-drawer" className="text-xs leading-relaxed" style={{ color: T.text2 }}>
                            Concordo com o compartilhamento dos meus dados de acordo com a LGPD.
                          </Label>
                        </div>
                        <button
                          type="submit"
                          disabled={submitting || !leadForm.consent}
                          className="w-full py-4 rounded-xl text-[0.9rem] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.97]"
                          style={{ background: T.accent, color: T.text1 }}
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Enviar Contato
                        </button>
                      </form>
                    </div>
                  )}
                </DrawerContent>
              </Drawer>
            )}
          </motion.div>
        </motion.div>

        {/* ── Sections ── */}
        <div className="px-6 pb-10" style={{ background: T.bg }}>

          {/* Bio */}
          {showBio && profile.bio && (
            <motion.div className="rounded-xl p-6 mt-3 shadow-sm" style={{ background: T.card }} variants={fadeInUp(0.6)} initial="hidden" animate="visible">
              <h2 className="text-[0.95rem] font-bold mb-3" style={{ color: T.text1 }}>Minha Bio</h2>
              <p className="text-[0.875rem] leading-relaxed" style={{ color: T.text2 }}>{profile.bio}</p>
            </motion.div>
          )}

          {/* Contact */}
          {showContact && contactItems.length > 0 && (
            <motion.div className="rounded-xl p-6 mt-3 shadow-sm" style={{ background: T.card }} variants={fadeInUp(0.7)} initial="hidden" animate="visible">
              <h2 className="text-[0.95rem] font-bold mb-3" style={{ color: T.text1 }}>Contato</h2>
              <div className="flex flex-col gap-3.5">
                {contactItems.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 group" onClick={() => trackCTA(item.label.toLowerCase())}>
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-colors" style={{ background: T.bg }}>
                      <item.icon className="w-[18px] h-[18px]" style={{ color: T.text1 }} />
                    </div>
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.08em] font-medium" style={{ color: T.text3 }}>{item.label}</p>
                      <p className="text-[0.875rem] font-medium" style={{ color: T.text1 }}>{item.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Social */}
          {showSocial && availableSocials.length > 0 && (
            <motion.div className="rounded-xl p-6 mt-3 shadow-sm" style={{ background: T.card }} variants={fadeInUp(0.8)} initial="hidden" animate="visible">
              <h2 className="text-[0.95rem] font-bold mb-3" style={{ color: T.text1 }}>Social</h2>
              <div className="grid grid-cols-4 gap-3">
                {availableSocials.map((s) => (
                  <a
                    key={s.key}
                    href={s.url(profile[s.key])}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCTA(s.key)}
                    className="flex flex-col items-center gap-2 py-4 px-2 rounded-lg transition-all hover:-translate-y-0.5 active:scale-95"
                    style={{ background: T.bg }}
                  >
                    <s.icon className="w-[22px] h-[22px]" style={{ color: T.text1 }} />
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Video */}
          {showVideo && profile.video_url && (() => {
            const embedUrl = getSafeVideoEmbedUrl(profile.video_url);
            if (!embedUrl) return null;
            return (
              <motion.div className="rounded-xl overflow-hidden mt-3 shadow-sm" style={{ background: T.card }} variants={fadeInUp(0.9)} initial="hidden" animate="visible">
                <iframe src={embedUrl} className="w-full aspect-video" allowFullScreen title="Video" sandbox="allow-scripts allow-same-origin allow-presentation" referrerPolicy="no-referrer" />
              </motion.div>
            );
          })()}
        </div>

        {/* ── Footer ── */}
        {!hideBranding && (
          <motion.div className="text-center py-6 pb-12" style={{ background: T.bg }} variants={fadeInUp(1.0)} initial="hidden" animate="visible">
            <a href="/" className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.06em] transition-colors" style={{ color: T.text3 }}>
              Powered by Toqler
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import PublicProfile from "./PublicProfile";

export default function CardRedirect() {
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [resolvedProfileId, setResolvedProfileId] = useState<string | null>(null);

  const slug = location.pathname.replace(/^\/c\//, "");

  useEffect(() => {
    if (!slug) {
      setError("Link inválido.");
      return;
    }

    const resolve = async () => {
      const { data: card, error: fetchError } = await supabase
        .from("nfc_cards")
        .select("id, profile_id, status, company_id")
        .eq("slug", slug)
        .maybeSingle();

      if (fetchError || !card) {
        setError("Cartão não encontrado.");
        return;
      }

      if (card.status !== "active") {
        setError("Este cartão está desativado.");
        return;
      }

      if (!card.profile_id) {
        setError("Este cartão ainda não possui um perfil vinculado.");
        return;
      }

      // Register nfc_tap event (fire and forget)
      const ua = navigator.userAgent;
      const device = /mobile/i.test(ua) ? "mobile" : "desktop";
      supabase.from("events").insert({
        event_type: "nfc_tap",
        card_id: card.id,
        profile_id: card.profile_id,
        company_id: card.company_id,
        device,
        source: "nfc",
      });

      setResolvedProfileId(card.profile_id);
    };

    resolve();
  }, [slug]);

  if (resolvedProfileId) {
    return <PublicProfile profileId={resolvedProfileId} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-4xl">😕</div>
          <h1 className="text-xl font-semibold text-foreground">{error}</h1>
          <p className="text-muted-foreground text-sm">
            Se você acredita que isso é um erro, entre em contato com a empresa que forneceu este cartão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

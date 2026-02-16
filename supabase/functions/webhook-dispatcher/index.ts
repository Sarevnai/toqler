import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Support both legacy { lead_id } and new { company_id, email, name, ... } formats
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let lead: { name: string; email: string; phone: string | null; profile_id: string | null } | null = null;
    let company_id: string | null = null;

    if (body.lead_id) {
      // Legacy: look up lead by ID
      const { data, error } = await adminClient
        .from("leads")
        .select("id, company_id, name, email, phone, profile_id, created_at")
        .eq("id", body.lead_id)
        .maybeSingle();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Lead not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const createdAt = new Date(data.created_at).getTime();
      if (Date.now() - createdAt > 60000) {
        return new Response(JSON.stringify({ error: "Lead too old" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      company_id = data.company_id;
      lead = { name: data.name, email: data.email, phone: data.phone, profile_id: data.profile_id };
    } else if (body.company_id && body.email) {
      // New format: data passed directly
      company_id = body.company_id;
      lead = { name: body.name || "", email: body.email, phone: body.phone || null, profile_id: body.profile_id || null };
    } else {
      return new Response(JSON.stringify({ error: "lead_id or (company_id + email) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active webhook integrations for this company
    const { data: integrations, error: intError } = await adminClient
      .from("integrations")
      .select("*")
      .eq("company_id", company_id)
      .eq("type", "webhook")
      .eq("active", true);

    if (intError) {
      console.error("Error fetching integrations:", intError);
      return new Response(JSON.stringify({ error: "Failed to fetch integrations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ dispatched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.allSettled(
      integrations.map(async (integration: any) => {
        const url = integration.config?.url;
        if (!url) return { id: integration.id, status: "skipped", reason: "no url" };

        const payload = {
          event: "lead.created",
          timestamp: new Date().toISOString(),
          company_id,
          lead,
        };

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (integration.config?.secret) {
          headers["X-Webhook-Secret"] = integration.config.secret;
        }

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        return { id: integration.id, status: response.ok ? "success" : "error", statusCode: response.status };
      })
    );

    const dispatched = results.filter(
      (r) => r.status === "fulfilled" && (r.value as any).status === "success"
    ).length;

    console.log(`Dispatched ${dispatched}/${integrations.length} webhooks for company ${company_id}`);

    return new Response(JSON.stringify({ dispatched, total: integrations.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in webhook-dispatcher:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify the lead exists and was created recently (within last 60 seconds)
    const { data: lead, error: leadError } = await adminClient
      .from("leads")
      .select("id, company_id, name, email, phone, profile_id, created_at")
      .eq("id", lead_id)
      .maybeSingle();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate lead was created within last 60 seconds to prevent replay attacks
    const createdAt = new Date(lead.created_at).getTime();
    const now = Date.now();
    if (now - createdAt > 60000) {
      return new Response(JSON.stringify({ error: "Lead too old" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const company_id = lead.company_id;

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
          lead: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone || null,
            profile_id: lead.profile_id || null,
          },
        };

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (integration.config?.secret) {
          headers["X-Webhook-Secret"] = integration.config.secret;
        }

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        return {
          id: integration.id,
          status: response.ok ? "success" : "error",
          statusCode: response.status,
        };
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

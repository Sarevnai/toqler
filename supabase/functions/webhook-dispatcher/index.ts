import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, lead } = await req.json();

    if (!company_id || !lead) {
      return new Response(JSON.stringify({ error: "company_id and lead required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

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

        // Add custom headers if configured
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

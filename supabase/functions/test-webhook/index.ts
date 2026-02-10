import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { integration_id } = await req.json();
    if (!integration_id) {
      return new Response(JSON.stringify({ error: "integration_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the integration (RLS ensures user has access)
    const { data: integration, error: intError } = await supabase
      .from("integrations")
      .select("*")
      .eq("id", integration_id)
      .eq("type", "webhook")
      .single();

    if (intError || !integration) {
      return new Response(JSON.stringify({ error: "Webhook not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = integration.config as Record<string, string>;
    if (!config?.url) {
      return new Response(JSON.stringify({ error: "Webhook URL not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send test payload to the webhook URL from the server (no CORS issues)
    const testPayload = {
      event: "test",
      timestamp: new Date().toISOString(),
      company_id: integration.company_id,
      lead: { name: "Teste", email: "teste@exemplo.com", phone: null },
    };

    const webhookResponse = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.secret ? { "X-Webhook-Secret": config.secret } : {}),
      },
      body: JSON.stringify(testPayload),
    });

    return new Response(
      JSON.stringify({
        success: webhookResponse.ok,
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

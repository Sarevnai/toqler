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

    // Verify lead exists and was created recently
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

    const createdAt = new Date(lead.created_at).getTime();
    if (Date.now() - createdAt > 60000) {
      return new Response(JSON.stringify({ error: "Lead too old" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const company_id = lead.company_id;

    // Check if follow_up_email is enabled for this company
    const { data: company } = await adminClient
      .from("companies")
      .select("name, follow_up_email, primary_color")
      .eq("id", company_id)
      .maybeSingle();

    if (!company?.follow_up_email) {
      return new Response(JSON.stringify({ sent: false, reason: "follow_up_email disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not set");
      return new Response(JSON.stringify({ sent: false, reason: "AI not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a professional follow-up email writer for ${company.name}. Write a short, warm, personalized follow-up email in Portuguese (Brazilian). The email should thank the lead for connecting and express interest in keeping in touch. Keep it under 150 words. Return ONLY the email body text, no subject line, no greeting prefix.`,
          },
          {
            role: "user",
            content: `Write a follow-up email for a lead named "${lead.name}" who just shared their contact via our digital business card.`,
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI Gateway error:", await aiResponse.text());
      return new Response(JSON.stringify({ sent: false, reason: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const emailBody = aiData.choices?.[0]?.message?.content || "";

    await adminClient.from("events").insert({
      event_type: "follow_up_sent",
      company_id,
      profile_id: lead.profile_id || null,
      metadata: {
        lead_email: lead.email,
        lead_name: lead.name,
        email_body: emailBody,
      },
    });

    console.log(`Follow-up email generated for ${lead.email} at company ${company.name}`);

    return new Response(
      JSON.stringify({ sent: true, email_body: emailBody }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-follow-up:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

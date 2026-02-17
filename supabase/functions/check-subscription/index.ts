import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

// Map Stripe price IDs to plan slugs
const PRICE_TO_PLAN: Record<string, { slug: string; cycle: string }> = {
  "price_1T1u96JTl42IWyghCzoccWrR": { slug: "pro", cycle: "monthly" },
  "price_1T1u9wJTl42IWyghtgUfnz7p": { slug: "pro", cycle: "yearly" },
  "price_1T1uAYJTl42IWyghYDpgWZ95": { slug: "business", cycle: "monthly" },
  "price_1T1uAnJTl42IWygh6u0RqqPi": { slug: "business", cycle: "yearly" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check trialing
      const trialingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });

      if (trialingSubs.data.length === 0) {
        logStep("No active subscription");
        return new Response(JSON.stringify({ subscribed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sub = trialingSubs.data[0];
      const priceId = sub.items.data[0].price.id;
      const planInfo = PRICE_TO_PLAN[priceId];

      // Sync to database
      await syncSubscription(supabaseAdmin, user.id, sub, planInfo, customerId);

      return new Response(
        JSON.stringify({
          subscribed: true,
          status: "trialing",
          plan_slug: planInfo?.slug || "unknown",
          billing_cycle: planInfo?.cycle || "monthly",
          subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0].price.id;
    const planInfo = PRICE_TO_PLAN[priceId];
    logStep("Active subscription found", { planSlug: planInfo?.slug, priceId });

    // Sync to database
    await syncSubscription(supabaseAdmin, user.id, sub, planInfo, customerId);

    return new Response(
      JSON.stringify({
        subscribed: true,
        status: "active",
        plan_slug: planInfo?.slug || "unknown",
        billing_cycle: planInfo?.cycle || "monthly",
        subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function syncSubscription(
  supabase: any,
  userId: string,
  stripeSub: any,
  planInfo: { slug: string; cycle: string } | undefined,
  stripeCustomerId: string
) {
  try {
    // Get company_id from user membership
    const { data: membership } = await supabase
      .from("company_memberships")
      .select("company_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!membership?.company_id) {
      logStep("No company found for user, skipping sync");
      return;
    }

    const companyId = membership.company_id;
    const slug = planInfo?.slug || "pro";
    const cycle = planInfo?.cycle || "monthly";

    // Get plan ID from slug
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!plan) {
      logStep("Plan not found for slug", { slug });
      return;
    }

    const status = stripeSub.status === "trialing" ? "trial" : "active";

    // Update subscription
    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan_id: plan.id,
        status,
        billing_cycle: cycle,
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        trial_end: stripeSub.trial_end
          ? new Date(stripeSub.trial_end * 1000).toISOString()
          : null,
        stripe_subscription_id: stripeSub.id,
        stripe_customer_id: stripeCustomerId,
      })
      .eq("company_id", companyId);

    if (error) {
      logStep("Error syncing subscription", { error: error.message });
    } else {
      logStep("Subscription synced to database", { companyId, planSlug: slug, status });
    }
  } catch (err) {
    logStep("Sync error", { error: String(err) });
  }
}

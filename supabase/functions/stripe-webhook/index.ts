import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

// Map Stripe price IDs to plan slugs (same as check-subscription)
const PRICE_TO_PLAN: Record<string, { slug: string; cycle: string }> = {
  "price_1T1u96JTl42IWyghCzoccWrR": { slug: "pro", cycle: "monthly" },
  "price_1T1u9wJTl42IWyghtgUfnz7p": { slug: "pro", cycle: "yearly" },
  "price_1T1uAYJTl42IWyghYDpgWZ95": { slug: "business", cycle: "monthly" },
  "price_1T1uAnJTl42IWygh6u0RqqPi": { slug: "business", cycle: "yearly" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logStep("ERROR", { message: "Missing stripe-signature header" });
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      logStep("ERROR", { message: `Signature verification failed: ${err}` });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabaseAdmin, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabaseAdmin, event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(supabaseAdmin, event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabaseAdmin, event.data.object as Stripe.Invoice);
        break;

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});

// ─── customer.subscription.updated ───────────────────────────────────
async function handleSubscriptionUpdated(supabase: any, sub: Stripe.Subscription) {
  const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price?.id;
  const planInfo = priceId ? PRICE_TO_PLAN[priceId] : undefined;

  logStep("subscription.updated", { stripeCustomerId, status: sub.status, priceId, planSlug: planInfo?.slug });

  // Find the local subscription by stripe_customer_id
  const { data: localSub, error: findErr } = await supabase
    .from("subscriptions")
    .select("id, plan_id, company_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (findErr || !localSub) {
    logStep("No local subscription found for customer", { stripeCustomerId, error: findErr?.message });
    return;
  }

  // Resolve plan_id from slug
  let planId = localSub.plan_id;
  let oldPlanId = localSub.plan_id;
  if (planInfo) {
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("slug", planInfo.slug)
      .maybeSingle();
    if (plan) planId = plan.id;
  }

  // Map Stripe status to local status
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trial",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "pending",
    incomplete_expired: "canceled",
    paused: "paused",
  };
  const localStatus = statusMap[sub.status] || sub.status;

  const updateData: Record<string, any> = {
    status: localStatus,
    plan_id: planId,
    billing_cycle: planInfo?.cycle || "monthly",
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    stripe_subscription_id: sub.id,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    cancel_reason: sub.cancellation_details?.reason || null,
    updated_at: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("id", localSub.id);

  if (updateErr) {
    logStep("Error updating subscription", { error: updateErr.message });
    return;
  }

  logStep("Subscription updated successfully", { id: localSub.id, status: localStatus, planSlug: planInfo?.slug });

  // Log subscription event if plan changed
  if (planId !== oldPlanId) {
    await supabase.from("subscription_events").insert({
      subscription_id: localSub.id,
      event_type: "plan_changed",
      old_plan_id: oldPlanId,
      new_plan_id: planId,
      metadata: { stripe_event: "customer.subscription.updated", stripe_subscription_id: sub.id },
    });
  }
}

// ─── customer.subscription.deleted ───────────────────────────────────
async function handleSubscriptionDeleted(supabase: any, sub: Stripe.Subscription) {
  const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  logStep("subscription.deleted", { stripeCustomerId });

  const { data: localSub, error: findErr } = await supabase
    .from("subscriptions")
    .select("id, plan_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (findErr || !localSub) {
    logStep("No local subscription found for deleted event", { stripeCustomerId });
    return;
  }

  // Get the free plan to downgrade
  const { data: freePlan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();

  const { error: updateErr } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_reason: sub.cancellation_details?.reason || "subscription_deleted",
      updated_at: new Date().toISOString(),
      ...(freePlan ? { plan_id: freePlan.id } : {}),
    })
    .eq("id", localSub.id);

  if (updateErr) {
    logStep("Error canceling subscription", { error: updateErr.message });
    return;
  }

  logStep("Subscription canceled", { id: localSub.id });

  await supabase.from("subscription_events").insert({
    subscription_id: localSub.id,
    event_type: "canceled",
    old_plan_id: localSub.plan_id,
    new_plan_id: freePlan?.id || null,
    metadata: { stripe_event: "customer.subscription.deleted", stripe_subscription_id: sub.id },
  });
}

// ─── invoice.paid ────────────────────────────────────────────────────
async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice) {
  const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!stripeCustomerId) {
    logStep("invoice.paid - no customer ID");
    return;
  }

  logStep("invoice.paid", { stripeCustomerId, amount: invoice.amount_paid, invoiceId: invoice.id });

  // Find subscription by stripe_customer_id to get company_id
  const { data: localSub } = await supabase
    .from("subscriptions")
    .select("id, company_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!localSub) {
    logStep("No local subscription found for invoice", { stripeCustomerId });
    return;
  }

  // Upsert invoice by stripe_invoice_id
  const invoiceData = {
    company_id: localSub.company_id,
    subscription_id: localSub.id,
    amount: invoice.amount_paid,
    currency: (invoice.currency || "brl").toUpperCase(),
    status: "paid",
    description: invoice.lines?.data?.[0]?.description || "Assinatura",
    due_date: invoice.due_date
      ? new Date(invoice.due_date * 1000).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    paid_at: new Date().toISOString(),
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent?.id || null,
    invoice_pdf_url: invoice.invoice_pdf || null,
  };

  // Check if invoice already exists
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("stripe_invoice_id", invoice.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("invoices").update(invoiceData).eq("id", existing.id);
    logStep("Invoice updated", { id: existing.id });
  } else {
    await supabase.from("invoices").insert(invoiceData);
    logStep("Invoice created", { stripe_invoice_id: invoice.id });
  }
}

// ─── invoice.payment_failed ─────────────────────────────────────────
async function handleInvoicePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!stripeCustomerId) {
    logStep("invoice.payment_failed - no customer ID");
    return;
  }

  logStep("invoice.payment_failed", { stripeCustomerId, invoiceId: invoice.id });

  const { data: localSub, error: findErr } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (findErr || !localSub) {
    logStep("No local subscription found for failed payment", { stripeCustomerId });
    return;
  }

  await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("id", localSub.id);

  logStep("Subscription marked as past_due", { id: localSub.id });

  await supabase.from("subscription_events").insert({
    subscription_id: localSub.id,
    event_type: "payment_failed",
    metadata: { stripe_event: "invoice.payment_failed", stripe_invoice_id: invoice.id },
  });
}

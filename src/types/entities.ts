import type { Tables } from "@/integrations/supabase/types";

// Core entity types derived from database schema
export type Company = Tables<"companies">;
export type Profile = Tables<"profiles">;
export type NfcCard = Tables<"nfc_cards">;
export type Lead = Tables<"leads">;
export type Integration = Tables<"integrations">;
export type CompanyMembership = Tables<"company_memberships">;
export type Invitation = Tables<"invitations">;
export type Event = Tables<"events">;
export type ProfileLayout = Tables<"profile_layouts">;

// Extended types with joined relations
export interface NfcCardWithProfile extends NfcCard {
  profiles: { name: string } | null;
}

export interface LeadWithProfile extends Lead {
  profiles: { name: string } | null;
}

export interface TeamMember extends CompanyMembership {
  email?: string;
}

// Dashboard KPI shape (from RPC)
export interface DashboardKpis {
  cards: number;
  profiles: number;
  views: number;
  clicks: number;
}

export interface DailyChartPoint {
  date: string;
  views: number;
  clicks: number;
}

export interface MonthlyChartPoint {
  month: string;
  views: number;
  leads: number;
}

export interface CtaDistributionPoint {
  name: string;
  value: number;
}

// Billing types
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  trial_days: number | null;
  is_active: boolean | null;
  is_default: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  feature_value: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  coupon_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Invoice {
  id: string;
  company_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string | null;
  status: string;
  description: string | null;
  due_date: string;
  paid_at: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  invoice_pdf_url: string | null;
  created_at: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  uses_count: number | null;
  valid_until: string | null;
  applicable_plans: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface BillingKpis {
  mrr: number;
  arr: number;
  total_paying: number;
  total_free: number;
  total_trial: number;
  total_canceled: number;
  total_past_due: number;
  revenue_month: number;
  pending_invoices: number;
  pending_amount: number;
}

export interface AdminSubscription {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  canceled_at: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  company: { id: string; name: string; slug: string | null; logo_url: string | null };
  plan: { id: string; name: string; slug: string; price_monthly: number };
}

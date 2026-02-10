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

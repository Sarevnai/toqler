
-- Create membership role enum
CREATE TYPE public.membership_role AS ENUM ('admin', 'member');

-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0ea5e9',
  hide_branding BOOLEAN DEFAULT false,
  follow_up_email BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Company memberships table
CREATE TABLE public.company_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role_title TEXT,
  bio TEXT,
  photo_url TEXT,
  cover_url TEXT,
  video_url TEXT,
  whatsapp TEXT,
  instagram TEXT,
  linkedin TEXT,
  website TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NFC Cards table
CREATE TABLE public.nfc_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tag_uid TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  card_id UUID REFERENCES public.nfc_cards(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events (tracking) table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'cta_click', 'lead_submit')),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  card_id UUID REFERENCES public.nfc_cards(id) ON DELETE SET NULL,
  cta_type TEXT,
  device TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profile layouts table (1:1 with company)
CREATE TABLE public.profile_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  layout_style TEXT NOT NULL DEFAULT 'card' CHECK (layout_style IN ('card', 'classic')),
  button_style TEXT NOT NULL DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'pill', 'square')),
  font_style TEXT NOT NULL DEFAULT 'default' CHECK (font_style IN ('default', 'serif', 'mono')),
  background_style TEXT NOT NULL DEFAULT 'solid' CHECK (background_style IN ('solid', 'gradient', 'dots')),
  show_lead_form BOOLEAN NOT NULL DEFAULT true,
  show_save_contact BOOLEAN NOT NULL DEFAULT true,
  show_company_header BOOLEAN NOT NULL DEFAULT true,
  show_stats_row BOOLEAN NOT NULL DEFAULT true,
  cta_order JSONB NOT NULL DEFAULT '["whatsapp","instagram","linkedin","website"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function: is_company_member
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE company_id = _company_id AND user_id = auth.uid()
  )
$$;

-- Helper function: is_company_admin
CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE company_id = _company_id AND user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nfc_cards_updated_at BEFORE UPDATE ON public.nfc_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profile_layouts_updated_at BEFORE UPDATE ON public.profile_layouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_layouts ENABLE ROW LEVEL SECURITY;

-- RLS: companies
CREATE POLICY "Members can view their company" ON public.companies FOR SELECT USING (public.is_company_member(id));
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE USING (public.is_company_admin(id));
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete their company" ON public.companies FOR DELETE USING (public.is_company_admin(id));

-- RLS: company_memberships
CREATE POLICY "Members can view memberships" ON public.company_memberships FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Users can create their own membership" ON public.company_memberships FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can insert memberships" ON public.company_memberships FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(company_id));
CREATE POLICY "Admins can update memberships" ON public.company_memberships FOR UPDATE USING (public.is_company_admin(company_id));
CREATE POLICY "Admins can delete memberships" ON public.company_memberships FOR DELETE USING (public.is_company_admin(company_id) AND user_id != auth.uid());

-- RLS: profiles
CREATE POLICY "Members can view profiles" ON public.profiles FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update profiles" ON public.profiles FOR UPDATE USING (public.is_company_member(company_id));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.is_company_admin(company_id));
-- Public profile view (for /p/:profileId)
CREATE POLICY "Anyone can view published profiles" ON public.profiles FOR SELECT USING (published = true);

-- RLS: nfc_cards
CREATE POLICY "Members can view cards" ON public.nfc_cards FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create cards" ON public.nfc_cards FOR INSERT TO authenticated WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update cards" ON public.nfc_cards FOR UPDATE USING (public.is_company_member(company_id));
CREATE POLICY "Admins can delete cards" ON public.nfc_cards FOR DELETE USING (public.is_company_admin(company_id));

-- RLS: leads
CREATE POLICY "Members can view leads" ON public.leads FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Anyone can submit leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (public.is_company_admin(company_id));

-- RLS: events
CREATE POLICY "Members can view events" ON public.events FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Anyone can create events" ON public.events FOR INSERT WITH CHECK (true);

-- RLS: profile_layouts
CREATE POLICY "Members can view layouts" ON public.profile_layouts FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Admins can create layouts" ON public.profile_layouts FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(company_id));
CREATE POLICY "Admins can update layouts" ON public.profile_layouts FOR UPDATE USING (public.is_company_admin(company_id));
-- Public layout access for public profile rendering
CREATE POLICY "Anyone can view layouts for rendering" ON public.profile_layouts FOR SELECT USING (true);

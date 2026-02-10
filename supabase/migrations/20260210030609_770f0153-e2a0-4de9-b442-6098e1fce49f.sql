
-- Create integrations table
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, type)
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view integrations"
  ON public.integrations FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Admins can create integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Admins can update integrations"
  ON public.integrations FOR UPDATE
  USING (is_company_admin(company_id));

CREATE POLICY "Admins can delete integrations"
  ON public.integrations FOR DELETE
  USING (is_company_admin(company_id));

-- Trigger for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

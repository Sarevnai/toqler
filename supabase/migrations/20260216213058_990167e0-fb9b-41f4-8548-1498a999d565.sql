
DROP POLICY IF EXISTS "Leads require consent and company reference" ON public.leads;

CREATE POLICY "Leads require consent and company reference"
  ON public.leads
  FOR INSERT
  TO public
  WITH CHECK ((company_id IS NOT NULL) AND (consent = true));

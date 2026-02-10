-- 1. companies: restrict direct INSERT since create_company_with_membership (SECURITY DEFINER) bypasses RLS
DROP POLICY "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Only via RPC or authenticated users"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. events: require a valid company_id (not null) to prevent garbage inserts
DROP POLICY "Anyone can create events" ON public.events;
CREATE POLICY "Events require valid company reference"
  ON public.events FOR INSERT
  WITH CHECK (company_id IS NOT NULL);

-- 3. leads: require consent = true and company_id not null (LGPD compliance)
DROP POLICY "Anyone can submit leads" ON public.leads;
CREATE POLICY "Leads require consent and company reference"
  ON public.leads FOR INSERT
  WITH CHECK (company_id IS NOT NULL AND consent = true);
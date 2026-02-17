CREATE POLICY "Members can update leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (is_company_member(company_id))
  WITH CHECK (is_company_member(company_id));
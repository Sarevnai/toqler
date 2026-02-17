CREATE POLICY "Public can view companies with published profiles"
  ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.company_id = companies.id
        AND profiles.published = true
    )
  );
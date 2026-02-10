CREATE OR REPLACE FUNCTION public.create_company_with_membership(_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
BEGIN
  INSERT INTO companies (name) VALUES (_name) RETURNING id INTO _company_id;
  INSERT INTO company_memberships (company_id, user_id, role)
    VALUES (_company_id, auth.uid(), 'admin');
  RETURN _company_id;
END;
$$;
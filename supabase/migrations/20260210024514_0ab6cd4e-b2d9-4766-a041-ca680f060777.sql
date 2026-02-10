
-- 1. Clean up duplicate memberships: keep only the earliest per user
DELETE FROM public.company_memberships
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.company_memberships
  ORDER BY user_id, created_at ASC
);

-- 2. Clean up orphaned companies (no memberships pointing to them)
DELETE FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.company_memberships);

-- 3. Make RPC idempotent
CREATE OR REPLACE FUNCTION public.create_company_with_membership(_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _existing_company_id uuid;
BEGIN
  SELECT company_id INTO _existing_company_id
    FROM company_memberships
    WHERE user_id = auth.uid()
    LIMIT 1;

  IF _existing_company_id IS NOT NULL THEN
    RETURN _existing_company_id;
  END IF;

  INSERT INTO companies (name) VALUES (_name) RETURNING id INTO _company_id;
  INSERT INTO company_memberships (company_id, user_id, role)
    VALUES (_company_id, auth.uid(), 'admin');
  RETURN _company_id;
END;
$$;


-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.membership_role NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  invited_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations for their company
CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Members can view invitations"
  ON public.invitations FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (is_company_admin(company_id));

CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  USING (is_company_admin(company_id));

-- Allow invited users to view their own invitations (by email)
-- This needs a special function since we need to match by email
CREATE OR REPLACE FUNCTION public.accept_invitation(_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv RECORD;
  _user_email text;
  _existing uuid;
BEGIN
  -- Get the current user's email
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();
  
  -- Get the invitation
  SELECT * INTO _inv FROM public.invitations
    WHERE id = _invitation_id AND status = 'pending' AND LOWER(email) = LOWER(_user_email);
  
  IF _inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or not for this user';
  END IF;
  
  -- Check if user already has a membership in this company
  SELECT id INTO _existing FROM public.company_memberships
    WHERE company_id = _inv.company_id AND user_id = auth.uid();
  
  IF _existing IS NOT NULL THEN
    -- Already a member, just mark invitation as accepted
    UPDATE public.invitations SET status = 'accepted', updated_at = now() WHERE id = _invitation_id;
    RETURN;
  END IF;
  
  -- Create membership
  INSERT INTO public.company_memberships (company_id, user_id, role)
    VALUES (_inv.company_id, auth.uid(), _inv.role);
  
  -- Mark invitation as accepted
  UPDATE public.invitations SET status = 'accepted', updated_at = now() WHERE id = _invitation_id;
END;
$$;

-- Function to check pending invitations for current user
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE(id uuid, company_id uuid, company_name text, role public.membership_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.company_id, c.name as company_name, i.role
  FROM public.invitations i
  JOIN public.companies c ON c.id = i.company_id
  WHERE LOWER(i.email) = LOWER((SELECT email FROM auth.users WHERE auth.users.id = auth.uid()))
    AND i.status = 'pending';
$$;

-- Trigger for updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

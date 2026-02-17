
-- =============================================
-- ADMIN PANEL TABLES
-- =============================================

CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'support'
    CHECK (role IN ('super_admin', 'finance', 'support', 'operations')),
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- =============================================

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_notifications ENABLE ROW LEVEL SECURITY;

-- admin_users: any admin can view, only super_admin can manage
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "Super admins can insert admin_users" ON admin_users
  FOR INSERT WITH CHECK (is_platform_super_admin());

CREATE POLICY "Super admins can update admin_users" ON admin_users
  FOR UPDATE USING (is_platform_super_admin());

CREATE POLICY "Super admins can delete admin_users" ON admin_users
  FOR DELETE USING (is_platform_super_admin());

-- audit_logs
CREATE POLICY "Admins can view audit_logs" ON audit_logs
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "Admins can insert audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (is_platform_admin());

-- platform_notifications
CREATE POLICY "Admins can view notifications" ON platform_notifications
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "Admins can update notifications" ON platform_notifications
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "Admins can insert notifications" ON platform_notifications
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "Admins can delete notifications" ON platform_notifications
  FOR DELETE USING (is_platform_admin());

-- =============================================
-- UPDATED_AT TRIGGER for admin_users
-- =============================================

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RPC: get_admin_kpis
-- =============================================

CREATE OR REPLACE FUNCTION public.get_admin_kpis()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_companies', (SELECT COUNT(*) FROM companies),
    'total_profiles', (SELECT COUNT(*) FROM profiles),
    'total_cards', (SELECT COUNT(*) FROM nfc_cards),
    'total_leads', (SELECT COUNT(*) FROM leads),
    'total_leads_today', (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE),
    'total_leads_month', (SELECT COUNT(*) FROM leads WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    'active_cards', (SELECT COUNT(*) FROM nfc_cards WHERE status = 'active'),
    'published_profiles', (SELECT COUNT(*) FROM profiles WHERE published = true),
    'new_companies_month', (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    'new_companies_week', (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('week', CURRENT_DATE))
  ) INTO result;

  RETURN result;
END;
$$;

-- =============================================
-- RPC: get_admin_growth_chart
-- =============================================

CREATE OR REPLACE FUNCTION public.get_admin_growth_chart()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT
      to_char(d.month, 'Mon') as month,
      COALESCE(c.count, 0) as companies,
      COALESCE(l.count, 0) as leads
    FROM generate_series(
      date_trunc('month', CURRENT_DATE) - interval '5 months',
      date_trunc('month', CURRENT_DATE),
      interval '1 month'
    ) d(month)
    LEFT JOIN (
      SELECT date_trunc('month', created_at) as m, COUNT(*)::int as count
      FROM companies GROUP BY m
    ) c ON c.m = d.month
    LEFT JOIN (
      SELECT date_trunc('month', created_at) as m, COUNT(*)::int as count
      FROM leads GROUP BY m
    ) l ON l.m = d.month
    ORDER BY d.month
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- =============================================
-- RPC: get_admin_companies
-- =============================================

CREATE OR REPLACE FUNCTION public.get_admin_companies(
  _search TEXT DEFAULT '',
  _limit INT DEFAULT 20,
  _offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'data', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT
          co.id,
          co.name,
          co.slug,
          co.logo_url,
          co.primary_color,
          co.created_at,
          (SELECT COUNT(*)::int FROM profiles WHERE company_id = co.id) as profiles_count,
          (SELECT COUNT(*)::int FROM nfc_cards WHERE company_id = co.id) as cards_count,
          (SELECT COUNT(*)::int FROM leads WHERE company_id = co.id) as leads_count,
          (SELECT COUNT(*)::int FROM company_memberships WHERE company_id = co.id) as members_count
        FROM companies co
        WHERE
          _search = '' OR
          co.name ILIKE '%' || _search || '%' OR
          co.slug ILIKE '%' || _search || '%'
        ORDER BY co.created_at DESC
        LIMIT _limit OFFSET _offset
      ) t
    ), '[]'::json),
    'total', (
      SELECT COUNT(*)::int FROM companies
      WHERE _search = '' OR name ILIKE '%' || _search || '%' OR slug ILIKE '%' || _search || '%'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- =============================================
-- RPC: get_admin_company_detail
-- =============================================

CREATE OR REPLACE FUNCTION public.get_admin_company_detail(_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'company', row_to_json(co),
    'profiles', COALESCE((SELECT json_agg(row_to_json(p)) FROM profiles p WHERE p.company_id = co.id), '[]'::json),
    'cards', COALESCE((SELECT json_agg(row_to_json(nc)) FROM nfc_cards nc WHERE nc.company_id = co.id), '[]'::json),
    'members', COALESCE((SELECT json_agg(row_to_json(cm)) FROM company_memberships cm WHERE cm.company_id = co.id), '[]'::json),
    'integrations', COALESCE((SELECT json_agg(row_to_json(i)) FROM integrations i WHERE i.company_id = co.id), '[]'::json),
    'stats', json_build_object(
      'total_leads', (SELECT COUNT(*)::int FROM leads WHERE company_id = co.id),
      'total_views', (SELECT COUNT(*)::int FROM events WHERE company_id = co.id AND event_type = 'profile_view'),
      'total_clicks', (SELECT COUNT(*)::int FROM events WHERE company_id = co.id AND event_type = 'cta_click'),
      'leads_this_month', (SELECT COUNT(*)::int FROM leads WHERE company_id = co.id AND created_at >= date_trunc('month', CURRENT_DATE))
    )
  ) INTO result
  FROM companies co
  WHERE co.id = _company_id;

  RETURN result;
END;
$$;


-- 1. KPI counts for DashboardOverview
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(_company_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'cards', (SELECT count(*) FROM nfc_cards WHERE company_id = _company_id AND status = 'active'),
    'profiles', (SELECT count(*) FROM profiles WHERE company_id = _company_id AND published = true),
    'views', (SELECT count(*) FROM events WHERE company_id = _company_id AND event_type = 'profile_view'),
    'clicks', (SELECT count(*) FROM events WHERE company_id = _company_id AND event_type = 'cta_click')
  );
$$;

-- 2. Daily chart data (last 7 days) for DashboardOverview
CREATE OR REPLACE FUNCTION public.get_daily_chart(_company_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT coalesce(json_agg(row_to_json(t) ORDER BY t.d), '[]'::json)
  FROM (
    SELECT
      d::date AS d,
      to_char(d, 'Dy') AS date,
      coalesce(sum(CASE WHEN e.event_type = 'profile_view' THEN 1 END), 0) AS views,
      coalesce(sum(CASE WHEN e.event_type = 'cta_click' THEN 1 END), 0) AS clicks
    FROM generate_series(current_date - 6, current_date, '1 day') AS d
    LEFT JOIN events e ON e.company_id = _company_id
      AND e.created_at::date = d::date
      AND e.event_type IN ('profile_view', 'cta_click')
    GROUP BY d
  ) t;
$$;

-- 3. Monthly chart data (last 6 months) for DashboardAnalytics
CREATE OR REPLACE FUNCTION public.get_monthly_chart(_company_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT coalesce(json_agg(row_to_json(t) ORDER BY t.m), '[]'::json)
  FROM (
    SELECT
      m,
      to_char(m, 'Mon') AS month,
      coalesce(sum(CASE WHEN e.event_type = 'profile_view' THEN 1 END), 0) AS views,
      coalesce(sum(CASE WHEN e.event_type = 'lead_submit' THEN 1 END), 0) AS leads
    FROM generate_series(
      date_trunc('month', current_date) - interval '5 months',
      date_trunc('month', current_date),
      '1 month'
    ) AS m
    LEFT JOIN events e ON e.company_id = _company_id
      AND date_trunc('month', e.created_at) = m
      AND e.event_type IN ('profile_view', 'lead_submit')
    GROUP BY m
  ) t;
$$;

-- 4. CTA distribution for DashboardAnalytics
CREATE OR REPLACE FUNCTION public.get_cta_distribution(_company_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT coalesce(json_agg(json_build_object('name', 
    CASE cta_type
      WHEN 'whatsapp' THEN 'WhatsApp'
      WHEN 'instagram' THEN 'Instagram'
      WHEN 'linkedin' THEN 'LinkedIn'
      WHEN 'website' THEN 'Website'
      WHEN 'save_contact' THEN 'Salvar Contato'
      ELSE coalesce(cta_type, 'outro')
    END,
    'value', cnt
  )), '[]'::json)
  FROM (
    SELECT coalesce(cta_type, 'outro') AS cta_type, count(*) AS cnt
    FROM events
    WHERE company_id = _company_id AND event_type = 'cta_click'
    GROUP BY coalesce(cta_type, 'outro')
  ) t;
$$;

-- Grant execute to authenticated and anon (RPC needs it, but SECURITY DEFINER handles access)
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_chart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_chart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cta_distribution(uuid) TO authenticated;

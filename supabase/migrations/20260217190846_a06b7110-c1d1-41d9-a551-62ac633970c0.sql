
-- Coupons (must be created before subscriptions due to FK)
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_until TIMESTAMPTZ,
  applicable_plans UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plans
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  trial_days INTEGER DEFAULT 14,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan features
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_value TEXT NOT NULL,
  UNIQUE(plan_id, feature_key)
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'suspended')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  trial_end TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  coupon_id UUID REFERENCES coupons(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'canceled')),
  description TEXT,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount INTEGER NOT NULL,
  method TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  stripe_payment_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription events
CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_plan_id UUID REFERENCES plans(id),
  new_plan_id UUID REFERENCES plans(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed plans
INSERT INTO plans (name, slug, description, price_monthly, price_yearly, trial_days, is_active, is_default, sort_order) VALUES
  ('Free', 'free', 'Para começar a experimentar', 0, 0, 0, true, true, 0),
  ('Pro', 'pro', 'Para profissionais e pequenas equipes', 4990, 47900, 14, true, false, 1),
  ('Business', 'business', 'Para empresas que precisam de escala', 14990, 143900, 14, true, false, 2);

-- Seed plan features - Free
INSERT INTO plan_features (plan_id, feature_key, feature_value)
SELECT id, key, value FROM plans CROSS JOIN (VALUES
  ('max_profiles', '1'),
  ('max_cards', '1'),
  ('max_leads_month', '50'),
  ('max_members', '1'),
  ('webhooks', 'false'),
  ('hide_branding', 'false'),
  ('custom_colors', 'false'),
  ('csv_export', 'false'),
  ('analytics', 'basic')
) AS features(key, value) WHERE slug = 'free';

-- Seed plan features - Pro
INSERT INTO plan_features (plan_id, feature_key, feature_value)
SELECT id, key, value FROM plans CROSS JOIN (VALUES
  ('max_profiles', '10'),
  ('max_cards', '20'),
  ('max_leads_month', '500'),
  ('max_members', '5'),
  ('webhooks', 'true'),
  ('hide_branding', 'true'),
  ('custom_colors', 'true'),
  ('csv_export', 'true'),
  ('analytics', 'full')
) AS features(key, value) WHERE slug = 'pro';

-- Seed plan features - Business
INSERT INTO plan_features (plan_id, feature_key, feature_value)
SELECT id, key, value FROM plans CROSS JOIN (VALUES
  ('max_profiles', 'unlimited'),
  ('max_cards', 'unlimited'),
  ('max_leads_month', 'unlimited'),
  ('max_members', 'unlimited'),
  ('webhooks', 'true'),
  ('hide_branding', 'true'),
  ('custom_colors', 'true'),
  ('csv_export', 'true'),
  ('analytics', 'full'),
  ('priority_support', 'true'),
  ('custom_domain', 'true')
) AS features(key, value) WHERE slug = 'business';

-- RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Plans policies
CREATE POLICY "Anyone can view active plans" ON plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage plans" ON plans FOR ALL USING (is_platform_admin());

-- Plan features policies
CREATE POLICY "Anyone can view plan features" ON plan_features FOR SELECT USING (true);
CREATE POLICY "Admins manage plan features" ON plan_features FOR ALL USING (is_platform_admin());

-- Subscriptions policies
CREATE POLICY "Company can view own subscription" ON subscriptions FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins manage subscriptions" ON subscriptions FOR ALL USING (is_platform_admin());

-- Invoices policies
CREATE POLICY "Company can view own invoices" ON invoices FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins manage invoices" ON invoices FOR ALL USING (is_platform_admin());

-- Payments policies
CREATE POLICY "Company can view own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND is_company_member(i.company_id))
);
CREATE POLICY "Admins manage payments" ON payments FOR ALL USING (is_platform_admin());

-- Coupons policies
CREATE POLICY "Admins manage coupons" ON coupons FOR ALL USING (is_platform_admin());
CREATE POLICY "Anyone can validate coupons" ON coupons FOR SELECT USING (is_active = true);

-- Subscription events policies
CREATE POLICY "Company can view own events" ON subscription_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_id AND is_company_member(s.company_id))
);
CREATE POLICY "Admins manage subscription events" ON subscription_events FOR ALL USING (is_platform_admin());

-- Triggers
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create free subscription for existing companies
INSERT INTO subscriptions (company_id, plan_id, status, billing_cycle, current_period_end, trial_end)
SELECT
  c.id,
  (SELECT id FROM plans WHERE slug = 'free'),
  'active',
  'monthly',
  '2099-12-31'::timestamptz,
  NULL
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.company_id = c.id);

-- Trigger to auto-create subscription for new companies
CREATE OR REPLACE FUNCTION public.auto_create_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (company_id, plan_id, status, billing_cycle, current_period_end, trial_end)
  VALUES (
    NEW.id,
    (SELECT id FROM plans WHERE is_default = true LIMIT 1),
    'active',
    'monthly',
    '2099-12-31'::timestamptz,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_create_subscription_on_company
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_subscription();

-- RPC: get_admin_subscriptions
CREATE OR REPLACE FUNCTION public.get_admin_subscriptions(
  _status TEXT DEFAULT '',
  _plan_slug TEXT DEFAULT '',
  _search TEXT DEFAULT '',
  _limit INT DEFAULT 20,
  _offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result JSON;
BEGIN
  IF NOT is_platform_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT json_build_object(
    'data', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT
          s.id, s.status, s.billing_cycle,
          s.current_period_start, s.current_period_end,
          s.trial_end, s.canceled_at, s.stripe_subscription_id,
          s.created_at,
          json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logo_url', c.logo_url) as company,
          json_build_object('id', p.id, 'name', p.name, 'slug', p.slug, 'price_monthly', p.price_monthly) as plan
        FROM subscriptions s
        JOIN companies c ON c.id = s.company_id
        JOIN plans p ON p.id = s.plan_id
        WHERE
          (_status = '' OR s.status = _status)
          AND (_plan_slug = '' OR p.slug = _plan_slug)
          AND (_search = '' OR c.name ILIKE '%' || _search || '%')
        ORDER BY s.created_at DESC
        LIMIT _limit OFFSET _offset
      ) t
    ), '[]'::json),
    'total', (
      SELECT COUNT(*)::int FROM subscriptions s
      JOIN companies c ON c.id = s.company_id
      JOIN plans p ON p.id = s.plan_id
      WHERE
        (_status = '' OR s.status = _status)
        AND (_plan_slug = '' OR p.slug = _plan_slug)
        AND (_search = '' OR c.name ILIKE '%' || _search || '%')
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- RPC: get_admin_billing_kpis
CREATE OR REPLACE FUNCTION public.get_admin_billing_kpis()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result JSON;
BEGIN
  IF NOT is_platform_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT json_build_object(
    'mrr', COALESCE((
      SELECT SUM(p.price_monthly) FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id
      WHERE s.status IN ('active', 'trial') AND p.price_monthly > 0
    ), 0),
    'arr', COALESCE((
      SELECT SUM(p.price_monthly) * 12 FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id
      WHERE s.status IN ('active', 'trial') AND p.price_monthly > 0
    ), 0),
    'total_paying', (SELECT COUNT(*)::int FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.status = 'active' AND p.price_monthly > 0),
    'total_free', (SELECT COUNT(*)::int FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE p.slug = 'free'),
    'total_trial', (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'trial'),
    'total_canceled', (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'canceled'),
    'total_past_due', (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'past_due'),
    'revenue_month', COALESCE((SELECT SUM(amount) FROM invoices WHERE status = 'paid' AND paid_at >= date_trunc('month', CURRENT_DATE)), 0),
    'pending_invoices', (SELECT COUNT(*)::int FROM invoices WHERE status = 'pending'),
    'pending_amount', COALESCE((SELECT SUM(amount) FROM invoices WHERE status = 'pending'), 0)
  ) INTO result;

  RETURN result;
END;
$$;

-- Update get_admin_company_detail to include subscription
CREATE OR REPLACE FUNCTION public.get_admin_company_detail(_company_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    'subscription', (
      SELECT row_to_json(sub) FROM (
        SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.price_monthly
        FROM subscriptions s JOIN plans p ON p.id = s.plan_id
        WHERE s.company_id = co.id
      ) sub
    ),
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


-- ==================== companies ====================
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Members can view their company" ON companies;
DROP POLICY IF EXISTS "Admins can update their company" ON companies;
DROP POLICY IF EXISTS "Admins can delete their company" ON companies;

CREATE POLICY "Authenticated users can create companies" ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Members can view their company" ON companies FOR SELECT TO authenticated USING (is_company_member(id));
CREATE POLICY "Admins can update their company" ON companies FOR UPDATE TO authenticated USING (is_company_admin(id));
CREATE POLICY "Admins can delete their company" ON companies FOR DELETE TO authenticated USING (is_company_admin(id));

-- ==================== company_memberships ====================
DROP POLICY IF EXISTS "Users can create their own membership" ON company_memberships;
DROP POLICY IF EXISTS "Admins can insert memberships" ON company_memberships;
DROP POLICY IF EXISTS "Members can view memberships" ON company_memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON company_memberships;
DROP POLICY IF EXISTS "Admins can delete memberships" ON company_memberships;

CREATE POLICY "Users can create their own membership" ON company_memberships FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can insert memberships" ON company_memberships FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Members can view memberships" ON company_memberships FOR SELECT TO authenticated USING (is_company_member(company_id));
CREATE POLICY "Admins can update memberships" ON company_memberships FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins can delete memberships" ON company_memberships FOR DELETE TO authenticated USING (is_company_admin(company_id) AND user_id <> auth.uid());

-- ==================== events ====================
DROP POLICY IF EXISTS "Anyone can create events" ON events;
DROP POLICY IF EXISTS "Members can view events" ON events;

CREATE POLICY "Anyone can create events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can view events" ON events FOR SELECT TO authenticated USING (is_company_member(company_id));

-- ==================== leads ====================
DROP POLICY IF EXISTS "Anyone can submit leads" ON leads;
DROP POLICY IF EXISTS "Members can view leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;

CREATE POLICY "Anyone can submit leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can view leads" ON leads FOR SELECT TO authenticated USING (is_company_member(company_id));
CREATE POLICY "Admins can delete leads" ON leads FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- ==================== nfc_cards ====================
DROP POLICY IF EXISTS "Members can create cards" ON nfc_cards;
DROP POLICY IF EXISTS "Members can view cards" ON nfc_cards;
DROP POLICY IF EXISTS "Members can update cards" ON nfc_cards;
DROP POLICY IF EXISTS "Admins can delete cards" ON nfc_cards;

CREATE POLICY "Members can create cards" ON nfc_cards FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can view cards" ON nfc_cards FOR SELECT TO authenticated USING (is_company_member(company_id));
CREATE POLICY "Members can update cards" ON nfc_cards FOR UPDATE TO authenticated USING (is_company_member(company_id));
CREATE POLICY "Admins can delete cards" ON nfc_cards FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- ==================== profile_layouts ====================
DROP POLICY IF EXISTS "Admins can create layouts" ON profile_layouts;
DROP POLICY IF EXISTS "Anyone can view layouts for rendering" ON profile_layouts;
DROP POLICY IF EXISTS "Members can view layouts" ON profile_layouts;
DROP POLICY IF EXISTS "Admins can update layouts" ON profile_layouts;

CREATE POLICY "Admins can create layouts" ON profile_layouts FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Anyone can view layouts for rendering" ON profile_layouts FOR SELECT USING (true);
CREATE POLICY "Members can view layouts" ON profile_layouts FOR SELECT TO authenticated USING (is_company_member(company_id));
CREATE POLICY "Admins can update layouts" ON profile_layouts FOR UPDATE TO authenticated USING (is_company_admin(company_id));

-- ==================== profiles ====================
DROP POLICY IF EXISTS "Members can create profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view published profiles" ON profiles;
DROP POLICY IF EXISTS "Members can view profiles" ON profiles;
DROP POLICY IF EXISTS "Members can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "Members can create profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id));
CREATE POLICY "Anyone can view published profiles" ON profiles FOR SELECT USING (published = true);
CREATE POLICY "Members can view profiles" ON profiles FOR SELECT TO authenticated USING (is_company_member(company_id));
CREATE POLICY "Members can update profiles" ON profiles FOR UPDATE TO authenticated USING (is_company_member(company_id));
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE TO authenticated USING (is_company_admin(company_id));

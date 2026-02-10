

## Fix: Company Creation Fails Due to SELECT Policy on RETURNING Clause

### Root Cause
The INSERT into `companies` succeeds (policy: `WITH CHECK (true)`), but the Supabase client uses `.select().single()` which adds a `RETURNING *` clause. This triggers the **SELECT** RLS policy check (`is_company_member(id)`). Since the user hasn't been added to `company_memberships` yet at that point, the SELECT check fails and the entire operation returns a 403 error.

### Solution
Create a database function that wraps company creation and membership assignment in a single operation, bypassing the SELECT policy issue. The function runs as `SECURITY DEFINER` so it can return the company data without hitting the user-level SELECT policy.

### Changes Required

**1. New database migration** -- Create a `create_company_with_membership` function:
- Accepts the company name
- Inserts into `companies`
- Inserts into `company_memberships` with the current user as admin
- Returns the company ID
- Uses `SECURITY DEFINER` to bypass RLS for the internal operations

**2. Update `src/pages/Onboarding.tsx`** -- Replace the two separate inserts with a single RPC call:
```typescript
const { data, error } = await supabase.rpc("create_company_with_membership", {
  _name: name.trim(),
});
```

### Technical Details

The database function:
```sql
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
```

The Onboarding.tsx update removes the two separate queries and uses a single `supabase.rpc()` call. If it succeeds, it redirects to `/dashboard`.

No other files need to change.

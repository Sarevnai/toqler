

## Fix: "Erro ao criar empresa" - RLS Policy Issue

### Problem
All RLS policies on the `companies` table (and likely other tables) are set as **RESTRICTIVE** instead of **PERMISSIVE**. PostgreSQL RLS requires at least one permissive policy to grant access -- restrictive policies alone always deny.

The INSERT to `companies` returns a 403 error: `"new row violates row-level security policy for table \"companies\""`.

### Solution
Drop and recreate the RLS policies on all tables as **PERMISSIVE** (which is the default). This affects:

1. **companies** - INSERT, SELECT, UPDATE, DELETE policies
2. **company_memberships** - INSERT, SELECT, UPDATE, DELETE policies
3. **events** - INSERT, SELECT policies
4. **leads** - INSERT, SELECT, DELETE policies
5. **nfc_cards** - INSERT, SELECT, UPDATE, DELETE policies
6. **profile_layouts** - INSERT, SELECT, UPDATE policies
7. **profiles** - INSERT, SELECT, UPDATE, DELETE policies

### Technical Details

A single SQL migration will:
- DROP each existing restrictive policy
- Recreate them as PERMISSIVE (default) with the same logic

For example, the companies INSERT policy will change from:
```sql
-- RESTRICTIVE (current - broken)
CREATE POLICY "Authenticated users can create companies"
ON companies FOR INSERT TO authenticated
WITH CHECK (true);
```
To:
```sql
-- PERMISSIVE (fixed)
CREATE POLICY "Authenticated users can create companies"
ON companies FOR INSERT TO authenticated
WITH CHECK (true);
```

The only difference is removing the `AS RESTRICTIVE` clause that was used in the original migration. No code changes are needed -- only the database policies.


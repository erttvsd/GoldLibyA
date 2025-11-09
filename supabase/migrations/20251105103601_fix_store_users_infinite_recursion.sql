/*
  # Fix Infinite Recursion in store_users RLS Policies

  ## Problem
  Multiple policies on `store_users` table query `store_users` itself, causing infinite recursion:
  - "Store owners can delete store users" does: SELECT FROM store_users WHERE EXISTS (SELECT FROM store_users...)
  - "Store owners can insert team members" does the same
  - "Store owners can update store users" does the same
  - "Users can view store members where they are members" does the same
  - Several other policies have this issue

  ## Solution
  1. Drop ALL policies on `store_users` that cause recursion
  2. Create helper functions with SECURITY DEFINER to bypass RLS
  3. Create simple, non-recursive policies using these helper functions

  ## Security
  - All helper functions use SECURITY DEFINER to bypass RLS safely
  - Functions are marked STABLE for query optimization
  - search_path is locked down for security
*/

-- Step 1: Drop all problematic policies
DROP POLICY IF EXISTS "Store admins manage staff delete" ON store_users;
DROP POLICY IF EXISTS "Store admins manage staff insert" ON store_users;
DROP POLICY IF EXISTS "Store admins manage staff update" ON store_users;
DROP POLICY IF EXISTS "Store owners can delete store users" ON store_users;
DROP POLICY IF EXISTS "Store owners can delete team members" ON store_users;
DROP POLICY IF EXISTS "Store owners can insert store users" ON store_users;
DROP POLICY IF EXISTS "Store owners can insert team members" ON store_users;
DROP POLICY IF EXISTS "Store owners can update store users" ON store_users;
DROP POLICY IF EXISTS "Store owners can update team members" ON store_users;
DROP POLICY IF EXISTS "Users can view own store user record" ON store_users;
DROP POLICY IF EXISTS "Users can view own store user records" ON store_users;
DROP POLICY IF EXISTS "Users can view store members where they are members" ON store_users;
DROP POLICY IF EXISTS "Users can view store team members" ON store_users;
DROP POLICY IF EXISTS "Users view own store assignments" ON store_users;
DROP POLICY IF EXISTS "Users view store colleagues" ON store_users;

-- Step 2: Create helper functions with SECURITY DEFINER

-- Check if user is owner/manager at a store (for management operations)
CREATE OR REPLACE FUNCTION is_store_manager(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_users
    WHERE store_id = p_store_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
    AND is_active = true
  );
$$;

-- Check if user is admin at a store
CREATE OR REPLACE FUNCTION is_store_admin(p_user_id uuid, p_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_users
    WHERE store_id = p_store_id
    AND user_id = p_user_id
    AND role IN ('owner', 'manager')
    AND is_active = true
  );
$$;

-- Get list of store IDs where user is a member
CREATE OR REPLACE FUNCTION get_user_store_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT store_id FROM store_users
  WHERE user_id = auth.uid()
  AND is_active = true;
$$;

-- Recreate is_store_user to ensure proper configuration
CREATE OR REPLACE FUNCTION is_store_user(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_users
    WHERE store_id = p_store_id
    AND user_id = auth.uid()
    AND is_active = true
  );
$$;

-- Step 3: Create simple, non-recursive policies

-- Policy 1: Users can view their own store assignments
CREATE POLICY "Users view own assignments"
  ON store_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can view colleagues at stores where they are members
CREATE POLICY "Users view store colleagues"
  ON store_users FOR SELECT
  TO authenticated
  USING (store_id IN (SELECT get_user_store_ids()));

-- Policy 3: Store managers can insert new staff
CREATE POLICY "Managers insert staff"
  ON store_users FOR INSERT
  TO authenticated
  WITH CHECK (is_store_manager(store_id));

-- Policy 4: Store managers can update staff records
CREATE POLICY "Managers update staff"
  ON store_users FOR UPDATE
  TO authenticated
  USING (is_store_manager(store_id))
  WITH CHECK (is_store_manager(store_id));

-- Policy 5: Store managers can delete staff records
CREATE POLICY "Managers delete staff"
  ON store_users FOR DELETE
  TO authenticated
  USING (is_store_manager(store_id));

-- Add helpful comments
COMMENT ON FUNCTION is_store_user IS 'Checks if current user is an active store user. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
COMMENT ON FUNCTION is_store_manager IS 'Checks if current user is an owner or manager at the store. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
COMMENT ON FUNCTION is_store_admin IS 'Checks if specified user is an admin at the store. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
COMMENT ON FUNCTION get_user_store_ids IS 'Returns all store IDs where current user is an active member. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

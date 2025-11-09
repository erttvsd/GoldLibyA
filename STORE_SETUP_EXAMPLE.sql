-- Store Console Setup Example
-- Run these queries to set up a test store user

-- 1. Find your user ID
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Find the store ID (دار السكة)
-- SELECT id, name FROM stores WHERE name = 'دار السكة';

-- 3. Assign user to store as a clerk
-- Replace <user_id> and <store_id> with actual IDs from steps 1 and 2
INSERT INTO store_users (store_id, user_id, role, can_approve_high_value, is_active)
VALUES (
  '<store_id>', -- e.g., '12345678-1234-1234-1234-123456789012'
  '<user_id>',   -- e.g., '87654321-4321-4321-4321-210987654321'
  'clerk',       -- Options: 'owner', 'manager', 'clerk', 'vault', 'auditor', 'support'
  false,         -- Set true for owner/manager to approve high-value transactions
  true           -- Active status
)
ON CONFLICT (store_id, user_id)
DO UPDATE SET
  role = EXCLUDED.role,
  is_active = true;

-- 4. Update profile to show store console in navigation
-- Replace <user_id> with the user ID
UPDATE profiles
SET account_type = 'store'
WHERE id = '<user_id>';

-- 5. Verify setup
-- SELECT
--   su.*,
--   s.name as store_name,
--   p.first_name || ' ' || p.last_name as user_name,
--   p.account_type
-- FROM store_users su
-- JOIN stores s ON s.id = su.store_id
-- JOIN profiles p ON p.id = su.user_id
-- WHERE su.user_id = '<user_id>';

-- ======================================
-- Complete Example (Replace values)
-- ======================================

-- Example: Assign current logged-in user to دار السكة as manager
DO $$
DECLARE
  v_store_id uuid;
  v_user_id uuid;
BEGIN
  -- Get user (replace with your actual user ID or email lookup)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'test@example.com';

  -- Get store
  SELECT id INTO v_store_id FROM stores WHERE name = 'دار السكة' LIMIT 1;

  IF v_user_id IS NOT NULL AND v_store_id IS NOT NULL THEN
    -- Assign to store
    INSERT INTO store_users (store_id, user_id, role, can_approve_high_value, is_active)
    VALUES (v_store_id, v_user_id, 'manager', true, true)
    ON CONFLICT (store_id, user_id)
    DO UPDATE SET role = 'manager', can_approve_high_value = true, is_active = true;

    -- Update profile
    UPDATE profiles SET account_type = 'store' WHERE id = v_user_id;

    RAISE NOTICE 'User assigned to store successfully!';
  ELSE
    RAISE NOTICE 'User or store not found. Check email and store name.';
  END IF;
END $$;

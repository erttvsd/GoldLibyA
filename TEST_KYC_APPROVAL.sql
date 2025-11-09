-- Test Store KYC Approval and Automatic Store Creation
-- This script demonstrates how to approve a KYC and trigger automatic store creation

-- Step 1: Check existing KYC submissions (as admin/compliance)
SELECT
  id,
  user_id,
  business_legal_name,
  status,
  created_at
FROM store_kyc_details
WHERE status = 'under_review'
ORDER BY created_at DESC;

-- Step 2: Approve a KYC (this will automatically create the store)
-- Replace <kyc_id> and <reviewer_user_id> with actual values

-- Example: Approve KYC
UPDATE store_kyc_details
SET
  status = 'approved',
  reviewed_by = '<reviewer_user_id>', -- Put admin/reviewer user ID here
  reviewed_at = now()
WHERE id = '<kyc_id>'; -- Put the KYC ID here

-- The trigger will automatically:
-- 1. Create a cash_deposit_location
-- 2. Create a store
-- 3. Create store_profiles entry
-- 4. Assign user as store owner in store_users
-- 5. Log the approval in store_kyc_verification_log

-- Step 3: Verify the store was created
SELECT
  k.id as kyc_id,
  k.business_legal_name,
  k.status,
  k.store_id,
  s.name as store_name,
  s.is_active,
  l.name as location_name,
  l.address,
  su.role as user_role
FROM store_kyc_details k
LEFT JOIN stores s ON s.id = k.store_id
LEFT JOIN cash_deposit_locations l ON l.id = s.location_id
LEFT JOIN store_users su ON su.store_id = s.id AND su.user_id = k.user_id
WHERE k.id = '<kyc_id>';

-- Step 4: Check the verification log
SELECT
  action,
  notes,
  created_at,
  p.first_name || ' ' || p.last_name as performed_by_name
FROM store_kyc_verification_log l
LEFT JOIN profiles p ON p.id = l.performed_by
WHERE store_kyc_id = '<kyc_id>'
ORDER BY created_at DESC;

-- ============================================
-- COMPLETE EXAMPLE (Copy and modify this)
-- ============================================

-- Find a pending KYC
DO $$
DECLARE
  v_kyc_id uuid;
  v_user_id uuid;
  v_reviewer_id uuid;
BEGIN
  -- Get the first pending KYC
  SELECT id, user_id INTO v_kyc_id, v_user_id
  FROM store_kyc_details
  WHERE status = 'under_review'
  LIMIT 1;

  -- Get an admin/reviewer (use your own user ID or create one)
  SELECT id INTO v_reviewer_id
  FROM auth.users
  WHERE email = 'admin@example.com' -- Replace with your admin email
  LIMIT 1;

  IF v_kyc_id IS NOT NULL THEN
    -- Approve the KYC
    UPDATE store_kyc_details
    SET
      status = 'approved',
      reviewed_by = v_reviewer_id,
      reviewed_at = now()
    WHERE id = v_kyc_id;

    RAISE NOTICE 'KYC % approved! Store will be created automatically.', v_kyc_id;

    -- Wait a moment for trigger to complete
    PERFORM pg_sleep(1);

    -- Show the created store
    RAISE NOTICE 'Store created: %', (
      SELECT s.name
      FROM store_kyc_details k
      JOIN stores s ON s.id = k.store_id
      WHERE k.id = v_kyc_id
    );
  ELSE
    RAISE NOTICE 'No pending KYC found to approve.';
  END IF;
END $$;

-- ============================================
-- Manual KYC Creation for Testing
-- ============================================

-- If you need to create a test KYC:
INSERT INTO store_kyc_details (
  user_id,
  business_legal_name,
  business_type,
  registration_number,
  tax_id,
  registration_date,
  registration_country,
  business_address,
  business_city,
  business_country,
  business_phone,
  business_email,
  industry_sector,
  business_description,
  source_of_funds,
  status
) VALUES (
  '<your_user_id>', -- Replace with your user ID from auth.users
  'Test Trading Company LLC',
  'limited_liability',
  'TEST-123456',
  'TAX-123456',
  '2024-01-01',
  'Libya',
  '123 Test Street',
  'Tripoli',
  'Libya',
  '+218-91-123-4567',
  'test@testcompany.ly',
  'Precious Metals Trading',
  'Gold and silver trading and storage services',
  'business_operations',
  'under_review' -- Start as under_review, ready to be approved
);

-- Then approve it using the steps above!

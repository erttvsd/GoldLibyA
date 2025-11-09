/*
  # Create Stores for Approved KYCs Without Stores

  ## Purpose
  Manually creates stores for all approved store KYCs that don't have stores yet.
  This handles cases where the trigger didn't fire properly.

  ## Changes
  - Identifies approved KYCs without stores
  - Creates cash_deposit_locations
  - Creates stores with all required fields
  - Creates store_profiles
  - Assigns users as store owners
  - Logs all actions
*/

DO $$
DECLARE
  v_kyc_record RECORD;
  v_store_id uuid;
  v_location_id uuid;
  v_store_name text;
  v_manager_name text;
  v_manager_phone text;
  v_manager_email text;
  v_admin_user_id uuid;
  v_count integer := 0;
BEGIN
  -- Get admin user for assignments
  SELECT id INTO v_admin_user_id FROM auth.users LIMIT 1;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Stores for Approved KYCs';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Process each approved KYC without a store
  FOR v_kyc_record IN 
    SELECT * FROM store_kyc_details 
    WHERE status = 'approved' AND store_id IS NULL
  LOOP
    BEGIN
      -- Prepare store name and manager details
      v_store_name := COALESCE(v_kyc_record.business_trade_name, v_kyc_record.business_legal_name);
      v_manager_name := COALESCE(v_kyc_record.compliance_officer_name, 'Store Manager');
      v_manager_phone := COALESCE(v_kyc_record.compliance_officer_phone, v_kyc_record.business_phone);
      v_manager_email := COALESCE(v_kyc_record.compliance_officer_email, v_kyc_record.business_email);
      
      -- Create location
      INSERT INTO cash_deposit_locations (
        name,
        address,
        city,
        phone,
        working_hours,
        working_days,
        branch_code
      ) VALUES (
        v_store_name,
        v_kyc_record.business_address,
        v_kyc_record.business_city,
        v_kyc_record.business_phone,
        '09:00-17:00',
        'Saturday-Thursday',
        SUBSTRING(v_kyc_record.registration_number FROM 1 FOR 10)
      )
      RETURNING id INTO v_location_id;
      
      -- Create store
      INSERT INTO stores (
        name,
        city,
        address,
        location_id,
        phone,
        email,
        is_active
      ) VALUES (
        v_store_name,
        v_kyc_record.business_city,
        v_kyc_record.business_address,
        v_location_id,
        v_kyc_record.business_phone,
        v_kyc_record.business_email,
        true
      )
      RETURNING id INTO v_store_id;
      
      -- Update KYC with store_id
      UPDATE store_kyc_details
      SET store_id = v_store_id
      WHERE id = v_kyc_record.id;
      
      -- Create store_profiles
      INSERT INTO store_profiles (
        user_id,
        store_id,
        location_id,
        business_name,
        business_registration_number,
        tax_id,
        manager_name,
        manager_phone,
        manager_email,
        is_verified,
        is_active
      ) VALUES (
        v_kyc_record.user_id,
        v_store_id,
        v_location_id,
        v_kyc_record.business_legal_name,
        v_kyc_record.registration_number,
        v_kyc_record.tax_id,
        v_manager_name,
        v_manager_phone,
        v_manager_email,
        true,
        true
      )
      ON CONFLICT (user_id) DO UPDATE
      SET store_id = v_store_id,
          location_id = v_location_id,
          business_name = v_kyc_record.business_legal_name,
          business_registration_number = v_kyc_record.registration_number,
          tax_id = v_kyc_record.tax_id,
          manager_name = v_manager_name,
          manager_phone = v_manager_phone,
          manager_email = v_manager_email,
          is_verified = true,
          is_active = true;
      
      -- Assign user as store owner
      INSERT INTO store_users (
        store_id,
        user_id,
        role,
        can_approve_high_value,
        is_active,
        assigned_by
      ) VALUES (
        v_store_id,
        v_kyc_record.user_id,
        'owner',
        true,
        true,
        COALESCE(v_kyc_record.reviewed_by, v_admin_user_id)
      )
      ON CONFLICT (store_id, user_id) DO UPDATE
      SET role = 'owner',
          can_approve_high_value = true,
          is_active = true;
      
      -- Log the creation
      INSERT INTO store_kyc_verification_log (
        store_kyc_id,
        action,
        performed_by,
        notes
      ) VALUES (
        v_kyc_record.id,
        'approved',
        COALESCE(v_kyc_record.reviewed_by, v_admin_user_id),
        'Store created manually: ' || v_store_name
      );
      
      v_count := v_count + 1;
      RAISE NOTICE '✓ Created store: % (City: %)', v_store_name, v_kyc_record.business_city;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '✗ Failed to create store for KYC %: % - %', v_kyc_record.id, SQLSTATE, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Store Creation Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  • Stores created: %', v_count;
  RAISE NOTICE '  • Total active stores: %', (SELECT COUNT(*) FROM stores WHERE is_active = true);
  RAISE NOTICE '  • Total store users: %', (SELECT COUNT(*) FROM store_users WHERE is_active = true);
  RAISE NOTICE '  • Total store profiles: %', (SELECT COUNT(*) FROM store_profiles WHERE is_active = true);
  RAISE NOTICE '';
END $$;

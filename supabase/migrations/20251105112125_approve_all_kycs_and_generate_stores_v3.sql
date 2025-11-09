/*
  # Approve All KYCs and Generate Dummy Store Data - V3

  ## Purpose
  Approves all pending KYCs and generates comprehensive dummy data for testing.

  ## Changes
  1. Approves all individual user KYCs
  2. Approves all store KYCs (triggers automatic store creation)
  3. Creates 5 dummy store KYC applications with complete data
  4. Updates user profiles to 'store' account type
  5. Verifies all stores are created properly
*/

DO $$
DECLARE
  v_admin_user_id uuid;
  v_user_count integer := 0;
  v_store_kyc_count integer := 0;
  v_dummy_user_id uuid;
  v_store_kyc_id uuid;
  v_store_id uuid;
  v_store_name text;
  v_city text;
  i integer;
BEGIN
  -- Get first available user as admin verifier
  SELECT id INTO v_admin_user_id FROM auth.users LIMIT 1;
  
  IF v_admin_user_id IS NULL THEN
    RAISE NOTICE 'No users found in system. Please create users first.';
    RETURN;
  END IF;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Starting KYC Approval and Store Generation';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';

  -- ====================================
  -- STEP 1: Approve All Individual KYCs
  -- ====================================
  RAISE NOTICE 'STEP 1: Approving Individual User KYCs...';
  
  UPDATE kyc_details
  SET 
    verification_status = 'verified',
    verified_at = now(),
    verified_by = v_admin_user_id,
    updated_at = now()
  WHERE verification_status = 'pending';
  
  GET DIAGNOSTICS v_user_count = ROW_COUNT;
  RAISE NOTICE '✓ Approved % individual user KYC records', v_user_count;
  RAISE NOTICE '';

  -- ====================================
  -- STEP 2: Approve All Store KYCs
  -- ====================================
  RAISE NOTICE 'STEP 2: Approving Store/Business KYCs...';
  
  -- This will trigger automatic store creation via the create_store_on_kyc_approval trigger
  UPDATE store_kyc_details
  SET 
    status = 'approved',
    reviewed_by = v_admin_user_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE status IN ('pending', 'under_review');
  
  GET DIAGNOSTICS v_store_kyc_count = ROW_COUNT;
  RAISE NOTICE '✓ Approved % store KYC records', v_store_kyc_count;
  RAISE NOTICE '';

  -- Wait for triggers to complete
  PERFORM pg_sleep(1);

  -- ====================================
  -- STEP 3: Create Dummy Store KYCs
  -- ====================================
  RAISE NOTICE 'STEP 3: Creating Dummy Store KYC Applications...';
  
  -- Create dummy store KYCs for available users
  FOR i IN 1..5 LOOP
    -- Get an existing user without store KYC
    SELECT id INTO v_dummy_user_id 
    FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM store_kyc_details)
    LIMIT 1 OFFSET (i-1);
    
    IF v_dummy_user_id IS NULL THEN
      -- No more users available
      CONTINUE;
    END IF;
    
    -- Create store KYC with all required fields
    INSERT INTO store_kyc_details (
      user_id,
      business_legal_name,
      business_trade_name,
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
      compliance_officer_name,
      compliance_officer_email,
      compliance_officer_phone,
      aml_policy_in_place,
      status,
      reviewed_by,
      reviewed_at
    ) VALUES (
      v_dummy_user_id,
      CASE i
        WHEN 1 THEN 'شركة الذهب الليبي للتجارة'
        WHEN 2 THEN 'مؤسسة طرابلس للمعادن النفيسة'
        WHEN 3 THEN 'شركة النجمة الذهبية'
        WHEN 4 THEN 'مؤسسة بنغازي للذهب والفضة'
        WHEN 5 THEN 'شركة الصحراء للاستثمار في المعادن'
      END,
      CASE i
        WHEN 1 THEN 'Libyan Gold Trading Co.'
        WHEN 2 THEN 'Tripoli Precious Metals Est.'
        WHEN 3 THEN 'Golden Star Company'
        WHEN 4 THEN 'Benghazi Gold & Silver Est.'
        WHEN 5 THEN 'Sahara Metals Investment'
      END,
      CASE WHEN i % 3 = 0 THEN 'corporation' WHEN i % 2 = 0 THEN 'partnership' ELSE 'limited_liability' END,
      'REG-' || LPAD((2024000 + i * 100)::text, 10, '0'),
      'TAX-' || LPAD((300000 + i * 50)::text, 10, '0'),
      CURRENT_DATE - (i * 365 || ' days')::interval,
      'Libya',
      CASE i
        WHEN 1 THEN 'شارع الجمهورية، السوق القديم'
        WHEN 2 THEN 'شارع عمر المختار، وسط المدينة'
        WHEN 3 THEN 'شارع الفاتح، بجانب البنك المركزي'
        WHEN 4 THEN 'شارع جمال عبد الناصر، الصابري'
        WHEN 5 THEN 'شارع المطار، بجوار سيتي سنتر'
      END,
      CASE i
        WHEN 1 THEN 'طرابلس'
        WHEN 2 THEN 'طرابلس'
        WHEN 3 THEN 'بنغازي'
        WHEN 4 THEN 'بنغازي'
        WHEN 5 THEN 'مصراتة'
      END,
      'Libya',
      '+218-91-' || LPAD((i * 111111)::text, 7, '0'),
      'info@store' || i || '.ly',
      'Precious Metals Trading and Storage',
      'تجارة وتخزين المعادن النفيسة بما في ذلك الذهب والفضة، مع خدمات التقييم والصياغة',
      'business_operations',
      'Ahmed Ali Manager' || CASE WHEN i > 1 THEN ' ' || i::text ELSE '' END,
      'compliance@store' || i || '.ly',
      '+218-91-' || LPAD((i * 222222)::text, 7, '0'),
      true,
      'approved',
      v_admin_user_id,
      now()
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_store_kyc_id;
    
    IF v_store_kyc_id IS NOT NULL THEN
      -- Add beneficial owners
      INSERT INTO store_kyc_beneficial_owners (
        store_kyc_id,
        full_name,
        date_of_birth,
        nationality,
        national_id,
        residential_address,
        city,
        country,
        ownership_percentage,
        position_title
      ) VALUES
        (
          v_store_kyc_id,
          'محمد أحمد الشريف',
          '1975-03-15',
          'Libyan',
          'NID-' || LPAD((1000000 + i * 1000)::text, 10, '0'),
          'طرابلس، منطقة الأندلس',
          'طرابلس',
          'Libya',
          60.00,
          'Managing Partner'
        ),
        (
          v_store_kyc_id,
          'فاطمة علي المهدي',
          '1980-07-22',
          'Libyan',
          'NID-' || LPAD((2000000 + i * 1000)::text, 10, '0'),
          'بنغازي، منطقة الفويهات',
          'بنغازي',
          'Libya',
          40.00,
          'Partner'
        );
      
      -- Add authorized persons
      INSERT INTO store_kyc_authorized_persons (
        store_kyc_id,
        full_name,
        position_title,
        national_id,
        date_of_birth,
        nationality,
        phone,
        email,
        authorization_level,
        can_sign_contracts,
        can_approve_transactions,
        transaction_limit_lyd
      ) VALUES
        (
          v_store_kyc_id,
          'خالد محمود النائب',
          'General Manager',
          'NID-' || LPAD((3000000 + i * 1000)::text, 10, '0'),
          '1985-11-10',
          'Libyan',
          '+218-93-' || LPAD((i * 300000)::text, 7, '0'),
          'manager' || i || '@store' || i || '.ly',
          'full',
          true,
          true,
          100000.000
        );
      
      RAISE NOTICE '✓ Created dummy store KYC #%', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';

  -- Wait for triggers to complete
  PERFORM pg_sleep(1);

  -- ====================================
  -- STEP 4: Update User Profiles
  -- ====================================
  RAISE NOTICE 'STEP 4: Updating User Profiles...';
  
  UPDATE profiles
  SET account_type = 'store'
  WHERE id IN (
    SELECT user_id FROM store_kyc_details WHERE status = 'approved'
  );
  
  RAISE NOTICE '✓ Updated user profiles to store account type';
  RAISE NOTICE '';

  -- ====================================
  -- STEP 5: Verify Store Creation
  -- ====================================
  RAISE NOTICE 'STEP 5: Verification Summary';
  RAISE NOTICE '----------------------------------------';
  
  FOR v_store_kyc_id, v_store_id, v_store_name, v_city IN 
    SELECT k.id, k.store_id, s.name, s.city
    FROM store_kyc_details k 
    LEFT JOIN stores s ON s.id = k.store_id
    WHERE k.status = 'approved'
    ORDER BY k.created_at
  LOOP
    IF v_store_id IS NOT NULL THEN
      RAISE NOTICE '✓ Store: % (City: %)', v_store_name, v_city;
    ELSE
      RAISE NOTICE '⚠ Store not created for KYC: %', v_store_kyc_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'COMPLETION SUMMARY';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '  • Individual KYCs approved: %', v_user_count;
  RAISE NOTICE '  • Store KYCs approved: %', v_store_kyc_count;
  RAISE NOTICE '  • Total active stores: %', (SELECT COUNT(*) FROM stores WHERE is_active = true);
  RAISE NOTICE '  • Total store users: %', (SELECT COUNT(*) FROM store_users WHERE is_active = true);
  RAISE NOTICE '  • Total store profiles: %', (SELECT COUNT(*) FROM store_profiles WHERE is_active = true);
  RAISE NOTICE '';
  RAISE NOTICE '✓ All users can now access their accounts';
  RAISE NOTICE '✓ Store owners can access the Store Console';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: % - %', SQLSTATE, SQLERRM;
    RAISE;
END $$;

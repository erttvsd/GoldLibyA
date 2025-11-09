/*
  # Fix Store Creation Trigger - Complete Version

  ## Purpose
  Updates the create_store_on_kyc_approval trigger function to include
  all required fields for stores and store_profiles tables.

  ## Changes
  - Updates trigger function to include all NOT NULL fields
  - Adds business_name, manager_name, manager_phone, manager_email to store_profiles
  - Ensures all constraints are satisfied
*/

CREATE OR REPLACE FUNCTION create_store_on_kyc_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_store_id uuid;
  v_location_id uuid;
  v_store_name text;
  v_manager_name text;
  v_manager_phone text;
  v_manager_email text;
BEGIN
  -- Only proceed if status changed to 'approved' and no store exists yet
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.store_id IS NULL THEN
    
    -- Use business legal name or trade name for store
    v_store_name := COALESCE(NEW.business_trade_name, NEW.business_legal_name);
    
    -- Get manager details (use compliance officer or default values)
    v_manager_name := COALESCE(NEW.compliance_officer_name, 'Store Manager');
    v_manager_phone := COALESCE(NEW.compliance_officer_phone, NEW.business_phone);
    v_manager_email := COALESCE(NEW.compliance_officer_email, NEW.business_email);
    
    -- Create or get location
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
      NEW.business_address,
      NEW.business_city,
      NEW.business_phone,
      '09:00-17:00',
      'Saturday-Thursday',
      SUBSTRING(NEW.registration_number FROM 1 FOR 10)
    )
    RETURNING id INTO v_location_id;
    
    -- Create store with all required fields
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
      NEW.business_city,
      NEW.business_address,
      v_location_id,
      NEW.business_phone,
      NEW.business_email,
      true
    )
    RETURNING id INTO v_store_id;
    
    -- Update KYC with store_id
    UPDATE store_kyc_details
    SET store_id = v_store_id
    WHERE id = NEW.id;
    
    -- Create store_profiles entry with all required fields
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
      NEW.user_id,
      v_store_id,
      v_location_id,
      NEW.business_legal_name,
      NEW.registration_number,
      NEW.tax_id,
      v_manager_name,
      v_manager_phone,
      v_manager_email,
      true,
      true
    )
    ON CONFLICT (user_id) DO UPDATE
    SET store_id = v_store_id,
        location_id = v_location_id,
        business_name = NEW.business_legal_name,
        business_registration_number = NEW.registration_number,
        tax_id = NEW.tax_id,
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
      NEW.user_id,
      'owner',
      true,
      true,
      NEW.reviewed_by
    )
    ON CONFLICT (store_id, user_id) DO UPDATE
    SET role = 'owner',
        can_approve_high_value = true,
        is_active = true;
    
    -- Log the store creation
    INSERT INTO store_kyc_verification_log (
      store_kyc_id,
      action,
      performed_by,
      notes
    ) VALUES (
      NEW.id,
      'approved',
      NEW.reviewed_by,
      'Store created automatically: ' || v_store_name
    );
    
    RAISE NOTICE 'Store created: % (ID: %)', v_store_name, v_store_id;
  END IF;
  
  RETURN NEW;
END;
$$;

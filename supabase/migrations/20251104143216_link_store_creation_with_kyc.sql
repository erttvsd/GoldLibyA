/*
  # Link Store Creation with KYC Approval
  
  ## Purpose
  Automatically create a store and assign the user when their KYC is approved
  
  ## Changes
  1. Add trigger to create store on KYC approval
  2. Create store_profiles entry for the user
  3. Assign user as store owner
  4. Link store to KYC details
*/

-- Add store_id to store_kyc_details to link back to created store
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_kyc_details' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE store_kyc_details ADD COLUMN store_id uuid REFERENCES stores(id);
  END IF;
END $$;

-- Function to create store on KYC approval
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
BEGIN
  -- Only proceed if status changed to 'approved' and no store exists yet
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.store_id IS NULL THEN
    
    -- Use business legal name or trade name for store
    v_store_name := COALESCE(NEW.business_trade_name, NEW.business_legal_name);
    
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
    
    -- Create store
    INSERT INTO stores (
      name,
      location_id,
      phone,
      email,
      is_active
    ) VALUES (
      v_store_name,
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
    
    -- Create store_profiles entry
    INSERT INTO store_profiles (
      user_id,
      store_id,
      location_id
    ) VALUES (
      NEW.user_id,
      v_store_id,
      v_location_id
    )
    ON CONFLICT (user_id) DO UPDATE
    SET store_id = v_store_id,
        location_id = v_location_id;
    
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

-- Create trigger
DROP TRIGGER IF EXISTS store_kyc_approval_trigger ON store_kyc_details;

CREATE TRIGGER store_kyc_approval_trigger
  AFTER UPDATE ON store_kyc_details
  FOR EACH ROW
  EXECUTE FUNCTION create_store_on_kyc_approval();

-- Function to check if user has approved KYC
CREATE OR REPLACE FUNCTION has_approved_store_kyc(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_kyc_details
    WHERE user_id = p_user_id
    AND status = 'approved'
  );
$$;

-- Update store_profiles to ensure it exists for store accounts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_profiles') THEN
    CREATE TABLE store_profiles (
      user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      store_id uuid REFERENCES stores(id),
      location_id uuid REFERENCES cash_deposit_locations(id),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
  
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_profiles' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE store_profiles ADD COLUMN location_id uuid REFERENCES cash_deposit_locations(id);
  END IF;
END $$;

-- RLS for store_profiles
ALTER TABLE store_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own store profile" ON store_profiles;
CREATE POLICY "Users can view own store profile"
  ON store_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own store profile" ON store_profiles;
CREATE POLICY "Users can update own store profile"
  ON store_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Helper function to get user's store
CREATE OR REPLACE FUNCTION get_user_store(p_user_id uuid)
RETURNS TABLE(
  store_id uuid,
  store_name text,
  location_id uuid,
  location_name text,
  kyc_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    s.id as store_id,
    s.name as store_name,
    s.location_id,
    l.name as location_name,
    k.status as kyc_status
  FROM stores s
  JOIN cash_deposit_locations l ON l.id = s.location_id
  LEFT JOIN store_kyc_details k ON k.store_id = s.id
  WHERE k.user_id = p_user_id
  AND k.status = 'approved'
  LIMIT 1;
$$;

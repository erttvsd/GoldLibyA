/*
  # Fix Wallet Funding Functionality

  This migration ensures wallets can be updated and automatically created for new users.
  
  ## Changes
  
  1. **Add UPDATE Policy for Wallets**
     - Users need UPDATE permission to modify their wallet balances
     - Currently missing, causing silent failures on deposits
  
  2. **Create Trigger for Auto-Wallet Creation**
     - Automatically creates LYD and USD wallets when new user registers
     - Initializes with 0 balance
  
  3. **Create Function to Initialize Wallets**
     - Helper function to create both currency wallets
     - Called by trigger on profile creation
*/

-- =====================================================
-- PART 1: ADD UPDATE POLICY FOR WALLETS
-- =====================================================

DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;

CREATE POLICY "Users can update own wallets" 
  ON public.wallets 
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PART 2: CREATE FUNCTION TO INITIALIZE USER WALLETS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create LYD wallet
  INSERT INTO public.wallets (user_id, currency, balance, available_balance, held_balance)
  VALUES (NEW.id, 'LYD', 0, 0, 0)
  ON CONFLICT (user_id, currency) DO NOTHING;
  
  -- Create USD wallet
  INSERT INTO public.wallets (user_id, currency, balance, available_balance, held_balance)
  VALUES (NEW.id, 'USD', 0, 0, 0)
  ON CONFLICT (user_id, currency) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- PART 3: CREATE TRIGGER ON PROFILE CREATION
-- =====================================================

DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;

CREATE TRIGGER on_profile_created_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_wallet();

-- =====================================================
-- PART 4: BACKFILL EXISTING USERS WITHOUT WALLETS
-- =====================================================

DO $$
DECLARE
  profile_rec record;
BEGIN
  FOR profile_rec IN 
    SELECT p.id 
    FROM profiles p
    LEFT JOIN wallets w ON w.user_id = p.id
    WHERE w.id IS NULL
  LOOP
    -- Create LYD wallet
    INSERT INTO wallets (user_id, currency, balance, available_balance, held_balance)
    VALUES (profile_rec.id, 'LYD', 0, 0, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;
    
    -- Create USD wallet
    INSERT INTO wallets (user_id, currency, balance, available_balance, held_balance)
    VALUES (profile_rec.id, 'USD', 0, 0, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;
  END LOOP;
END $$;

-- =====================================================
-- PART 5: CREATE DIGITAL ASSETS INITIALIZATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_digital_assets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create gold digital balance
  INSERT INTO public.digital_assets (user_id, asset_type, balance_grams, total_value_lyd)
  VALUES (NEW.id, 'gold', 0, 0)
  ON CONFLICT (user_id, asset_type) DO NOTHING;
  
  -- Create silver digital balance
  INSERT INTO public.digital_assets (user_id, asset_type, balance_grams, total_value_lyd)
  VALUES (NEW.id, 'silver', 0, 0)
  ON CONFLICT (user_id, asset_type) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_digital_assets ON public.profiles;

CREATE TRIGGER on_profile_created_digital_assets
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_digital_assets();

-- =====================================================
-- PART 6: BACKFILL DIGITAL ASSETS FOR EXISTING USERS
-- =====================================================

DO $$
DECLARE
  profile_rec record;
BEGIN
  FOR profile_rec IN 
    SELECT p.id 
    FROM profiles p
    LEFT JOIN digital_assets da ON da.user_id = p.id
    WHERE da.id IS NULL
  LOOP
    -- Create gold balance
    INSERT INTO digital_assets (user_id, asset_type, balance_grams, total_value_lyd)
    VALUES (profile_rec.id, 'gold', 0, 0)
    ON CONFLICT (user_id, asset_type) DO NOTHING;
    
    -- Create silver balance
    INSERT INTO digital_assets (user_id, asset_type, balance_grams, total_value_lyd)
    VALUES (profile_rec.id, 'silver', 0, 0)
    ON CONFLICT (user_id, asset_type) DO NOTHING;
  END LOOP;
END $$;

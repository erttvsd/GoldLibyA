/*
  # Create Secure Transfer Functions

  1. Security Improvements
    - Create secure `transfer_digital_balance` RPC with auth.uid() validation
    - Create secure `transfer_asset_ownership` RPC with owner verification
    - Create secure `search_profiles_exact` RPC for recipient lookup
    - Create secure `adjust_wallet_balance` RPC for atomic balance updates
    - Lock down direct table access and enforce RPC usage

  2. Changes
    - Add transfer_digital_balance function with SECURITY DEFINER
    - Add transfer_asset_ownership function with SECURITY DEFINER
    - Add search_profiles_exact function with SECURITY DEFINER
    - Add adjust_wallet_balance function with SECURITY DEFINER
    - Remove overly permissive policies
    - Add row-level locking for concurrent transfers

  3. Security
    - All functions validate auth.uid() matches the sender/owner
    - Use FOR UPDATE to prevent race conditions
    - Set search_path to prevent injection
    - Grant EXECUTE to authenticated users only
*/

-- 1. Secure Digital Balance Transfer Function
CREATE OR REPLACE FUNCTION public.transfer_digital_balance(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_metal_type text,
  p_grams_amount numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  sender_balance record;
  recipient_balance record;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_sender_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF p_grams_amount IS NULL OR p_grams_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid grams';
  END IF;

  IF p_metal_type NOT IN ('gold', 'silver') THEN
    RAISE EXCEPTION 'Invalid metal type';
  END IF;

  SELECT * INTO sender_balance
  FROM digital_assets
  WHERE user_id = p_sender_id AND asset_type = p_metal_type
  FOR UPDATE;
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Sender balance not found'; 
  END IF;

  SELECT * INTO recipient_balance
  FROM digital_assets
  WHERE user_id = p_recipient_id AND asset_type = p_metal_type
  FOR UPDATE;
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Recipient balance not found'; 
  END IF;

  IF sender_balance.balance_grams < p_grams_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE digital_assets
    SET balance_grams = balance_grams - p_grams_amount, 
        updated_at = now()
  WHERE user_id = p_sender_id AND asset_type = p_metal_type;

  UPDATE digital_assets
    SET balance_grams = balance_grams + p_grams_amount, 
        updated_at = now()
  WHERE user_id = p_recipient_id AND asset_type = p_metal_type;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_digital_balance(uuid, uuid, text, numeric) TO authenticated;

-- 2. Secure Asset Ownership Transfer Function
CREATE OR REPLACE FUNCTION public.transfer_asset_ownership(
  p_asset_id uuid,
  p_new_owner_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  asset_record record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO asset_record
  FROM owned_assets
  WHERE id = p_asset_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;

  IF asset_record.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not the asset owner';
  END IF;

  IF p_new_owner_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  UPDATE owned_assets
    SET user_id = p_new_owner_id,
        updated_at = now()
  WHERE id = p_asset_id;

  RETURN json_build_object('success', true, 'asset_id', p_asset_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_asset_ownership(uuid, uuid) TO authenticated;

-- 3. Secure Profile Search Function
CREATE OR REPLACE FUNCTION public.search_profiles_exact(q text)
RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id, first_name, last_name, email, phone
  FROM profiles
  WHERE (email = q OR phone = q)
    AND id <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.search_profiles_exact(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_profiles_exact(text) TO authenticated;

-- 4. Secure Wallet Balance Adjustment Function
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  p_currency text,
  p_delta numeric
)
RETURNS TABLE (new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated'; 
  END IF;

  IF p_currency NOT IN ('LYD', 'USD') THEN
    RAISE EXCEPTION 'Invalid currency';
  END IF;

  UPDATE wallets
  SET balance = balance + p_delta,
      available_balance = available_balance + p_delta,
      updated_at = now()
  WHERE user_id = auth.uid() 
    AND currency = p_currency
    AND (balance + p_delta) >= 0
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found or insufficient funds';
  END IF;

  RETURN QUERY SELECT v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_wallet_balance(text, numeric) TO authenticated;

-- 5. Lock down owned_assets direct updates
DROP POLICY IF EXISTS "Users can update own assets" ON public.owned_assets;

-- 6. Restrict profiles direct SELECT for search
DROP POLICY IF EXISTS "Users can search profiles by email or phone" ON public.profiles;

-- 7. Restrict bullion_fingerprints access
DROP POLICY IF EXISTS "Anyone can read fingerprints" ON public.bullion_fingerprints;

CREATE POLICY "Owners can read their fingerprints" 
  ON public.bullion_fingerprints
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM owned_assets oa
      WHERE oa.id = bullion_fingerprints.owned_asset_id 
        AND oa.user_id = auth.uid()
    )
  );

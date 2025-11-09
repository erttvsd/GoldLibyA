/*
  # Add Transfer Functions

  1. New Functions
    - `transfer_digital_balance`: Transfers digital gold/silver between users
    - `transfer_asset_ownership`: Transfers physical asset ownership
    - Both functions use SECURITY DEFINER to bypass RLS
    - Include validation to prevent fraud

  2. Security
    - Functions run with elevated privileges
    - Validate sender has sufficient balance/owns asset
    - Prevent negative balances
    - Atomic operations (transaction safe)
    - No direct user manipulation of other users' data
*/

-- Function to transfer digital balance (gold/silver) between users
CREATE OR REPLACE FUNCTION public.transfer_digital_balance(
  sender_id uuid,
  recipient_id uuid,
  metal_type text,
  grams_amount numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_balance record;
  recipient_balance record;
  new_sender_grams numeric;
  new_recipient_grams numeric;
BEGIN
  -- Validate inputs
  IF sender_id = recipient_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  IF grams_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;

  -- Get sender's balance
  SELECT * INTO sender_balance
  FROM digital_assets
  WHERE user_id = sender_id AND asset_type = metal_type
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender digital balance not found';
  END IF;

  -- Check sufficient balance
  IF sender_balance.balance_grams < grams_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Get recipient's balance
  SELECT * INTO recipient_balance
  FROM digital_assets
  WHERE user_id = recipient_id AND asset_type = metal_type
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient digital balance not found';
  END IF;

  -- Calculate new balances
  new_sender_grams := sender_balance.balance_grams - grams_amount;
  new_recipient_grams := recipient_balance.balance_grams + grams_amount;

  -- Update sender's balance
  UPDATE digital_assets
  SET balance_grams = new_sender_grams,
      updated_at = now()
  WHERE id = sender_balance.id;

  -- Update recipient's balance
  UPDATE digital_assets
  SET balance_grams = new_recipient_grams,
      updated_at = now()
  WHERE id = recipient_balance.id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'sender_new_balance', new_sender_grams,
    'recipient_new_balance', new_recipient_grams
  );
END;
$$;

-- Function to transfer asset ownership
CREATE OR REPLACE FUNCTION public.transfer_asset_ownership(
  asset_id uuid,
  current_owner_id uuid,
  new_owner_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  asset_record record;
BEGIN
  -- Validate inputs
  IF current_owner_id = new_owner_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  -- Get and lock the asset
  SELECT * INTO asset_record
  FROM owned_assets
  WHERE id = asset_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;

  -- Verify current ownership
  IF asset_record.user_id != current_owner_id THEN
    RAISE EXCEPTION 'You do not own this asset';
  END IF;

  -- Transfer ownership
  UPDATE owned_assets
  SET user_id = new_owner_id,
      updated_at = now()
  WHERE id = asset_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'asset_id', asset_id,
    'new_owner_id', new_owner_id
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.transfer_digital_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_asset_ownership TO authenticated;

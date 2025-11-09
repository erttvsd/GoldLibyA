/*
  # Drop Old Transfer Functions

  Drop existing transfer functions before recreating with secure implementations
*/

DROP FUNCTION IF EXISTS public.transfer_digital_balance(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS public.transfer_asset_ownership(uuid, uuid);
DROP FUNCTION IF EXISTS public.search_profiles_exact(text);
DROP FUNCTION IF EXISTS public.adjust_wallet_balance(text, numeric);

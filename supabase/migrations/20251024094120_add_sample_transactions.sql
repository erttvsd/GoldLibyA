/*
  # Add Sample Data for Testing

  This migration adds sample transaction data and updates wallet balances
  for testing purposes. This helps demonstrate the home page functionality.

  ## Changes
  - Update live prices with more realistic data
  - Function to create sample transactions for a user (can be called when needed)
*/

-- Update live prices with more realistic values
UPDATE live_prices 
SET 
  price_lyd_per_gram = 425.50,
  change_percent = 1.2,
  updated_at = now()
WHERE metal_type = 'gold';

UPDATE live_prices 
SET 
  price_lyd_per_gram = 8.75,
  change_percent = -0.3,
  updated_at = now()
WHERE metal_type = 'silver';

-- Create a function to add sample data for a user (for testing)
CREATE OR REPLACE FUNCTION create_sample_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update wallets with sample balances
  UPDATE wallets
  SET balance = 12500.75, available_balance = 12500.75
  WHERE user_id = p_user_id AND currency = 'LYD';

  UPDATE wallets
  SET balance = 2500.00, available_balance = 2500.00
  WHERE user_id = p_user_id AND currency = 'USD';

  -- Update digital balances
  UPDATE digital_balances
  SET grams = 15.75
  WHERE user_id = p_user_id AND metal_type = 'gold';

  UPDATE digital_balances
  SET grams = 120.50
  WHERE user_id = p_user_id AND metal_type = 'silver';

  -- Add sample transactions
  INSERT INTO transactions (user_id, type, amount, currency, description, created_at)
  VALUES
    (p_user_id, 'deposit', 10000.00, 'LYD', 'Cash Deposit', now() - interval '3 days'),
    (p_user_id, 'purchase', 4472.60, 'LYD', 'Bought 5.5g Digital Gold', now() - interval '5 days'),
    (p_user_id, 'transfer_out', 100.00, 'USD', 'Sent to Ali Al-Ahmed', now() - interval '7 days'),
    (p_user_id, 'purchase', 8132.00, 'LYD', 'Bought 10g Gold Bar', now() - interval '1 day'),
    (p_user_id, 'deposit', 2000.00, 'USD', 'Bank Transfer', now() - interval '10 days');
END;
$$;

-- Add a comment explaining how to use this function
COMMENT ON FUNCTION create_sample_user_data IS 'Call this function with a user_id to populate their account with sample data for testing: SELECT create_sample_user_data(''user-uuid-here'');';

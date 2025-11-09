/*
  # Store Financial Operations RPCs

  Secure functions for financial operations:
  1. Initialize store financial accounts
  2. Deposit funds to store wallet
  3. Withdraw funds from store wallet
  4. Process supplier payment
  5. Request fund transfer between stores
  6. Approve/reject fund transfer
  7. Complete fund transfer
*/

-- 1. Initialize financial accounts for a store
CREATE OR REPLACE FUNCTION initialize_store_financial_accounts(p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create LYD account
  INSERT INTO store_financial_accounts (store_id, currency, balance, available_balance, held_balance)
  VALUES (p_store_id, 'LYD', 0, 0, 0)
  ON CONFLICT (store_id, currency) DO NOTHING;

  -- Create USD account
  INSERT INTO store_financial_accounts (store_id, currency, balance, available_balance, held_balance)
  VALUES (p_store_id, 'USD', 0, 0, 0)
  ON CONFLICT (store_id, currency) DO NOTHING;
END;
$$;

-- 2. Deposit funds to store wallet
CREATE OR REPLACE FUNCTION store_deposit_funds(
  p_store_id uuid,
  p_currency text,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account_id uuid;
  v_balance_before numeric;
  v_balance_after numeric;
  v_transaction_id uuid;
BEGIN
  IF NOT is_store_user(p_store_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of this store';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Get account and lock row
  SELECT id, balance INTO v_account_id, v_balance_before
  FROM store_financial_accounts
  WHERE store_id = p_store_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financial account not found';
  END IF;

  v_balance_after := v_balance_before + p_amount;

  -- Update balances
  UPDATE store_financial_accounts
  SET balance = v_balance_after,
      available_balance = available_balance + p_amount,
      updated_at = now()
  WHERE id = v_account_id;

  -- Record transaction
  INSERT INTO store_financial_transactions (
    store_id, account_id, transaction_type, amount,
    balance_before, balance_after,
    reference_type, reference_id, description, processed_by
  ) VALUES (
    p_store_id, v_account_id, 'deposit', p_amount,
    v_balance_before, v_balance_after,
    p_reference_type, p_reference_id, p_description, auth.uid()
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

-- 3. Withdraw funds from store wallet
CREATE OR REPLACE FUNCTION store_withdraw_funds(
  p_store_id uuid,
  p_currency text,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account_id uuid;
  v_balance_before numeric;
  v_balance_after numeric;
  v_available_balance numeric;
  v_transaction_id uuid;
BEGIN
  IF NOT is_store_user(p_store_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of this store';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Get account and lock row
  SELECT id, balance, available_balance
  INTO v_account_id, v_balance_before, v_available_balance
  FROM store_financial_accounts
  WHERE store_id = p_store_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financial account not found';
  END IF;

  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  v_balance_after := v_balance_before - p_amount;

  -- Update balances
  UPDATE store_financial_accounts
  SET balance = v_balance_after,
      available_balance = available_balance - p_amount,
      updated_at = now()
  WHERE id = v_account_id;

  -- Record transaction
  INSERT INTO store_financial_transactions (
    store_id, account_id, transaction_type, amount,
    balance_before, balance_after,
    reference_type, reference_id, description, processed_by
  ) VALUES (
    p_store_id, v_account_id, 'withdrawal', p_amount,
    v_balance_before, v_balance_after,
    p_reference_type, p_reference_id, p_description, auth.uid()
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

-- 4. Request fund transfer between stores
CREATE OR REPLACE FUNCTION store_request_fund_transfer(
  p_from_store_id uuid,
  p_to_store_id uuid,
  p_currency text,
  p_amount numeric,
  p_reason text,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_id uuid;
  v_available_balance numeric;
  v_account_id uuid;
BEGIN
  IF NOT is_store_user(p_from_store_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of source store';
  END IF;

  IF p_from_store_id = p_to_store_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same store';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Check available balance
  SELECT id, available_balance INTO v_account_id, v_available_balance
  FROM store_financial_accounts
  WHERE store_id = p_from_store_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financial account not found';
  END IF;

  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  -- Hold the funds
  UPDATE store_financial_accounts
  SET available_balance = available_balance - p_amount,
      held_balance = held_balance + p_amount,
      updated_at = now()
  WHERE id = v_account_id;

  -- Create transfer request
  INSERT INTO store_fund_transfer_requests (
    from_store_id, to_store_id, currency, amount,
    status, reason, notes, requested_by
  ) VALUES (
    p_from_store_id, p_to_store_id, p_currency, p_amount,
    'pending', p_reason, p_notes, auth.uid()
  ) RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- 5. Approve fund transfer
CREATE OR REPLACE FUNCTION store_approve_fund_transfer(
  p_request_id uuid,
  p_approval_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request store_fund_transfer_requests;
  v_from_account_id uuid;
  v_to_account_id uuid;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM store_fund_transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Transfer request is not pending';
  END IF;

  -- Check if user can approve (must be from destination store)
  IF NOT is_store_user(v_request.to_store_id) THEN
    RAISE EXCEPTION 'Only destination store can approve transfer';
  END IF;

  -- Get accounts
  SELECT id INTO v_from_account_id
  FROM store_financial_accounts
  WHERE store_id = v_request.from_store_id AND currency = v_request.currency;

  SELECT id INTO v_to_account_id
  FROM store_financial_accounts
  WHERE store_id = v_request.to_store_id AND currency = v_request.currency;

  IF v_to_account_id IS NULL THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;

  -- Process transfer
  -- Deduct from source
  UPDATE store_financial_accounts
  SET balance = balance - v_request.amount,
      held_balance = held_balance - v_request.amount,
      updated_at = now()
  WHERE id = v_from_account_id;

  -- Add to destination
  UPDATE store_financial_accounts
  SET balance = balance + v_request.amount,
      available_balance = available_balance + v_request.amount,
      updated_at = now()
  WHERE id = v_to_account_id;

  -- Record transactions
  INSERT INTO store_financial_transactions (
    store_id, account_id, transaction_type, amount,
    balance_before, balance_after,
    reference_type, reference_id, description, processed_by
  )
  SELECT
    v_request.from_store_id, v_from_account_id, 'transfer_out', v_request.amount,
    balance + v_request.amount, balance,
    'fund_transfer', p_request_id, 'Transfer to store', auth.uid()
  FROM store_financial_accounts WHERE id = v_from_account_id;

  INSERT INTO store_financial_transactions (
    store_id, account_id, transaction_type, amount,
    balance_before, balance_after,
    reference_type, reference_id, description, processed_by
  )
  SELECT
    v_request.to_store_id, v_to_account_id, 'transfer_in', v_request.amount,
    balance - v_request.amount, balance,
    'fund_transfer', p_request_id, 'Transfer from store', auth.uid()
  FROM store_financial_accounts WHERE id = v_to_account_id;

  -- Update request
  UPDATE store_fund_transfer_requests
  SET status = 'completed',
      approved_by = auth.uid(),
      approval_notes = p_approval_notes,
      approved_at = now(),
      completed_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  RETURN true;
END;
$$;

-- 6. Reject fund transfer
CREATE OR REPLACE FUNCTION store_reject_fund_transfer(
  p_request_id uuid,
  p_rejection_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request store_fund_transfer_requests;
  v_account_id uuid;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM store_fund_transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Transfer request is not pending';
  END IF;

  -- Release held funds
  SELECT id INTO v_account_id
  FROM store_financial_accounts
  WHERE store_id = v_request.from_store_id AND currency = v_request.currency;

  UPDATE store_financial_accounts
  SET available_balance = available_balance + v_request.amount,
      held_balance = held_balance - v_request.amount,
      updated_at = now()
  WHERE id = v_account_id;

  -- Update request
  UPDATE store_fund_transfer_requests
  SET status = 'rejected',
      approved_by = auth.uid(),
      approval_notes = p_rejection_notes,
      approved_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  RETURN true;
END;
$$;

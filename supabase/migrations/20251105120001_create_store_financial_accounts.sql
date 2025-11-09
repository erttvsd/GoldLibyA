/*
  # Store Financial Accounts System

  1. New Tables
    - `store_financial_accounts`
      - Multi-currency wallet accounts for stores (LYD, USD)
      - Tracks balance, available balance, and held balance
      - Linked to stores

    - `store_bank_accounts`
      - Bank account information for stores
      - Supports multiple bank accounts per store
      - Tracks account status and verification

    - `store_financial_transactions`
      - Complete audit trail for all financial operations
      - Tracks deposits, withdrawals, transfers, supplier payments
      - Links to references for traceability

    - `store_fund_transfer_requests`
      - Inter-store fund transfer requests
      - Multi-step approval workflow
      - Tracks transfer status and authorization

  2. Security
    - Enable RLS on all tables
    - Store users can only access their store's financial data
    - Approval permissions based on user role
*/

-- 1. Store Financial Accounts (Wallets)
CREATE TABLE IF NOT EXISTS store_financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  currency text NOT NULL CHECK (currency IN ('LYD', 'USD')),
  balance numeric(15, 3) DEFAULT 0 CHECK (balance >= 0),
  available_balance numeric(15, 3) DEFAULT 0 CHECK (available_balance >= 0),
  held_balance numeric(15, 3) DEFAULT 0 CHECK (held_balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, currency)
);

CREATE INDEX IF NOT EXISTS idx_store_financial_accounts_store ON store_financial_accounts(store_id);

-- 2. Store Bank Accounts
CREATE TABLE IF NOT EXISTS store_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  iban text,
  swift_code text,
  account_holder_name text NOT NULL,
  branch text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_bank_accounts_store ON store_bank_accounts(store_id) WHERE is_active = true;

-- 3. Store Financial Transactions (Audit Trail)
CREATE TABLE IF NOT EXISTS store_financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES store_financial_accounts(id),
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'deposit', 'withdrawal', 'supplier_payment', 'transfer_in', 'transfer_out',
    'bank_deposit', 'bank_withdrawal', 'adjustment', 'fee', 'refund'
  )),
  amount numeric(15, 3) NOT NULL CHECK (amount > 0),
  balance_before numeric(15, 3) NOT NULL,
  balance_after numeric(15, 3) NOT NULL,
  reference_type text,
  reference_id uuid,
  description text,
  metadata jsonb,
  processed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_financial_transactions_store ON store_financial_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_financial_transactions_account ON store_financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_store_financial_transactions_date ON store_financial_transactions(created_at DESC);

-- 4. Store Fund Transfer Requests
CREATE TABLE IF NOT EXISTS store_fund_transfer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  to_store_id uuid NOT NULL REFERENCES stores(id),
  currency text NOT NULL CHECK (currency IN ('LYD', 'USD')),
  amount numeric(15, 3) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'completed', 'cancelled'
  )),
  reason text NOT NULL,
  notes text,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approval_notes text,
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_transfer_from_store ON store_fund_transfer_requests(from_store_id);
CREATE INDEX IF NOT EXISTS idx_fund_transfer_to_store ON store_fund_transfer_requests(to_store_id);
CREATE INDEX IF NOT EXISTS idx_fund_transfer_status ON store_fund_transfer_requests(status);

-- RLS POLICIES

ALTER TABLE store_financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users view own store accounts"
  ON store_financial_accounts FOR SELECT
  TO authenticated
  USING (is_store_user(store_id));

CREATE POLICY "Store users update own store accounts"
  ON store_financial_accounts FOR UPDATE
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

ALTER TABLE store_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage bank accounts"
  ON store_bank_accounts FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

ALTER TABLE store_financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users view own transactions"
  ON store_financial_transactions FOR SELECT
  TO authenticated
  USING (is_store_user(store_id));

CREATE POLICY "Store users create transactions"
  ON store_financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (is_store_user(store_id));

ALTER TABLE store_fund_transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users view related transfers"
  ON store_fund_transfer_requests FOR SELECT
  TO authenticated
  USING (is_store_user(from_store_id) OR is_store_user(to_store_id));

CREATE POLICY "Store users create transfer requests"
  ON store_fund_transfer_requests FOR INSERT
  TO authenticated
  WITH CHECK (is_store_user(from_store_id));

CREATE POLICY "Store users update transfer requests"
  ON store_fund_transfer_requests FOR UPDATE
  TO authenticated
  USING (is_store_user(from_store_id) OR is_store_user(to_store_id))
  WITH CHECK (is_store_user(from_store_id) OR is_store_user(to_store_id));

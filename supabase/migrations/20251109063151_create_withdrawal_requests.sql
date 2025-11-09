/*
  # Customer Withdrawal Requests System

  Creates a table for managing customer money withdrawal appointments at stores.

  ## Tables Created

  1. **withdrawal_requests**
     - Stores customer requests to withdraw money from their Dar wallets
     - Tracks request status from pending through approval to completion
     - Links to user, store, and optionally an appointment

  ## Fields

  - `id` - Unique identifier
  - `user_id` - Customer requesting withdrawal
  - `store_id` - Store where withdrawal will be processed
  - `amount` - Amount to withdraw
  - `currency` - LYD or USD
  - `status` - pending, approved, completed, rejected
  - `appointment_date` - Optional scheduled appointment time
  - `notes` - Customer notes or special instructions
  - `rejection_reason` - Reason if rejected
  - `processed_by` - Staff member who processed the request
  - `created_at` - When request was made
  - `updated_at` - Last status update

  ## Security

  - RLS enabled
  - Users can view their own requests
  - Store staff can view and update requests for their store
*/

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency IN ('LYD', 'USD')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  appointment_date timestamptz,
  notes text,
  rejection_reason text,
  processed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create withdrawal requests
CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Store staff can view withdrawal requests for their store
CREATE POLICY "Store staff can view store withdrawal requests"
  ON withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.user_id = auth.uid()
      AND store_users.store_id = withdrawal_requests.store_id
    )
  );

-- Policy: Store staff can update withdrawal requests for their store
CREATE POLICY "Store staff can update store withdrawal requests"
  ON withdrawal_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.user_id = auth.uid()
      AND store_users.store_id = withdrawal_requests.store_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.user_id = auth.uid()
      AND store_users.store_id = withdrawal_requests.store_id
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_store_id ON withdrawal_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_appointment_date ON withdrawal_requests(appointment_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_withdrawal_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_withdrawal_requests_updated_at();

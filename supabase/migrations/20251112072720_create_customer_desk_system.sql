/*
  # Customer Desk System

  1. New Tables
    - `store_customer_interactions`
      - `id` (uuid, primary key)
      - `store_id` (uuid, references stores)
      - `customer_id` (uuid, references profiles)
      - `customer_name` (text)
      - `customer_email` (text)
      - `customer_phone` (text)
      - `interaction_type` (text) - appointment_set, picked_up, transferred, pending, cancelled
      - `asset_id` (uuid, references digital_assets, nullable)
      - `asset_bar_number` (text, nullable)
      - `asset_weight` (decimal, nullable)
      - `asset_purity` (text, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `store_customer_chat`
      - `id` (uuid, primary key)
      - `interaction_id` (uuid, references store_customer_interactions)
      - `sender_type` (text) - store, customer
      - `sender_id` (uuid, references profiles)
      - `message` (text)
      - `created_at` (timestamptz)
    
    - `store_customer_transactions`
      - `id` (uuid, primary key)
      - `interaction_id` (uuid, references store_customer_interactions)
      - `transaction_type` (text) - purchase, transfer, pickup, deposit
      - `amount` (decimal)
      - `currency` (text)
      - `description` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for store staff to manage their store's customer data
*/

-- Create store_customer_interactions table
CREATE TABLE IF NOT EXISTS store_customer_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  interaction_type text NOT NULL CHECK (interaction_type IN ('appointment_set', 'picked_up', 'transferred', 'pending', 'cancelled')),
  asset_id uuid REFERENCES digital_assets(id) ON DELETE SET NULL,
  asset_bar_number text,
  asset_weight decimal(10,3),
  asset_purity text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create store_customer_chat table
CREATE TABLE IF NOT EXISTS store_customer_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid REFERENCES store_customer_interactions(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('store', 'customer')),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create store_customer_transactions table
CREATE TABLE IF NOT EXISTS store_customer_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid REFERENCES store_customer_interactions(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'transfer', 'pickup', 'deposit', 'withdrawal')),
  amount decimal(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'LYD',
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE store_customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customer_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customer_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for store_customer_interactions
CREATE POLICY "Store staff can view their store's customer interactions"
  ON store_customer_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_customer_interactions.store_id
      AND store_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Store staff can create customer interactions"
  ON store_customer_interactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_customer_interactions.store_id
      AND store_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Store staff can update their store's customer interactions"
  ON store_customer_interactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_customer_interactions.store_id
      AND store_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_customer_interactions.store_id
      AND store_users.user_id = auth.uid()
    )
  );

-- Policies for store_customer_chat
CREATE POLICY "Store staff can view chat for their store's interactions"
  ON store_customer_chat FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_customer_interactions sci
      JOIN store_users su ON su.store_id = sci.store_id
      WHERE sci.id = store_customer_chat.interaction_id
      AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Store staff can create chat messages"
  ON store_customer_chat FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_customer_interactions sci
      JOIN store_users su ON su.store_id = sci.store_id
      WHERE sci.id = store_customer_chat.interaction_id
      AND su.user_id = auth.uid()
    )
  );

-- Policies for store_customer_transactions
CREATE POLICY "Store staff can view transactions for their store's interactions"
  ON store_customer_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_customer_interactions sci
      JOIN store_users su ON su.store_id = sci.store_id
      WHERE sci.id = store_customer_transactions.interaction_id
      AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Store staff can create transactions"
  ON store_customer_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_customer_interactions sci
      JOIN store_users su ON su.store_id = sci.store_id
      WHERE sci.id = store_customer_transactions.interaction_id
      AND su.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_interactions_store_id ON store_customer_interactions(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON store_customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_type ON store_customer_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_customer_chat_interaction_id ON store_customer_chat(interaction_id);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_interaction_id ON store_customer_transactions(interaction_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_interaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_customer_interaction_timestamp ON store_customer_interactions;
CREATE TRIGGER update_customer_interaction_timestamp
  BEFORE UPDATE ON store_customer_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_interaction_timestamp();

/*
  # Add Digital Assets Table
  
  ## New Table
  - digital_assets: Stores digital gold and silver balances
  
  ## Fields
  - user_id: Reference to profiles
  - asset_type: gold or silver
  - balance_grams: Amount of grams owned
  - average_purchase_price: Average price paid per gram
  - last_updated: Timestamp of last change
  
  ## Security
  - RLS enabled
  - Users can only view and update their own digital assets
*/

CREATE TABLE IF NOT EXISTS digital_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('gold', 'silver')),
  balance_grams decimal(12,3) DEFAULT 0 NOT NULL,
  average_purchase_price decimal(12,2),
  total_value_lyd decimal(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, asset_type)
);

CREATE INDEX IF NOT EXISTS idx_digital_assets_user ON digital_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_assets_type ON digital_assets(asset_type);

ALTER TABLE digital_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own digital assets"
  ON digital_assets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert digital balances for existing user
INSERT INTO digital_assets (user_id, asset_type, balance_grams, average_purchase_price, total_value_lyd)
VALUES
  ('3ac01026-70f6-4726-827e-f3a3684d32e9', 'gold', 125.5, 875, 109812.5),
  ('3ac01026-70f6-4726-827e-f3a3684d32e9', 'silver', 450.75, 8.75, 3944.06)
ON CONFLICT (user_id, asset_type) DO UPDATE SET
  balance_grams = EXCLUDED.balance_grams,
  average_purchase_price = EXCLUDED.average_purchase_price,
  total_value_lyd = EXCLUDED.total_value_lyd,
  updated_at = now();

/*
  # Store Console Tables - Part 2: POS, Cash, and Operations
*/

-- 1. Store coupons
CREATE TABLE IF NOT EXISTS store_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  kind text NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value numeric(12, 3) NOT NULL,
  max_discount_lyd numeric(12, 3),
  min_purchase_lyd numeric(12, 3),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean DEFAULT true,
  usage_count int DEFAULT 0,
  max_usage int,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_coupons_code ON store_coupons(code) WHERE active = true;

-- 2. Store announcements
CREATE TABLE IF NOT EXISTS store_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  visible_from timestamptz,
  visible_to timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 3. Asset handovers
CREATE TABLE IF NOT EXISTS asset_handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES pickup_appointments(id) ON DELETE SET NULL,
  asset_id uuid NOT NULL REFERENCES owned_assets(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processed_by uuid NOT NULL REFERENCES auth.users(id),
  storage_fee_lyd numeric(12, 3) DEFAULT 0,
  payment_method text,
  signature_url text,
  id_photo_url text,
  customer_photo_url text,
  notes text,
  completed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_handovers_store ON asset_handovers(store_id);

-- 4. POS sales
CREATE TABLE IF NOT EXISTS pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sale_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clerk_id uuid NOT NULL REFERENCES auth.users(id),
  subtotal_lyd numeric(12, 3) NOT NULL,
  discount_lyd numeric(12, 3) DEFAULT 0,
  tax_lyd numeric(12, 3) DEFAULT 0,
  total_lyd numeric(12, 3) NOT NULL,
  coupon_id uuid REFERENCES store_coupons(id),
  status text DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled', 'refunded')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_sales_store ON pos_sales(store_id);

-- 5. POS sale items
CREATE TABLE IF NOT EXISTS pos_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price_lyd numeric(12, 3) NOT NULL,
  discount_lyd numeric(12, 3) DEFAULT 0,
  total_lyd numeric(12, 3) NOT NULL
);

-- 6. POS payments
CREATE TABLE IF NOT EXISTS pos_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('cash', 'card', 'wallet_lyd', 'wallet_usd', 'bank_transfer')),
  amount_lyd numeric(12, 3) NOT NULL,
  reference_number text,
  created_at timestamptz DEFAULT now()
);

-- 7. Cash drawer movements
CREATE TABLE IF NOT EXISTS store_cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  clerk_id uuid NOT NULL REFERENCES auth.users(id),
  movement_type text NOT NULL CHECK (movement_type IN ('open', 'close', 'sale', 'refund', 'deposit', 'withdrawal', 'adjustment')),
  amount_lyd numeric(12, 3) NOT NULL,
  reference_id uuid,
  reference_type text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_store ON store_cash_movements(store_id);

-- RLS POLICIES
ALTER TABLE store_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage coupons"
  ON store_coupons FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

ALTER TABLE store_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage announcements"
  ON store_announcements FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

ALTER TABLE asset_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage handovers"
  ON asset_handovers FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage sales"
  ON pos_sales FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

ALTER TABLE pos_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage sale items"
  ON pos_sale_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM pos_sales ps
    WHERE ps.id = pos_sale_items.sale_id
    AND is_store_user(ps.store_id)
  ));

ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage payments"
  ON pos_payments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM pos_sales ps
    WHERE ps.id = pos_payments.sale_id
    AND is_store_user(ps.store_id)
  ));

ALTER TABLE store_cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage cash"
  ON store_cash_movements FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

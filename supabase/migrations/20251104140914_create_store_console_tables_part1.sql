/*
  # Store Console Tables - Part 1: CRM and Customer Management
*/

-- 1. Customer profiles view
CREATE TABLE IF NOT EXISTS customer_profiles_view (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  kyc_status text DEFAULT 'unknown',
  last_purchase_at timestamptz,
  risk_score int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Store customer notes
CREATE TABLE IF NOT EXISTS store_customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  is_internal boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_customer_notes_store_user ON store_customer_notes(store_id, user_id);

-- 3. Customer flags
CREATE TABLE IF NOT EXISTS customer_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag text NOT NULL CHECK (flag IN ('high_value', 'watchlist', 'blocked', 'pep', 'manual_review')),
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_customer_flags_user ON customer_flags(user_id);

-- 4. Location change requests
CREATE TABLE IF NOT EXISTS location_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES owned_assets(id) ON DELETE CASCADE,
  from_store_id uuid NOT NULL REFERENCES stores(id),
  to_store_id uuid NOT NULL REFERENCES stores(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'moved')),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  reason text,
  resolution_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_change_from_store ON location_change_requests(from_store_id);

-- 5. Return requests
CREATE TABLE IF NOT EXISTS return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES owned_assets(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'restocked', 'scrapped', 'refunded')),
  inspected_by uuid REFERENCES auth.users(id),
  refund_amount_lyd numeric(12, 3),
  inspection_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_store ON return_requests(store_id);

-- RLS POLICIES
ALTER TABLE customer_profiles_view ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users view customer profiles"
  ON customer_profiles_view FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM store_users WHERE user_id = auth.uid() AND is_active = true));

ALTER TABLE store_customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage notes"
  ON store_customer_notes FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

ALTER TABLE customer_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users view flags"
  ON customer_flags FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM store_users WHERE user_id = auth.uid() AND is_active = true));

ALTER TABLE location_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage location requests"
  ON location_change_requests FOR ALL
  TO authenticated
  USING (is_store_user(from_store_id) OR is_store_user(to_store_id));

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage returns"
  ON return_requests FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

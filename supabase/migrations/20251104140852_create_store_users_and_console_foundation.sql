/*
  # Store Users and Console Foundation
  
  Creates store_users table and base infrastructure for store console
*/

-- 1. Store roles enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_role') THEN
    CREATE TYPE store_role AS ENUM ('owner', 'manager', 'clerk', 'vault', 'auditor', 'support');
  END IF;
END $$;

-- 2. Store users table (staff assignments)
CREATE TABLE IF NOT EXISTS store_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role store_role NOT NULL,
  is_active boolean DEFAULT true,
  can_approve_high_value boolean DEFAULT false,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(store_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_store_users_store ON store_users(store_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_store_users_user ON store_users(user_id) WHERE is_active = true;

-- RLS for store_users
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners and managers can manage staff"
  ON store_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_users su
      WHERE su.store_id = store_users.store_id
      AND su.user_id = auth.uid()
      AND su.role IN ('owner', 'manager')
      AND su.is_active = true
    )
  );

CREATE POLICY "Users can view their own store assignments"
  ON store_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Helper function
CREATE OR REPLACE FUNCTION is_store_user(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_users
    WHERE store_id = p_store_id
    AND user_id = auth.uid()
    AND is_active = true
  );
$$;

-- 4. Helper to get user's role at store
CREATE OR REPLACE FUNCTION get_store_role(p_store_id uuid)
RETURNS store_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM store_users
  WHERE store_id = p_store_id
  AND user_id = auth.uid()
  AND is_active = true
  LIMIT 1;
$$;

-- 5. Stock movements table (if not exists)
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'sale', 'handover', 'return', 'adjustment', 'transfer_in', 'transfer_out')),
  quantity int NOT NULL,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON stock_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

-- RLS for stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users manage stock movements"
  ON stock_movements FOR ALL
  TO authenticated
  USING (is_store_user(store_id))
  WITH CHECK (is_store_user(store_id));

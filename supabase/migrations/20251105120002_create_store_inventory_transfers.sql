/*
  # Store Inventory Transfer System

  1. New Tables
    - `store_inventory_transfer_requests`
      - Transfer requests between stores
      - Multi-step approval workflow (requested → approved → in_transit → received)
      - Tracks authorization and status

    - `store_inventory_transfer_items`
      - Individual items (gold bars) being transferred
      - Links to owned_assets with serial numbers
      - Tracks item status throughout transfer

  2. Security
    - Enable RLS on all tables
    - Store users can view transfers involving their store
    - Approval requires appropriate permissions
*/

-- 1. Store Inventory Transfer Requests
CREATE TABLE IF NOT EXISTS store_inventory_transfer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number text UNIQUE NOT NULL,
  from_store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  to_store_id uuid NOT NULL REFERENCES stores(id),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'approved', 'rejected', 'in_transit', 'received', 'cancelled'
  )),
  total_items int DEFAULT 0 CHECK (total_items >= 0),
  reason text NOT NULL,
  notes text,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approval_notes text,
  approved_at timestamptz,
  shipped_at timestamptz,
  shipped_by uuid REFERENCES auth.users(id),
  shipping_reference text,
  received_at timestamptz,
  received_by uuid REFERENCES auth.users(id),
  receipt_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transfer_from_store ON store_inventory_transfer_requests(from_store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_to_store ON store_inventory_transfer_requests(to_store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_status ON store_inventory_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_number ON store_inventory_transfer_requests(transfer_number);

-- 2. Store Inventory Transfer Items
CREATE TABLE IF NOT EXISTS store_inventory_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_request_id uuid NOT NULL REFERENCES store_inventory_transfer_requests(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  asset_id uuid REFERENCES owned_assets(id),
  serial_number text NOT NULL,
  quantity int DEFAULT 1 CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'in_transit', 'received', 'cancelled'
  )),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_items_request ON store_inventory_transfer_items(transfer_request_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_product ON store_inventory_transfer_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_asset ON store_inventory_transfer_items(asset_id);

-- RLS POLICIES

ALTER TABLE store_inventory_transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users view related transfers"
  ON store_inventory_transfer_requests FOR SELECT
  TO authenticated
  USING (is_store_user(from_store_id) OR is_store_user(to_store_id));

CREATE POLICY "Store users create transfer requests"
  ON store_inventory_transfer_requests FOR INSERT
  TO authenticated
  WITH CHECK (is_store_user(from_store_id));

CREATE POLICY "Store users update transfers"
  ON store_inventory_transfer_requests FOR UPDATE
  TO authenticated
  USING (is_store_user(from_store_id) OR is_store_user(to_store_id))
  WITH CHECK (is_store_user(from_store_id) OR is_store_user(to_store_id));

ALTER TABLE store_inventory_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users view transfer items"
  ON store_inventory_transfer_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_inventory_transfer_requests req
      WHERE req.id = store_inventory_transfer_items.transfer_request_id
      AND (is_store_user(req.from_store_id) OR is_store_user(req.to_store_id))
    )
  );

CREATE POLICY "Store users manage transfer items"
  ON store_inventory_transfer_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_inventory_transfer_requests req
      WHERE req.id = store_inventory_transfer_items.transfer_request_id
      AND (is_store_user(req.from_store_id) OR is_store_user(req.to_store_id))
    )
  );

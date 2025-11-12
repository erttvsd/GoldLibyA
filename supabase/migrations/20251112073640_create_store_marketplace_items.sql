/*
  # Create Store Marketplace System

  1. New Tables
    - `store_marketplace_items`
      - `id` (uuid, primary key)
      - `store_id` (uuid, references stores)
      - `item_name` (text)
      - `item_type` (text) - bar, coin, jewelry, ingot
      - `metal_type` (text) - gold, silver, platinum
      - `weight` (decimal) - in grams
      - `purity` (text) - 24K, 22K, 21K, 18K, 999, 925
      - `price_lyd` (decimal)
      - `price_usd` (decimal)
      - `quantity_available` (integer)
      - `description` (text)
      - `image_url` (text, nullable)
      - `is_available` (boolean)
      - `featured` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `store_marketplace_orders`
      - `id` (uuid, primary key)
      - `item_id` (uuid, references store_marketplace_items)
      - `buyer_id` (uuid, references profiles)
      - `store_id` (uuid, references stores)
      - `quantity` (integer)
      - `total_price_lyd` (decimal)
      - `total_price_usd` (decimal)
      - `order_status` (text) - pending, confirmed, completed, cancelled
      - `payment_method` (text) - wallet, cash, bank_transfer
      - `delivery_method` (text) - pickup, delivery
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Store staff can manage their store's items
    - Authenticated users can view items and place orders
*/

-- Create store_marketplace_items table
CREATE TABLE IF NOT EXISTS store_marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('bar', 'coin', 'jewelry', 'ingot', 'bullion')),
  metal_type text NOT NULL CHECK (metal_type IN ('gold', 'silver', 'platinum')),
  weight decimal(10,3) NOT NULL,
  purity text NOT NULL,
  price_lyd decimal(12,2) NOT NULL,
  price_usd decimal(12,2) NOT NULL,
  quantity_available integer NOT NULL DEFAULT 0,
  description text,
  image_url text,
  is_available boolean DEFAULT true NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create store_marketplace_orders table
CREATE TABLE IF NOT EXISTS store_marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES store_marketplace_items(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_price_lyd decimal(12,2) NOT NULL,
  total_price_usd decimal(12,2) NOT NULL,
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('wallet', 'cash', 'bank_transfer')),
  delivery_method text NOT NULL CHECK (delivery_method IN ('pickup', 'delivery')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE store_marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Policies for store_marketplace_items
CREATE POLICY "Anyone can view available marketplace items"
  ON store_marketplace_items FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY "Store staff can manage their store's items"
  ON store_marketplace_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_marketplace_items.store_id
      AND store_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_marketplace_items.store_id
      AND store_users.user_id = auth.uid()
    )
  );

-- Policies for store_marketplace_orders
CREATE POLICY "Users can view their own orders"
  ON store_marketplace_orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Store staff can view their store's orders"
  ON store_marketplace_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_marketplace_orders.store_id
      AND store_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create orders"
  ON store_marketplace_orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Store staff can update their store's orders"
  ON store_marketplace_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_marketplace_orders.store_id
      AND store_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = store_marketplace_orders.store_id
      AND store_users.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_items_store_id ON store_marketplace_items(store_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_available ON store_marketplace_items(is_available, featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id ON store_marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_store_id ON store_marketplace_orders(store_id);

-- Create trigger for updated_at on items
CREATE OR REPLACE FUNCTION update_marketplace_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_marketplace_item_timestamp ON store_marketplace_items;
CREATE TRIGGER update_marketplace_item_timestamp
  BEFORE UPDATE ON store_marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_item_timestamp();

-- Create trigger for updated_at on orders
CREATE OR REPLACE FUNCTION update_marketplace_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_marketplace_order_timestamp ON store_marketplace_orders;
CREATE TRIGGER update_marketplace_order_timestamp
  BEFORE UPDATE ON store_marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_order_timestamp();

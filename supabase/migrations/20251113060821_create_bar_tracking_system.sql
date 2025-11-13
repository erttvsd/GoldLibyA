/*
  # Create Bar Tracking System

  1. New Tables
    - `inventory_bars` - Individual bar tracking with serial numbers and XRF data
      - `id` (uuid, primary key)
      - `inventory_id` (uuid, references inventory)
      - `store_id` (uuid, references stores)
      - `product_id` (uuid, references products)
      - `serial_number` (text, unique)
      - `bar_number` (text)
      - `weight_grams` (numeric)
      - `purity` (text)
      - `xrf_gold_percentage` (numeric)
      - `xrf_silver_percentage` (numeric)
      - `xrf_copper_percentage` (numeric)
      - `xrf_other_metals` (jsonb)
      - `manufacturer` (text)
      - `manufacture_date` (date)
      - `certification_number` (text)
      - `status` (text: 'in_stock', 'sold', 'reserved')
      - `sale_id` (uuid, references pos_sales)
      - `buyer_id` (uuid, references profiles)
      - `sale_date` (timestamp)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `inventory_bars`
    - Store owners can view their bars
    - Store owners can manage their bars
    - Authenticated users can view bars they purchased
*/

-- Create inventory_bars table
CREATE TABLE IF NOT EXISTS inventory_bars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid REFERENCES inventory(id),
  store_id uuid REFERENCES stores(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  serial_number text UNIQUE NOT NULL,
  bar_number text,
  weight_grams numeric NOT NULL,
  purity text NOT NULL,
  xrf_gold_percentage numeric,
  xrf_silver_percentage numeric,
  xrf_copper_percentage numeric,
  xrf_other_metals jsonb DEFAULT '{}',
  manufacturer text,
  manufacture_date date,
  certification_number text,
  status text DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'reserved')),
  sale_id uuid REFERENCES pos_sales(id),
  buyer_id uuid REFERENCES profiles(id),
  sale_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE inventory_bars ENABLE ROW LEVEL SECURITY;

-- Store owners can view their bars
CREATE POLICY "Store owners can view own bars"
  ON inventory_bars FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_profiles sp
      WHERE sp.store_id = inventory_bars.store_id
      AND sp.user_id = auth.uid()
    )
  );

-- Store owners can insert bars
CREATE POLICY "Store owners can insert bars"
  ON inventory_bars FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_profiles sp
      WHERE sp.store_id = inventory_bars.store_id
      AND sp.user_id = auth.uid()
    )
  );

-- Store owners can update their bars
CREATE POLICY "Store owners can update own bars"
  ON inventory_bars FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_profiles sp
      WHERE sp.store_id = inventory_bars.store_id
      AND sp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_profiles sp
      WHERE sp.store_id = inventory_bars.store_id
      AND sp.user_id = auth.uid()
    )
  );

-- Buyers can view bars they purchased
CREATE POLICY "Buyers can view purchased bars"
  ON inventory_bars FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_bars_store_id ON inventory_bars(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bars_status ON inventory_bars(status);
CREATE INDEX IF NOT EXISTS idx_inventory_bars_buyer_id ON inventory_bars(buyer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bars_serial_number ON inventory_bars(serial_number);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_inventory_bars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_bars_updated_at
  BEFORE UPDATE ON inventory_bars
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_bars_updated_at();

-- Create function to mark bar as sold
CREATE OR REPLACE FUNCTION mark_bar_as_sold(
  p_bar_id uuid,
  p_sale_id uuid,
  p_buyer_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE inventory_bars
  SET 
    status = 'sold',
    sale_id = p_sale_id,
    buyer_id = p_buyer_id,
    sale_date = now()
  WHERE id = p_bar_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get bar details with buyer info
CREATE OR REPLACE FUNCTION get_bar_details(p_store_id uuid)
RETURNS TABLE (
  bar_id uuid,
  serial_number text,
  bar_number text,
  product_name text,
  weight_grams numeric,
  purity text,
  xrf_gold_percentage numeric,
  xrf_silver_percentage numeric,
  xrf_copper_percentage numeric,
  xrf_other_metals jsonb,
  manufacturer text,
  manufacture_date date,
  certification_number text,
  status text,
  sale_date timestamp with time zone,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  sale_number text,
  sale_total numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ib.id as bar_id,
    ib.serial_number,
    ib.bar_number,
    p.name as product_name,
    ib.weight_grams,
    ib.purity,
    ib.xrf_gold_percentage,
    ib.xrf_silver_percentage,
    ib.xrf_copper_percentage,
    ib.xrf_other_metals,
    ib.manufacturer,
    ib.manufacture_date,
    ib.certification_number,
    ib.status,
    ib.sale_date,
    COALESCE(prof.first_name || ' ' || prof.last_name, 'N/A') as buyer_name,
    prof.email as buyer_email,
    prof.phone as buyer_phone,
    ps.sale_number,
    ps.total_lyd as sale_total
  FROM inventory_bars ib
  JOIN products p ON ib.product_id = p.id
  LEFT JOIN profiles prof ON ib.buyer_id = prof.id
  LEFT JOIN pos_sales ps ON ib.sale_id = ps.id
  WHERE ib.store_id = p_store_id
  ORDER BY ib.created_at DESC;
END;
$$ LANGUAGE plpgsql;

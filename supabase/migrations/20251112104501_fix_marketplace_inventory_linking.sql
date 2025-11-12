/*
  # Fix Marketplace and Inventory Linking

  1. Changes
    - Link marketplace items to inventory by matching product_id
    - Update process_inventory_sale function to handle missing full_name
    - Create function to sync marketplace items with inventory
  
  2. Security
    - No RLS changes needed
*/

-- Update marketplace items to link with inventory
UPDATE store_marketplace_items smi
SET inventory_id = inv.id
FROM inventory inv
JOIN products p ON inv.product_id = p.id
WHERE smi.item_name = p.name
  AND smi.inventory_id IS NULL
  AND inv.quantity > 0;

-- Fix the record_customer_purchase function to handle missing full_name
CREATE OR REPLACE FUNCTION record_customer_purchase(
  p_store_id uuid,
  p_customer_id uuid,
  p_sale_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_customer record;
  v_sale record;
  v_items text;
  v_interaction_id uuid;
  v_customer_name text;
  v_customer_email text;
BEGIN
  -- Get customer details
  SELECT * INTO v_customer FROM profiles WHERE id = p_customer_id;
  
  -- Build customer name
  v_customer_name := COALESCE(
    NULLIF(TRIM(COALESCE(v_customer.first_name, '') || ' ' || COALESCE(v_customer.last_name, '')), ''),
    'Customer'
  );
  
  -- Get customer email
  v_customer_email := COALESCE(v_customer.email, 'no-email@example.com');
  
  -- Get sale details
  SELECT * INTO v_sale FROM pos_sales WHERE id = p_sale_id;
  
  -- Build items description
  SELECT string_agg(
    products.name || ' (' || psi.quantity || 'x)', 
    ', '
  ) INTO v_items
  FROM pos_sale_items psi
  JOIN products ON psi.product_id = products.id
  WHERE psi.sale_id = p_sale_id;
  
  -- Create customer interaction record
  INSERT INTO store_customer_interactions (
    store_id,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    interaction_type,
    notes
  ) VALUES (
    p_store_id,
    p_customer_id,
    v_customer_name,
    v_customer_email,
    v_customer.phone,
    'purchase',
    'Purchase #' || v_sale.sale_number || ' - Items: ' || COALESCE(v_items, 'N/A') || ' - Total: ' || v_sale.total_lyd || ' LYD'
  ) RETURNING id INTO v_interaction_id;
  
  -- Create transaction record
  INSERT INTO store_customer_transactions (
    interaction_id,
    transaction_type,
    amount,
    currency,
    description
  ) VALUES (
    v_interaction_id,
    'sale',
    v_sale.total_lyd,
    'LYD',
    'Sale #' || v_sale.sale_number
  );
  
  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically link marketplace items to inventory when they're created
CREATE OR REPLACE FUNCTION auto_link_marketplace_to_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_inventory_id uuid;
BEGIN
  -- Try to find matching inventory by product name
  SELECT inv.id INTO v_inventory_id
  FROM inventory inv
  JOIN products p ON inv.product_id = p.id
  WHERE p.name = NEW.item_name
    AND inv.quantity > 0
    AND inv.store_id = NEW.store_id
  LIMIT 1;
  
  -- If found, link it
  IF v_inventory_id IS NOT NULL THEN
    NEW.inventory_id := v_inventory_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-link marketplace items
DROP TRIGGER IF EXISTS trigger_auto_link_marketplace_inventory ON store_marketplace_items;
CREATE TRIGGER trigger_auto_link_marketplace_inventory
  BEFORE INSERT OR UPDATE ON store_marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_marketplace_to_inventory();

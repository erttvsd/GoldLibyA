/*
  # Create Inventory Sale System with Customer Tracking

  1. Changes
    - Add inventory_id column to pos_sale_items to track which inventory items were sold
    - Create trigger to automatically update inventory quantity when sales are made
    - Link sales to store_customer_interactions for customer desk tracking
    - Create function to process sales with inventory updates and customer records
  
  2. Security
    - No RLS changes needed (already disabled on inventory per user request)
*/

-- Add inventory_id to pos_sale_items to track which inventory was sold
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_sale_items' AND column_name = 'inventory_id'
  ) THEN
    ALTER TABLE pos_sale_items ADD COLUMN inventory_id uuid REFERENCES inventory(id);
  END IF;
END $$;

-- Create function to update inventory when a sale is completed
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if the sale is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update inventory quantities for all items in this sale
    UPDATE inventory
    SET quantity = inventory.quantity - psi.quantity
    FROM pos_sale_items psi
    WHERE psi.sale_id = NEW.id
      AND inventory.id = psi.inventory_id
      AND inventory.quantity >= psi.quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update inventory on sale completion
DROP TRIGGER IF EXISTS trigger_update_inventory_on_sale ON pos_sales;
CREATE TRIGGER trigger_update_inventory_on_sale
  AFTER UPDATE ON pos_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale();

-- Create function to record purchase in customer interactions
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
BEGIN
  -- Get customer details
  SELECT * INTO v_customer FROM profiles WHERE id = p_customer_id;
  
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
    COALESCE(v_customer.full_name, 'Customer'),
    COALESCE(v_customer.email, 'no-email@example.com'),
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

-- Create function to process a complete sale (inventory + customer tracking)
CREATE OR REPLACE FUNCTION process_inventory_sale(
  p_store_id uuid,
  p_clerk_id uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_sale_id uuid;
  v_sale_number text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_inventory record;
  v_product record;
  v_item_total numeric;
BEGIN
  -- Generate sale number
  v_sale_number := 'SALE-' || to_char(now(), 'YYYYMMDD') || '-' || substring(gen_random_uuid()::text, 1, 8);
  
  -- Calculate totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get inventory and product details
    SELECT * INTO v_inventory FROM inventory WHERE id = (v_item->>'inventory_id')::uuid;
    SELECT * INTO v_product FROM products WHERE id = v_inventory.product_id;
    
    -- Check if enough inventory
    IF v_inventory.quantity < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient inventory for product %', v_product.name;
    END IF;
    
    v_item_total := v_product.base_price_lyd * (v_item->>'quantity')::integer;
    v_subtotal := v_subtotal + v_item_total;
  END LOOP;
  
  v_total := v_subtotal;
  
  -- Create sale record
  INSERT INTO pos_sales (
    store_id,
    clerk_id,
    customer_id,
    sale_number,
    subtotal_lyd,
    total_lyd,
    status,
    notes
  ) VALUES (
    p_store_id,
    p_clerk_id,
    p_customer_id,
    v_sale_number,
    v_subtotal,
    v_total,
    'completed',
    p_notes
  ) RETURNING id INTO v_sale_id;
  
  -- Create sale items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_inventory FROM inventory WHERE id = (v_item->>'inventory_id')::uuid;
    SELECT * INTO v_product FROM products WHERE id = v_inventory.product_id;
    
    INSERT INTO pos_sale_items (
      sale_id,
      product_id,
      inventory_id,
      quantity,
      unit_price_lyd,
      total_lyd
    ) VALUES (
      v_sale_id,
      v_product.id,
      v_inventory.id,
      (v_item->>'quantity')::integer,
      v_product.base_price_lyd,
      v_product.base_price_lyd * (v_item->>'quantity')::integer
    );
  END LOOP;
  
  -- Record customer interaction
  PERFORM record_customer_purchase(p_store_id, p_customer_id, v_sale_id);
  
  -- Return sale details
  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'total', v_total,
    'success', true
  );
END;
$$ LANGUAGE plpgsql;

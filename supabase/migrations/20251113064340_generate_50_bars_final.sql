/*
  # Generate 50 Bars with Complete Tracking Data

  1. Changes
    - Generate 50 bars with serial numbers, XRF data, certifications
    - Mark some bars as sold with buyer information from existing profiles
    - Include realistic manufacturing and certification data
  
  2. Data Generated
    - 50 inventory bars for "دار السكة" store
    - 18 bars marked as sold
    - 32 bars in stock
*/

DO $$
DECLARE
  v_store_id uuid := 'faff52a3-f447-4f6e-831d-71aa7cef355e';
  v_clerk_id uuid;
  v_inventory_ids uuid[];
  v_buyer_ids uuid[];
  v_inventory_id uuid;
  v_product_id uuid;
  v_buyer_id uuid;
  v_sale_id uuid;
  v_serial text;
  v_bar_number text;
  v_weight numeric;
  v_purity text;
  v_gold_pct numeric;
  v_silver_pct numeric;
  v_copper_pct numeric;
  v_manufacturer text;
  v_cert_number text;
  v_status text;
  v_manufacturers text[] := ARRAY['PAMP Suisse', 'Valcambi', 'Perth Mint', 'Royal Canadian Mint', 'Credit Suisse', 'Johnson Matthey', 'Argor-Heraeus'];
  v_sale_number text;
  v_sale_total numeric;
  v_product_type text;
  v_product_carat int;
BEGIN
  -- Get a clerk
  SELECT id INTO v_clerk_id
  FROM profiles
  LIMIT 1;

  -- Get inventory IDs
  SELECT array_agg(id) INTO v_inventory_ids
  FROM inventory
  WHERE store_id = v_store_id;

  -- Get buyer IDs from existing profiles
  SELECT array_agg(id) INTO v_buyer_ids
  FROM (
    SELECT id FROM profiles ORDER BY created_at LIMIT 18
  ) sub;

  -- Generate 50 bars
  FOR i IN 1..50 LOOP
    v_inventory_id := v_inventory_ids[1 + floor(random() * array_length(v_inventory_ids, 1))::int];
    
    SELECT product_id INTO v_product_id FROM inventory WHERE id = v_inventory_id;
    SELECT type, carat, weight_grams INTO v_product_type, v_product_carat, v_weight FROM products WHERE id = v_product_id;

    v_serial := 'SN-2025-' || lpad(i::text, 5, '0') || '-' || upper(substring(md5(random()::text), 1, 6));
    v_bar_number := 'BAR-DS-2025-' || lpad(i::text, 6, '0');

    IF v_product_type = 'gold' THEN
      IF v_product_carat = 24 THEN
        v_purity := '99.99%';
        v_gold_pct := 99.99;
        v_silver_pct := 0.005;
        v_copper_pct := 0.003;
      ELSIF v_product_carat = 22 THEN
        v_purity := '91.67%';
        v_gold_pct := 91.67;
        v_silver_pct := 5.0;
        v_copper_pct := 3.33;
      ELSE
        v_purity := '75.00%';
        v_gold_pct := 75.0;
        v_silver_pct := 0.0;
        v_copper_pct := 25.0;
      END IF;
    ELSE
      v_purity := '99.90%';
      v_gold_pct := 0.0;
      v_silver_pct := 99.90;
      v_copper_pct := 0.08;
    END IF;

    v_manufacturer := v_manufacturers[1 + floor(random() * array_length(v_manufacturers, 1))::int];
    v_cert_number := 'CERT-' || substring(v_manufacturer, 1, 4) || '-2025-' || lpad((1000 + i)::text, 6, '0');

    IF i <= 18 AND array_length(v_buyer_ids, 1) >= i THEN
      v_status := 'sold';
      v_buyer_id := v_buyer_ids[i];
      v_sale_number := 'SALE-20251113-' || lpad(i::text, 4, '0');
      v_sale_total := (v_weight * (400000 + random() * 150000))::numeric(10,2);

      INSERT INTO pos_sales (
        store_id, sale_number, customer_id, clerk_id,
        total_lyd, subtotal_lyd, discount_lyd, tax_lyd,
        status, created_at
      ) VALUES (
        v_store_id, v_sale_number, v_buyer_id, v_clerk_id,
        v_sale_total, v_sale_total, 0, 0,
        'completed', now() - (random() * interval '60 days')
      ) RETURNING id INTO v_sale_id;
    ELSE
      v_status := 'in_stock';
      v_buyer_id := NULL;
      v_sale_id := NULL;
    END IF;

    INSERT INTO inventory_bars (
      inventory_id, store_id, product_id,
      serial_number, bar_number, weight_grams, purity,
      xrf_gold_percentage, xrf_silver_percentage, xrf_copper_percentage,
      xrf_other_metals, manufacturer, manufacture_date, certification_number,
      status, sale_id, buyer_id, sale_date, notes, created_at
    ) VALUES (
      v_inventory_id, v_store_id, v_product_id,
      v_serial, v_bar_number, v_weight, v_purity,
      round(v_gold_pct::numeric, 3), round(v_silver_pct::numeric, 3), round(v_copper_pct::numeric, 3),
      jsonb_build_object('Zinc', 0.005, 'Nickel', 0.003, 'Iron', 0.001),
      v_manufacturer, (now() - (random() * interval '1095 days'))::date, v_cert_number,
      v_status, v_sale_id, v_buyer_id,
      CASE WHEN v_status = 'sold' THEN now() - (random() * interval '60 days') ELSE NULL END,
      CASE WHEN v_status = 'sold' THEN 'Sold with full certification' ELSE 'Available for sale' END,
      now() - (random() * interval '365 days')
    );
  END LOOP;
END $$;

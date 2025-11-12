/*
  # Generate 50 Marketplace Items - Fixed

  Creates 50 diverse gold and precious metal items for the store marketplace
*/

DO $$
DECLARE
  v_store_id uuid;
  v_counter int := 1;
  v_item_name text;
  v_item_type text;
  v_metal_type text;
  v_weight decimal;
  v_purity text;
  v_price_lyd decimal;
  v_price_usd decimal;
  v_quantity int;
  v_description text;
  v_featured boolean;
  
  item_names text[] := ARRAY[
    'Classic Gold Bar', 'Premium Gold Coin', 'Luxury Gold Ingot', 'Traditional Gold Bracelet', 'Elegant Gold Necklace',
    'Investment Gold Bar', 'Collectible Gold Coin', 'Pure Gold Ring', 'Designer Gold Earrings', 'Royal Gold Chain',
    'Certified Gold Bar', 'Commemorative Gold Coin', 'Polished Gold Ingot', 'Antique Gold Pendant', 'Modern Gold Bangle',
    'Swiss Gold Bar', 'American Gold Eagle', 'Canadian Maple Leaf', 'Gold Wedding Band', 'Diamond Gold Ring',
    'Gold Bullion Bar', 'Gold Krugerrand', 'Gold Buffalo Coin', 'Gold Anklet', 'Gold Brooch',
    'PAMP Gold Bar', 'British Sovereign', 'Austrian Philharmonic', 'Gold Cufflinks', 'Gold Watch',
    'Credit Suisse Bar', 'Chinese Panda Coin', 'Gold Medallion', 'Gold Choker', 'Gold Tiara',
    'Perth Mint Bar', 'Mexican Gold Peso', 'Gold Medal', 'Gold Charm Bracelet', 'Gold Locket',
    'Valcambi Bar', 'South African Krugerrand', 'Gold Badge', 'Gold Waist Chain', 'Gold Crown',
    'Argor-Heraeus Bar', 'Australian Kangaroo', 'Gold Trophy', 'Gold Toe Ring', 'Gold Rosary'
  ];
  
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN RAISE EXCEPTION 'No store found'; END IF;
  
  FOR v_counter IN 1..50 LOOP
    v_item_name := item_names[v_counter];
    
    IF v_item_name LIKE '%Bar%' OR v_item_name LIKE '%Bullion%' THEN
      v_item_type := 'bar';
      v_metal_type := 'gold';
      v_weight := (1 + (random() * 1000))::decimal(10,3);
      v_purity := CASE WHEN v_counter % 2 = 0 THEN '24K' ELSE '999' END;
    ELSIF v_item_name LIKE '%Coin%' OR v_item_name LIKE '%Eagle%' OR v_item_name LIKE '%Maple%' OR v_item_name LIKE '%Krugerrand%' OR v_item_name LIKE '%Sovereign%' OR v_item_name LIKE '%Philharmonic%' OR v_item_name LIKE '%Panda%' OR v_item_name LIKE '%Peso%' OR v_item_name LIKE '%Kangaroo%' OR v_item_name LIKE '%Buffalo%' THEN
      v_item_type := 'coin';
      v_metal_type := 'gold';
      v_weight := (1 + (random() * 31))::decimal(10,3);
      v_purity := CASE WHEN v_counter % 3 = 0 THEN '24K' WHEN v_counter % 3 = 1 THEN '22K' ELSE '999' END;
    ELSIF v_item_name LIKE '%Ingot%' THEN
      v_item_type := 'ingot';
      v_metal_type := 'gold';
      v_weight := (10 + (random() * 490))::decimal(10,3);
      v_purity := '24K';
    ELSE
      v_item_type := 'jewelry';
      IF v_counter % 10 = 0 THEN
        v_metal_type := 'platinum';
        v_purity := '950';
      ELSIF v_counter % 5 = 0 THEN
        v_metal_type := 'silver';
        v_purity := '925';
      ELSE
        v_metal_type := 'gold';
        v_purity := CASE WHEN v_counter % 3 = 0 THEN '18K' WHEN v_counter % 3 = 1 THEN '21K' ELSE '22K' END;
      END IF;
      v_weight := (1 + (random() * 49))::decimal(10,3);
    END IF;
    
    IF v_metal_type = 'gold' THEN
      IF v_purity = '24K' OR v_purity = '999' THEN
        v_price_lyd := (v_weight * 300 * (0.9 + random() * 0.2))::decimal(12,2);
        v_price_usd := (v_weight * 70 * (0.9 + random() * 0.2))::decimal(12,2);
      ELSIF v_purity = '22K' THEN
        v_price_lyd := (v_weight * 275 * (0.9 + random() * 0.2))::decimal(12,2);
        v_price_usd := (v_weight * 64 * (0.9 + random() * 0.2))::decimal(12,2);
      ELSIF v_purity = '21K' THEN
        v_price_lyd := (v_weight * 262 * (0.9 + random() * 0.2))::decimal(12,2);
        v_price_usd := (v_weight * 61 * (0.9 + random() * 0.2))::decimal(12,2);
      ELSE
        v_price_lyd := (v_weight * 225 * (0.9 + random() * 0.2))::decimal(12,2);
        v_price_usd := (v_weight * 52 * (0.9 + random() * 0.2))::decimal(12,2);
      END IF;
    ELSIF v_metal_type = 'silver' THEN
      v_price_lyd := (v_weight * 3 * (0.9 + random() * 0.2))::decimal(12,2);
      v_price_usd := (v_weight * 0.7 * (0.9 + random() * 0.2))::decimal(12,2);
    ELSE
      v_price_lyd := (v_weight * 150 * (0.9 + random() * 0.2))::decimal(12,2);
      v_price_usd := (v_weight * 35 * (0.9 + random() * 0.2))::decimal(12,2);
    END IF;
    
    v_quantity := CASE WHEN v_counter % 7 = 0 THEN (1 + floor(random() * 5))::int ELSE (1 + floor(random() * 20))::int END;
    v_featured := (v_counter % 5 = 0);
    v_description := CASE 
      WHEN v_counter % 5 = 0 THEN 'High-quality precious metal item perfect for investment'
      WHEN v_counter % 5 = 1 THEN 'Certified authentic precious metal with hallmark'
      WHEN v_counter % 5 = 2 THEN 'Elegant design crafted by master artisans'
      WHEN v_counter % 5 = 3 THEN 'Investment-grade precious metal product'
      ELSE 'Premium quality with certificate of authenticity'
    END;
    
    INSERT INTO store_marketplace_items (store_id, item_name, item_type, metal_type, weight, purity, price_lyd, price_usd, quantity_available, description, is_available, featured, created_at)
    VALUES (v_store_id, v_item_name, v_item_type, v_metal_type, v_weight, v_purity, v_price_lyd, v_price_usd, v_quantity, v_description, true, v_featured, now() - (random() * interval '30 days'));
    
  END LOOP;
  
  RAISE NOTICE '50 marketplace items created successfully!';
END $$;

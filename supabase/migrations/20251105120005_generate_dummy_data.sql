/*
  # Generate Comprehensive Dummy Data

  Creates sample data for testing:
  1. Multiple stores with locations
  2. Store users with various roles
  3. Financial accounts with balances
  4. Sample appointments across stores
  5. Financial transactions
  6. Fund transfer requests
  7. Inventory with products
  8. Inventory transfer requests
*/

DO $$
DECLARE
  v_store1_id uuid;
  v_store2_id uuid;
  v_store3_id uuid;
  v_location1_id uuid;
  v_location2_id uuid;
  v_location3_id uuid;
  v_user1_id uuid;
  v_user2_id uuid;
  v_user3_id uuid;
  v_product1_id uuid;
  v_product2_id uuid;
  v_product3_id uuid;
  v_account_lyd_1 uuid;
  v_account_usd_1 uuid;
  v_account_lyd_2 uuid;
  v_account_lyd_3 uuid;
  v_transfer_request_id uuid;
  v_inventory_transfer_id uuid;
  i integer;
BEGIN
  -- Get or create sample users
  SELECT id INTO v_user1_id FROM profiles WHERE email LIKE '%test%' OR account_type = 'individual' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_user2_id FROM profiles WHERE email LIKE '%test%' OR account_type = 'individual' ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  SELECT id INTO v_user3_id FROM profiles WHERE email LIKE '%test%' OR account_type = 'individual' ORDER BY created_at DESC LIMIT 1 OFFSET 2;

  -- If no users, skip this migration
  IF v_user1_id IS NULL THEN
    RAISE NOTICE 'No users found, skipping dummy data generation';
    RETURN;
  END IF;

  -- Create locations if they don't exist
  INSERT INTO cash_deposit_locations (name, branch_code, address, city, phone, working_hours, working_days)
  VALUES ('Gold Souk Branch', 'GS001', 'Old City, Gold Souk Market', 'Tripoli', '+218-91-111-1111', '09:00-18:00', 'Sunday-Thursday')
  ON CONFLICT (branch_code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_location1_id;

  IF v_location1_id IS NULL THEN
    SELECT id INTO v_location1_id FROM cash_deposit_locations WHERE branch_code = 'GS001';
  END IF;

  INSERT INTO cash_deposit_locations (name, branch_code, address, city, phone, working_hours, working_days)
  VALUES ('Downtown Branch', 'DT002', 'Martyrs Square, Central District', 'Benghazi', '+218-91-222-2222', '09:00-17:00', 'Sunday-Thursday')
  ON CONFLICT (branch_code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_location2_id;

  IF v_location2_id IS NULL THEN
    SELECT id INTO v_location2_id FROM cash_deposit_locations WHERE branch_code = 'DT002';
  END IF;

  INSERT INTO cash_deposit_locations (name, branch_code, address, city, phone, working_hours, working_days)
  VALUES ('Airport Road Branch', 'AR003', 'Airport Road, Next to City Mall', 'Misrata', '+218-91-333-3333', '10:00-19:00', 'Sunday-Thursday')
  ON CONFLICT (branch_code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_location3_id;

  IF v_location3_id IS NULL THEN
    SELECT id INTO v_location3_id FROM cash_deposit_locations WHERE branch_code = 'AR003';
  END IF;

  -- Create stores
  INSERT INTO stores (name, city, address, phone, location_id, is_active)
  VALUES ('Gold Souk Trading', 'Tripoli', 'Old City, Gold Souk Market', '+218-91-111-1111', v_location1_id, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_store1_id;

  IF v_store1_id IS NULL THEN
    SELECT id INTO v_store1_id FROM stores WHERE name = 'Gold Souk Trading' LIMIT 1;
  END IF;

  INSERT INTO stores (name, city, address, phone, location_id, is_active)
  VALUES ('Benghazi Precious Metals', 'Benghazi', 'Martyrs Square, Central District', '+218-91-222-2222', v_location2_id, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_store2_id;

  IF v_store2_id IS NULL THEN
    SELECT id INTO v_store2_id FROM stores WHERE name = 'Benghazi Precious Metals' LIMIT 1;
  END IF;

  INSERT INTO stores (name, city, address, phone, location_id, is_active)
  VALUES ('Misrata Gold Center', 'Misrata', 'Airport Road, Next to City Mall', '+218-91-333-3333', v_location3_id, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_store3_id;

  IF v_store3_id IS NULL THEN
    SELECT id INTO v_store3_id FROM stores WHERE name = 'Misrata Gold Center' LIMIT 1;
  END IF;

  -- Assign users to stores
  INSERT INTO store_users (store_id, user_id, role, is_active, can_approve_high_value)
  VALUES (v_store1_id, v_user1_id, 'owner', true, true)
  ON CONFLICT (store_id, user_id) DO UPDATE SET is_active = true;

  IF v_user2_id IS NOT NULL THEN
    INSERT INTO store_users (store_id, user_id, role, is_active, can_approve_high_value)
    VALUES (v_store2_id, v_user2_id, 'manager', true, true)
    ON CONFLICT (store_id, user_id) DO UPDATE SET is_active = true;
  END IF;

  IF v_user3_id IS NOT NULL THEN
    INSERT INTO store_users (store_id, user_id, role, is_active, can_approve_high_value)
    VALUES (v_store3_id, v_user3_id, 'clerk', true, false)
    ON CONFLICT (store_id, user_id) DO UPDATE SET is_active = true;
  END IF;

  -- Initialize financial accounts
  PERFORM initialize_store_financial_accounts(v_store1_id);
  PERFORM initialize_store_financial_accounts(v_store2_id);
  PERFORM initialize_store_financial_accounts(v_store3_id);

  -- Add initial balances
  SELECT id INTO v_account_lyd_1 FROM store_financial_accounts WHERE store_id = v_store1_id AND currency = 'LYD';
  SELECT id INTO v_account_usd_1 FROM store_financial_accounts WHERE store_id = v_store1_id AND currency = 'USD';
  SELECT id INTO v_account_lyd_2 FROM store_financial_accounts WHERE store_id = v_store2_id AND currency = 'LYD';
  SELECT id INTO v_account_lyd_3 FROM store_financial_accounts WHERE store_id = v_store3_id AND currency = 'LYD';

  -- Add deposits
  UPDATE store_financial_accounts SET balance = 50000, available_balance = 50000 WHERE id = v_account_lyd_1;
  UPDATE store_financial_accounts SET balance = 5000, available_balance = 5000 WHERE id = v_account_usd_1;
  UPDATE store_financial_accounts SET balance = 35000, available_balance = 35000 WHERE id = v_account_lyd_2;
  UPDATE store_financial_accounts SET balance = 25000, available_balance = 25000 WHERE id = v_account_lyd_3;

  -- Create financial transactions
  INSERT INTO store_financial_transactions (store_id, account_id, transaction_type, amount, balance_before, balance_after, description, processed_by)
  VALUES
    (v_store1_id, v_account_lyd_1, 'deposit', 50000, 0, 50000, 'Initial deposit', v_user1_id),
    (v_store1_id, v_account_usd_1, 'deposit', 5000, 0, 5000, 'Initial USD deposit', v_user1_id),
    (v_store2_id, v_account_lyd_2, 'deposit', 35000, 0, 35000, 'Initial deposit', v_user2_id),
    (v_store3_id, v_account_lyd_3, 'deposit', 25000, 0, 25000, 'Initial deposit', v_user3_id);

  -- Create bank accounts
  INSERT INTO store_bank_accounts (store_id, bank_name, account_number, iban, account_holder_name, is_active, is_verified, created_by)
  VALUES
    (v_store1_id, 'Libyan National Bank', '1234567890', 'LY12345678901234567890', 'Gold Souk Trading', true, true, v_user1_id),
    (v_store2_id, 'Wahda Bank', '9876543210', 'LY98765432109876543210', 'Benghazi Precious Metals', true, true, v_user2_id);

  -- Create products
  INSERT INTO products (name, type, carat, weight_grams, base_price_lyd, is_active)
  VALUES ('24K Gold Bar 50g', 'gold', 24, 50, 14000, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_product1_id;

  IF v_product1_id IS NULL THEN
    SELECT id INTO v_product1_id FROM products WHERE name = '24K Gold Bar 50g' LIMIT 1;
  END IF;

  INSERT INTO products (name, type, carat, weight_grams, base_price_lyd, is_active)
  VALUES ('22K Gold Bar 100g', 'gold', 22, 100, 25000, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_product2_id;

  IF v_product2_id IS NULL THEN
    SELECT id INTO v_product2_id FROM products WHERE name = '22K Gold Bar 100g' LIMIT 1;
  END IF;

  INSERT INTO products (name, type, carat, weight_grams, base_price_lyd, is_active)
  VALUES ('Silver Bar 500g', 'silver', 999, 500, 2500, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_product3_id;

  IF v_product3_id IS NULL THEN
    SELECT id INTO v_product3_id FROM products WHERE name = 'Silver Bar 500g' LIMIT 1;
  END IF;

  -- Create inventory
  INSERT INTO inventory (store_id, product_id, quantity)
  VALUES
    (v_store1_id, v_product1_id, 20),
    (v_store1_id, v_product2_id, 15),
    (v_store1_id, v_product3_id, 30),
    (v_store2_id, v_product1_id, 10),
    (v_store2_id, v_product2_id, 8),
    (v_store3_id, v_product1_id, 5),
    (v_store3_id, v_product3_id, 25)
  ON CONFLICT (store_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

  -- Create sample appointments
  FOR i IN 1..5 LOOP
    INSERT INTO pickup_appointments (
      appointment_number, user_id, location_id, appointment_date, appointment_time,
      status, qr_code_data, verification_pin, notes, customer_name, customer_phone
    )
    VALUES (
      'APT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(i::text, 4, '0'),
      v_user1_id,
      v_location1_id,
      CURRENT_DATE + (i || ' days')::interval,
      (CASE WHEN i % 3 = 0 THEN '10:00' WHEN i % 3 = 1 THEN '14:00' ELSE '16:00' END),
      (CASE WHEN i <= 2 THEN 'confirmed' WHEN i <= 4 THEN 'pending' ELSE 'completed' END),
      'QR-TEST-' || LPAD(i::text, 6, '0'),
      LPAD((1000 + i)::text, 4, '0'),
      'Test appointment ' || i,
      'Customer ' || i,
      '+218-91-' || LPAD(i::text, 3, '0') || '-0000'
    )
    ON CONFLICT (appointment_number) DO NOTHING;
  END LOOP;

  -- Create fund transfer requests
  INSERT INTO store_fund_transfer_requests (
    from_store_id, to_store_id, currency, amount, status, reason, notes, requested_by
  )
  VALUES
    (v_store1_id, v_store2_id, 'LYD', 5000, 'pending', 'Rebalancing stock', 'Transfer for new inventory', v_user1_id),
    (v_store2_id, v_store3_id, 'LYD', 3000, 'completed', 'Supplier payment coordination', 'Completed transfer', v_user2_id),
    (v_store1_id, v_store3_id, 'LYD', 2000, 'approved', 'Emergency fund', NULL, v_user1_id)
  ON CONFLICT DO NOTHING;

  -- Create inventory transfer requests
  INSERT INTO store_inventory_transfer_requests (
    transfer_number, from_store_id, to_store_id, status, total_items,
    reason, notes, requested_by
  )
  VALUES
    (
      'IT-' || TO_CHAR(now(), 'YYYYMMDD') || '-001',
      v_store1_id, v_store2_id, 'approved', 5,
      'Restock low inventory', 'Approved by manager', v_user1_id
    ),
    (
      'IT-' || TO_CHAR(now(), 'YYYYMMDD') || '-002',
      v_store2_id, v_store3_id, 'in_transit', 3,
      'Transfer excess stock', 'In transit via courier', v_user2_id
    ),
    (
      'IT-' || TO_CHAR(now(), 'YYYYMMDD') || '-003',
      v_store1_id, v_store3_id, 'requested', 2,
      'New store opening support', 'Awaiting approval', v_user1_id
    )
  ON CONFLICT (transfer_number) DO NOTHING
  RETURNING id INTO v_inventory_transfer_id;

  -- Create inventory transfer items
  IF v_inventory_transfer_id IS NOT NULL THEN
    INSERT INTO store_inventory_transfer_items (
      transfer_request_id, product_id, serial_number, quantity, status
    )
    VALUES
      (v_inventory_transfer_id, v_product1_id, 'GOLD-TEST-001', 2, 'pending');
  END IF;

  RAISE NOTICE 'Dummy data generated successfully';
  RAISE NOTICE 'Store 1 ID: %', v_store1_id;
  RAISE NOTICE 'Store 2 ID: %', v_store2_id;
  RAISE NOTICE 'Store 3 ID: %', v_store3_id;
END $$;

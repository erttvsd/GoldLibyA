/*
  # Comprehensive Dummy Data for Store Operations (Corrected)

  Generates realistic test data with correct column names matching actual database schema.
*/

-- Insert Store Announcements
DO $$
DECLARE
  v_store_id uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_store_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO store_announcements (id, store_id, created_by, title, body, is_active, visible_from, visible_to, created_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_user_id,
      'Welcome to Our Gold Trading Store',
      'We are pleased to serve you with the finest gold products. Visit us for special offers on 24K gold bars and coins.',
      true, NOW() - INTERVAL '7 days', NOW() + INTERVAL '30 days', NOW() - INTERVAL '7 days'
    ),
    (
      gen_random_uuid(), v_store_id, v_user_id,
      'Upcoming Holiday Sale',
      'Join us next month for our special holiday promotion! Enjoy exclusive discounts on selected gold items.',
      true, NOW() + INTERVAL '15 days', NOW() + INTERVAL '45 days', NOW()
    ),
    (
      gen_random_uuid(), v_store_id, v_user_id,
      'Store Renovation Complete',
      'Our store renovation has been completed. Come see our new showroom.',
      true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '60 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Store Coupons (with correct column names)
DO $$
DECLARE
  v_store_id uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_store_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO store_coupons (id, store_id, code, kind, value, max_discount_lyd, min_purchase_lyd, starts_at, ends_at, max_usage, usage_count, active, created_by, created_at)
    VALUES (
      gen_random_uuid(), v_store_id, 'GOLD10', 'percentage', 10.00, 500.00, 1000.00,
      NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 100, 15, true, v_user_id, NOW() - INTERVAL '10 days'
    ),
    (
      gen_random_uuid(), v_store_id, 'SAVE50', 'fixed', 50.00, NULL, 500.00,
      NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 50, 8, true, v_user_id, NOW() - INTERVAL '5 days'
    ),
    (
      gen_random_uuid(), v_store_id, 'VIP15', 'percentage', 15.00, 1000.00, 5000.00,
      NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', 20, 3, true, v_user_id, NOW() - INTERVAL '15 days'
    ),
    (
      gen_random_uuid(), v_store_id, 'OLDSALE', 'percentage', 20.00, NULL, NULL,
      NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days', 200, 185, false, v_user_id, NOW() - INTERVAL '90 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Bank Accounts
DO $$
DECLARE
  v_store_id uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_store_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO store_bank_accounts (id, store_id, created_by, bank_name, account_number, iban, swift_code, account_holder_name, branch, is_active, is_verified, created_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_user_id,
      'National Bank of Libya', '1234567890', 'LY38 021 1234567890123', 'NBLYLYTR',
      'Gold Trading Store LLC', 'Main Branch, Tripoli', true, true, NOW() - INTERVAL '180 days'
    ),
    (
      gen_random_uuid(), v_store_id, v_user_id,
      'Libyan Commercial Bank', '9876543210', 'LY62 011 9876543210987', NULL,
      'Gold Trading Store LLC', 'Business District Branch', true, false, NOW() - INTERVAL '30 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert POS Sales and Payments (30 days history)
DO $$
DECLARE
  v_store_id uuid;
  v_customer_id uuid;
  v_clerk_id uuid;
  v_product_id uuid;
  v_sale_id uuid;
  v_date_offset int;
  v_amount numeric;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_customer_id FROM profiles LIMIT 1;
  SELECT id INTO v_clerk_id FROM profiles ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_product_id FROM products LIMIT 1;

  IF v_store_id IS NOT NULL AND v_customer_id IS NOT NULL AND v_product_id IS NOT NULL THEN
    FOR v_date_offset IN 1..30 LOOP
      v_amount := 2500.00 + (RANDOM() * 1000);
      v_sale_id := gen_random_uuid();

      INSERT INTO pos_sales (id, store_id, clerk_id, customer_id, subtotal, tax_amount, discount_amount, total_amount, status, created_at)
      VALUES (
        v_sale_id, v_store_id, COALESCE(v_clerk_id, v_customer_id), v_customer_id,
        v_amount, 0, 0, v_amount, 'completed',
        NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '9 hours'
      )
      ON CONFLICT DO NOTHING;

      INSERT INTO pos_sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, created_at)
      VALUES (
        gen_random_uuid(), v_sale_id, v_product_id, 1, v_amount, v_amount,
        NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '9 hours'
      )
      ON CONFLICT DO NOTHING;

      INSERT INTO pos_payments (id, sale_id, payment_method, amount, status, created_at)
      VALUES (
        gen_random_uuid(), v_sale_id,
        (ARRAY['cash', 'card', 'wallet', 'bank_transfer'])[(RANDOM() * 3 + 1)::int],
        v_amount, 'completed',
        NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '9 hours'
      )
      ON CONFLICT DO NOTHING;

      IF EXTRACT(DOW FROM NOW() - INTERVAL '1 day' * v_date_offset) NOT IN (5, 6) THEN
        v_amount := 3500.00 + (RANDOM() * 1500);
        v_sale_id := gen_random_uuid();

        INSERT INTO pos_sales (id, store_id, clerk_id, customer_id, subtotal, tax_amount, discount_amount, total_amount, status, created_at)
        VALUES (
          v_sale_id, v_store_id, COALESCE(v_clerk_id, v_customer_id), v_customer_id,
          v_amount, 0, (RANDOM() * 100), v_amount - (RANDOM() * 100), 'completed',
          NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '14 hours'
        )
        ON CONFLICT DO NOTHING;

        INSERT INTO pos_sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, created_at)
        VALUES (
          gen_random_uuid(), v_sale_id, v_product_id, 1, v_amount, v_amount,
          NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '14 hours'
        )
        ON CONFLICT DO NOTHING;

        INSERT INTO pos_payments (id, sale_id, payment_method, amount, status, created_at)
        VALUES (
          gen_random_uuid(), v_sale_id,
          (ARRAY['cash', 'card', 'wallet', 'bank_transfer'])[(RANDOM() * 3 + 1)::int],
          v_amount - (RANDOM() * 100), 'completed',
          NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '14 hours'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- Insert Financial Transactions
DO $$
DECLARE
  v_store_id uuid;
  v_account_id uuid;
  v_user_id uuid;
  v_date_offset int;
  v_amount numeric;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;
  SELECT id INTO v_account_id FROM store_financial_accounts WHERE store_id = v_store_id AND currency = 'LYD' LIMIT 1;

  IF v_store_id IS NOT NULL AND v_account_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    FOR v_date_offset IN 1..30 LOOP
      v_amount := 5000.00 + (RANDOM() * 3000);
      INSERT INTO store_financial_transactions (
        id, store_id, account_id, transaction_type, amount, balance_before, balance_after,
        reference_type, description, processed_by, created_at
      )
      VALUES (
        gen_random_uuid(), v_store_id, v_account_id, 'sale', v_amount,
        v_amount * v_date_offset, v_amount * (v_date_offset + 1),
        'pos_sale', 'Daily sales revenue', v_user_id,
        NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '18 hours'
      )
      ON CONFLICT DO NOTHING;

      IF RANDOM() > 0.6 THEN
        v_amount := 200.00 + (RANDOM() * 500);
        INSERT INTO store_financial_transactions (
          id, store_id, account_id, transaction_type, amount, balance_before, balance_after,
          reference_type, description, processed_by, created_at
        )
        VALUES (
          gen_random_uuid(), v_store_id, v_account_id, 'expense', v_amount,
          v_amount * v_date_offset, v_amount * v_date_offset - v_amount,
          'operational',
          (ARRAY['Store maintenance', 'Security services', 'Utilities payment', 'Staff supplies'])[(RANDOM() * 3 + 1)::int],
          v_user_id, NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '12 hours'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- Insert Location Change Requests
DO $$
DECLARE
  v_from_store_id uuid;
  v_to_store_id uuid;
  v_asset_id uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_from_store_id FROM stores LIMIT 1;
  SELECT id INTO v_to_store_id FROM stores OFFSET 1 LIMIT 1;
  SELECT id INTO v_asset_id FROM owned_assets WHERE status = 'in_store' LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_from_store_id IS NOT NULL AND v_asset_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    v_to_store_id := COALESCE(v_to_store_id, v_from_store_id);

    INSERT INTO location_change_requests (id, asset_id, from_store_id, to_store_id, requested_by, reason, status, created_at)
    VALUES (
      gen_random_uuid(), v_asset_id, v_from_store_id, v_to_store_id, v_user_id,
      'Customer requested transfer to branch closer to home', 'pending', NOW() - INTERVAL '2 days'
    ),
    (
      gen_random_uuid(), v_asset_id, v_from_store_id, v_to_store_id, v_user_id,
      'Inventory balancing between branches', 'approved', NOW() - INTERVAL '5 days'
    ),
    (
      gen_random_uuid(), v_asset_id, v_from_store_id, v_to_store_id, v_user_id,
      'Store consolidation', 'moved', NOW() - INTERVAL '15 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Appointments
DO $$
DECLARE
  v_store_id uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_store_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO appointments (id, user_id, store_id, appointment_date, appointment_type, status, notes, created_at)
    VALUES (
      gen_random_uuid(), v_user_id, v_store_id,
      NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'pickup', 'scheduled',
      'Customer will collect 50g gold bar', NOW()
    ),
    (
      gen_random_uuid(), v_user_id, v_store_id,
      NOW() + INTERVAL '1 day' + INTERVAL '14 hours', 'consultation', 'scheduled',
      'Gold investment consultation', NOW() - INTERVAL '2 days'
    ),
    (
      gen_random_uuid(), v_user_id, v_store_id,
      NOW() - INTERVAL '5 days' + INTERVAL '11 hours', 'pickup', 'completed',
      'Successfully picked up gold bars', NOW() - INTERVAL '7 days'
    ),
    (
      gen_random_uuid(), v_user_id, v_store_id,
      NOW() - INTERVAL '2 days' + INTERVAL '15 hours', 'consultation', 'cancelled',
      'Customer cancelled due to scheduling conflict', NOW() - INTERVAL '10 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

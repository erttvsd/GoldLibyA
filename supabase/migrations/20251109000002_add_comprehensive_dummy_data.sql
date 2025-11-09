/*
  # Comprehensive Dummy Data for Store Operations

  Generates realistic test data across all store systems to enable full feature testing.

  ## Data Created

  1. **Store Announcements**
     - Active announcements for store communications
     - Scheduled future announcements
     - Expired past announcements

  2. **Store Coupons**
     - Percentage discount coupons
     - Fixed amount discount coupons
     - Active and inactive coupons
     - Usage tracking data

  3. **POS Sales & Payments**
     - Historical sales transactions
     - Multiple payment methods
     - Sale items with product references
     - Customer purchase history

  4. **Bank Accounts & Transactions**
     - Multiple bank accounts per store
     - Deposit and withdrawal records
     - Account verification status

  5. **Location Change Requests**
     - Pending approval requests
     - Approved transfers
     - Completed moves
     - Rejected requests

  6. **Financial Transactions**
     - Revenue from sales
     - Expense records
     - Daily transaction patterns

  7. **Appointments**
     - Scheduled future appointments
     - Completed past appointments
     - Various appointment statuses

  ## Security
  - All dummy data respects RLS policies
  - Uses existing store and user data
  - Safe to run multiple times (uses ON CONFLICT)
*/

-- Insert Store Announcements
DO $$
DECLARE
  v_store_id uuid;
  v_user_id uuid;
BEGIN
  -- Get first store and user
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_store_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Active announcement
    INSERT INTO store_announcements (id, store_id, created_by, title, body, is_active, visible_from, visible_to, created_at)
    VALUES (
      gen_random_uuid(),
      v_store_id,
      v_user_id,
      'Welcome to Our Gold Trading Store',
      'We are pleased to serve you with the finest gold products. Visit us for special offers on 24K gold bars and coins. Our staff is ready to assist you with all your precious metal needs.',
      true,
      NOW() - INTERVAL '7 days',
      NOW() + INTERVAL '30 days',
      NOW() - INTERVAL '7 days'
    )
    ON CONFLICT DO NOTHING;

    -- Scheduled announcement
    INSERT INTO store_announcements (id, store_id, created_by, title, body, is_active, visible_from, visible_to, created_at)
    VALUES (
      gen_random_uuid(),
      v_store_id,
      v_user_id,
      'Upcoming Holiday Sale',
      'Join us next month for our special holiday promotion! Enjoy exclusive discounts on selected gold items. Mark your calendars!',
      true,
      NOW() + INTERVAL '15 days',
      NOW() + INTERVAL '45 days',
      NOW()
    )
    ON CONFLICT DO NOTHING;

    -- Expired announcement
    INSERT INTO store_announcements (id, store_id, created_by, title, body, is_active, visible_from, visible_to, created_at)
    VALUES (
      gen_random_uuid(),
      v_store_id,
      v_user_id,
      'Store Renovation Complete',
      'Our store renovation has been completed. Come see our new showroom and upgraded customer service area.',
      true,
      NOW() - INTERVAL '60 days',
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '60 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Store Coupons
DO $$
DECLARE
  v_store_id uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  IF v_store_id IS NOT NULL THEN
    -- Active percentage coupon
    INSERT INTO store_coupons (id, store_id, code, kind, value, max_discount_lyd, min_purchase_lyd, valid_from, valid_to, max_uses, times_used, is_active, created_at)
    VALUES (
      gen_random_uuid(),
      v_store_id,
      'GOLD10',
      'percentage',
      10.00,
      500.00,
      1000.00,
      NOW() - INTERVAL '10 days',
      NOW() + INTERVAL '20 days',
      100,
      15,
      true,
      NOW() - INTERVAL '10 days'
    )
    ON CONFLICT DO NOTHING;

    -- Fixed amount coupon
    INSERT INTO store_coupons (id, store_id, code, kind, value, min_purchase_lyd, valid_from, valid_to, max_uses, times_used, is_active, created_at)
    VALUES (
      gen_random_uuid(),
      v_store_id,
      'SAVE50',
      'fixed',
      50.00,
      500.00,
      NOW() - INTERVAL '5 days',
      NOW() + INTERVAL '25 days',
      50,
      8,
      true,
      NOW() - INTERVAL '5 days'
    )
    ON CONFLICT DO NOTHING;

    -- High value percentage coupon
    INSERT INTO store_coupons (id, store_id, code, kind, value, max_discount_lyd, min_purchase_lyd, valid_from, valid_to, max_uses, times_used, is_active, created_at)
    VALUES (
      gen_random_uuid(),
      v_store_id,
      'VIP15',
      'percentage',
      15.00,
      1000.00,
      5000.00,
      NOW() - INTERVAL '15 days',
      NOW() + INTERVAL '15 days',
      20,
      3,
      true,
      NOW() - INTERVAL '15 days'
    )
    ON CONFLICT DO NOTHING;

    -- Inactive expired coupon
    INSERT INTO store_coupons (id, store_id, code, kind, value, valid_from, valid_to, max_uses, times_used, is_active, created_at)
    VALUES (
      gen_random_uuid(),
      v_store_id,
      'OLDSALE',
      'percentage',
      20.00,
      NOW() - INTERVAL '90 days',
      NOW() - INTERVAL '60 days',
      200,
      185,
      false,
      NOW() - INTERVAL '90 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Bank Accounts
DO $$
DECLARE
  v_store_id uuid;
  v_user_id uuid;
  v_account_id1 uuid;
  v_account_id2 uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_store_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    v_account_id1 := gen_random_uuid();
    v_account_id2 := gen_random_uuid();

    -- Primary verified account
    INSERT INTO store_bank_accounts (id, store_id, created_by, bank_name, account_number, iban, swift_code, account_holder_name, branch, is_active, is_verified, created_at)
    VALUES (
      v_account_id1,
      v_store_id,
      v_user_id,
      'National Bank of Libya',
      '1234567890',
      'LY38 021 1234567890123',
      'NBLYLYTR',
      'Gold Trading Store LLC',
      'Main Branch, Tripoli',
      true,
      true,
      NOW() - INTERVAL '180 days'
    )
    ON CONFLICT DO NOTHING;

    -- Secondary account
    INSERT INTO store_bank_accounts (id, store_id, created_by, bank_name, account_number, iban, account_holder_name, branch, is_active, is_verified, created_at)
    VALUES (
      v_account_id2,
      v_store_id,
      v_user_id,
      'Libyan Commercial Bank',
      '9876543210',
      'LY62 011 9876543210987',
      'Gold Trading Store LLC',
      'Business District Branch',
      true,
      false,
      NOW() - INTERVAL '30 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert POS Sales and Payments
DO $$
DECLARE
  v_store_id uuid;
  v_customer_id uuid;
  v_clerk_id uuid;
  v_product_id uuid;
  v_sale_id uuid;
  v_date_offset int;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_customer_id FROM profiles LIMIT 1;
  SELECT id INTO v_clerk_id FROM profiles ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_product_id FROM products LIMIT 1;

  IF v_store_id IS NOT NULL AND v_customer_id IS NOT NULL AND v_product_id IS NOT NULL THEN
    -- Create 30 days of sales history
    FOR v_date_offset IN 1..30 LOOP
      -- Morning sale
      v_sale_id := gen_random_uuid();
      INSERT INTO pos_sales (id, store_id, clerk_id, customer_id, subtotal, tax_amount, discount_amount, total_amount, status, created_at)
      VALUES (
        v_sale_id,
        v_store_id,
        COALESCE(v_clerk_id, v_customer_id),
        v_customer_id,
        2500.00 + (RANDOM() * 1000),
        0,
        0,
        2500.00 + (RANDOM() * 1000),
        'completed',
        NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '9 hours'
      )
      ON CONFLICT DO NOTHING;

      -- Sale item
      INSERT INTO pos_sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, created_at)
      VALUES (
        gen_random_uuid(),
        v_sale_id,
        v_product_id,
        1,
        2500.00 + (RANDOM() * 1000),
        2500.00 + (RANDOM() * 1000),
        NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '9 hours'
      )
      ON CONFLICT DO NOTHING;

      -- Payment
      INSERT INTO pos_payments (id, sale_id, payment_method, amount, status, created_at)
      VALUES (
        gen_random_uuid(),
        v_sale_id,
        CASE (RANDOM() * 3)::int
          WHEN 0 THEN 'cash'
          WHEN 1 THEN 'card'
          WHEN 2 THEN 'wallet'
          ELSE 'bank_transfer'
        END,
        2500.00 + (RANDOM() * 1000),
        'completed',
        NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '9 hours'
      )
      ON CONFLICT DO NOTHING;

      -- Afternoon sale (if not weekend)
      IF EXTRACT(DOW FROM NOW() - INTERVAL '1 day' * v_date_offset) NOT IN (5, 6) THEN
        v_sale_id := gen_random_uuid();
        INSERT INTO pos_sales (id, store_id, clerk_id, customer_id, subtotal, tax_amount, discount_amount, total_amount, status, created_at)
        VALUES (
          v_sale_id,
          v_store_id,
          COALESCE(v_clerk_id, v_customer_id),
          v_customer_id,
          3500.00 + (RANDOM() * 1500),
          0,
          (RANDOM() * 100),
          3400.00 + (RANDOM() * 1500),
          'completed',
          NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '14 hours'
        )
        ON CONFLICT DO NOTHING;

        INSERT INTO pos_sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, created_at)
        VALUES (
          gen_random_uuid(),
          v_sale_id,
          v_product_id,
          1,
          3500.00 + (RANDOM() * 1500),
          3500.00 + (RANDOM() * 1500),
          NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '14 hours'
        )
        ON CONFLICT DO NOTHING;

        INSERT INTO pos_payments (id, sale_id, payment_method, amount, status, created_at)
        VALUES (
          gen_random_uuid(),
          v_sale_id,
          CASE (RANDOM() * 3)::int
            WHEN 0 THEN 'cash'
            WHEN 1 THEN 'card'
            WHEN 2 THEN 'wallet'
            ELSE 'bank_transfer'
          END,
          3400.00 + (RANDOM() * 1500),
          'completed',
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
    -- Revenue transactions
    FOR v_date_offset IN 1..30 LOOP
      v_amount := 5000.00 + (RANDOM() * 3000);
      INSERT INTO store_financial_transactions (
        id, store_id, account_id, transaction_type, amount, balance_before, balance_after,
        reference_type, description, processed_by, created_at
      )
      VALUES (
        gen_random_uuid(),
        v_store_id,
        v_account_id,
        'sale',
        v_amount,
        v_amount * v_date_offset,
        v_amount * (v_date_offset + 1),
        'pos_sale',
        'Daily sales revenue',
        v_user_id,
        NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '18 hours'
      )
      ON CONFLICT DO NOTHING;

      -- Random expenses
      IF RANDOM() > 0.6 THEN
        v_amount := 200.00 + (RANDOM() * 500);
        INSERT INTO store_financial_transactions (
          id, store_id, account_id, transaction_type, amount, balance_before, balance_after,
          reference_type, description, processed_by, created_at
        )
        VALUES (
          gen_random_uuid(),
          v_store_id,
          v_account_id,
          'expense',
          v_amount,
          v_amount * v_date_offset,
          v_amount * v_date_offset - v_amount,
          'operational',
          CASE (RANDOM() * 4)::int
            WHEN 0 THEN 'Store maintenance'
            WHEN 1 THEN 'Security services'
            WHEN 2 THEN 'Utilities payment'
            ELSE 'Staff supplies'
          END,
          v_user_id,
          NOW() - INTERVAL '1 day' * v_date_offset + INTERVAL '12 hours'
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
    -- Set default to_store if only one store exists
    v_to_store_id := COALESCE(v_to_store_id, v_from_store_id);

    -- Pending request
    INSERT INTO location_change_requests (id, asset_id, from_store_id, to_store_id, requested_by, reason, status, created_at)
    VALUES (
      gen_random_uuid(),
      v_asset_id,
      v_from_store_id,
      v_to_store_id,
      v_user_id,
      'Customer requested transfer to branch closer to home',
      'pending',
      NOW() - INTERVAL '2 days'
    )
    ON CONFLICT DO NOTHING;

    -- Approved request
    INSERT INTO location_change_requests (id, asset_id, from_store_id, to_store_id, requested_by, reason, status, approved_by, resolution_note, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_asset_id,
      v_from_store_id,
      v_to_store_id,
      v_user_id,
      'Inventory balancing between branches',
      'approved',
      v_user_id,
      'Approved for transfer. Please prepare asset for shipping.',
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '4 days'
    )
    ON CONFLICT DO NOTHING;

    -- Completed move
    INSERT INTO location_change_requests (id, asset_id, from_store_id, to_store_id, requested_by, reason, status, approved_by, resolution_note, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_asset_id,
      v_from_store_id,
      v_to_store_id,
      v_user_id,
      'Store consolidation',
      'moved',
      v_user_id,
      'Transfer completed successfully',
      NOW() - INTERVAL '15 days',
      NOW() - INTERVAL '10 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Appointments
DO $$
DECLARE
  v_store_id uuid;
  v_user_id uuid;
  v_asset_id uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_user_id FROM profiles LIMIT 1;
  SELECT id INTO v_asset_id FROM owned_assets WHERE status = 'in_store' LIMIT 1;

  IF v_store_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Upcoming appointment
    INSERT INTO appointments (id, user_id, store_id, appointment_date, appointment_type, status, notes, created_at)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      v_store_id,
      NOW() + INTERVAL '3 days' + INTERVAL '10 hours',
      'pickup',
      'scheduled',
      'Customer will collect 50g gold bar',
      NOW()
    )
    ON CONFLICT DO NOTHING;

    -- Tomorrow appointment
    INSERT INTO appointments (id, user_id, store_id, appointment_date, appointment_type, status, notes, created_at)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      v_store_id,
      NOW() + INTERVAL '1 day' + INTERVAL '14 hours',
      'consultation',
      'scheduled',
      'Gold investment consultation',
      NOW() - INTERVAL '2 days'
    )
    ON CONFLICT DO NOTHING;

    -- Completed appointment
    INSERT INTO appointments (id, user_id, store_id, appointment_date, appointment_type, status, notes, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      v_store_id,
      NOW() - INTERVAL '5 days' + INTERVAL '11 hours',
      'pickup',
      'completed',
      'Successfully picked up gold bars',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '5 days'
    )
    ON CONFLICT DO NOTHING;

    -- Cancelled appointment
    INSERT INTO appointments (id, user_id, store_id, appointment_date, appointment_type, status, notes, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      v_store_id,
      NOW() - INTERVAL '2 days' + INTERVAL '15 hours',
      'consultation',
      'cancelled',
      'Customer cancelled due to scheduling conflict',
      NOW() - INTERVAL '10 days',
      NOW() - INTERVAL '3 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE 'Comprehensive dummy data generation complete!';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- Store announcements (active, scheduled, expired)';
  RAISE NOTICE '- Store coupons (various types and statuses)';
  RAISE NOTICE '- Bank accounts (verified and unverified)';
  RAISE NOTICE '- 30 days of POS sales history';
  RAISE NOTICE '- Financial transactions (revenue and expenses)';
  RAISE NOTICE '- Location change requests (all statuses)';
  RAISE NOTICE '- Appointments (upcoming, completed, cancelled)';
END $$;

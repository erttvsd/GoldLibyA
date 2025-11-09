/*
  # Create دار السكة Store with Sample Data
*/

-- 1. Extend pickup_appointments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'pickup_appointments' AND column_name = 'customer_name') THEN
    ALTER TABLE public.pickup_appointments ADD COLUMN customer_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'pickup_appointments' AND column_name = 'customer_phone') THEN
    ALTER TABLE public.pickup_appointments ADD COLUMN customer_phone text;
  END IF;
END $$;

-- 2. Create store and sample data
DO $$
DECLARE
  v_store_id uuid;
  v_location_id uuid;
  v_user_id uuid;
  v_product_id uuid;
  v_bar_id uuid;
  v_appt_number text;
  i integer;
BEGIN
  -- Create location
  INSERT INTO public.cash_deposit_locations (
    name, branch_code, address, city, phone, working_hours, working_days, is_active
  ) VALUES (
    'دار السكة - الرئيسي', 'DSK001', 'شارع الجمهورية، المدينة القديمة',
    'طرابلس', '+218-91-234-5678', '09:00-17:00', 'السبت-الخميس', true
  ) 
  ON CONFLICT (branch_code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_location_id;

  IF v_location_id IS NULL THEN
    SELECT id INTO v_location_id FROM public.cash_deposit_locations WHERE branch_code = 'DSK001';
  END IF;

  -- Create store
  SELECT id INTO v_store_id FROM public.stores WHERE name = 'دار السكة' LIMIT 1;
  
  IF v_store_id IS NULL THEN
    INSERT INTO public.stores (name, city, location_id, address, phone, operating_hours, is_active)
    VALUES ('دار السكة', 'طرابلس', v_location_id, 'شارع الجمهورية، المدينة القديمة',
            '+218-91-234-5678', '09:00-17:00', true)
    RETURNING id INTO v_store_id;
  END IF;

  -- Get user
  SELECT id INTO v_user_id FROM public.profiles WHERE account_type = 'individual' 
  ORDER BY created_at DESC LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Create 10 appointments
  FOR i IN 1..10 LOOP
    v_appt_number := 'APT-DSK-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(i::text, 4, '0');
    
    IF NOT EXISTS (SELECT 1 FROM public.pickup_appointments WHERE appointment_number = v_appt_number) THEN

      INSERT INTO public.products (name, type, carat, weight_grams, base_price_lyd, is_active)
      VALUES (
        CASE WHEN i <= 5 THEN 'Gold Bar ' ELSE 'Silver Bar ' END ||
        CASE i WHEN 1 THEN '10g' WHEN 2 THEN '20g' WHEN 3 THEN '50g' WHEN 4 THEN '100g' WHEN 5 THEN '250g'
               WHEN 6 THEN '100g' WHEN 7 THEN '250g' WHEN 8 THEN '500g' WHEN 9 THEN '1000g' ELSE '5000g' END,
        CASE WHEN i <= 5 THEN 'gold' ELSE 'silver' END,
        CASE WHEN i <= 5 THEN (CASE WHEN i % 2 = 0 THEN 22 ELSE 24 END) ELSE 999 END,
        CASE i WHEN 1 THEN 10 WHEN 2 THEN 20 WHEN 3 THEN 50 WHEN 4 THEN 100 WHEN 5 THEN 250
               WHEN 6 THEN 100 WHEN 7 THEN 250 WHEN 8 THEN 500 WHEN 9 THEN 1000 ELSE 5000 END,
        CASE i WHEN 1 THEN 2800 WHEN 2 THEN 5600 WHEN 3 THEN 14000 WHEN 4 THEN 28000 WHEN 5 THEN 70000
               WHEN 6 THEN 450 WHEN 7 THEN 1125 WHEN 8 THEN 2250 WHEN 9 THEN 4500 ELSE 22500 END,
        true
      ) RETURNING id INTO v_product_id;

      INSERT INTO public.owned_assets (user_id, product_id, serial_number, status, pickup_store_id, is_digital, has_appointment)
      VALUES (
        v_user_id, v_product_id,
        CASE WHEN i <= 5 THEN 'GOLD-' ELSE 'SILVER-' END || LPAD((CASE WHEN i <= 5 THEN i ELSE i-5 END)::text, 6, '0'),
        'not_received', v_store_id, false, true
      ) RETURNING id INTO v_bar_id;

      INSERT INTO public.pickup_appointments (
        appointment_number, user_id, asset_id, location_id, appointment_date, appointment_time, status,
        qr_code_data, verification_pin, notes, customer_name, customer_phone
      ) VALUES (
        v_appt_number, v_user_id, v_bar_id, v_location_id,
        CURRENT_DATE + ((i % 7)::text || ' days')::interval,
        CASE i % 3 WHEN 0 THEN '10:00' WHEN 1 THEN '14:00' ELSE '16:00' END,
        'confirmed',
        'QR-' || LPAD(i::text, 8, '0'),
        LPAD((1000 + i)::text, 4, '0'),
        CASE WHEN i <= 5 THEN 'Gold' ELSE 'Silver' END || ' bar ready',
        CASE i WHEN 1 THEN 'أحمد محمد' WHEN 2 THEN 'فاطمة علي' WHEN 3 THEN 'محمود حسن'
               WHEN 4 THEN 'سارة خالد' WHEN 5 THEN 'عمر يوسف' WHEN 6 THEN 'ليلى أحمد'
               WHEN 7 THEN 'كريم سعيد' WHEN 8 THEN 'نور الدين' WHEN 9 THEN 'رانيا مصطفى'
               ELSE 'طارق عبدالله' END,
        '+218-91-' || LPAD(i::text, 3, '0') || '-1' || LPAD(i::text, 3, '0')
      );

    END IF;
  END LOOP;

END $$;

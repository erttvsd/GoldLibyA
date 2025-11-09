/*
  # Store Console Secure RPCs (Fixed)
*/

-- 1. Customer search
CREATE OR REPLACE FUNCTION store_search_customer(p_store_id uuid, p_query text)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  phone text,
  kyc_verified boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    p.id,
    (p.first_name || ' ' || p.last_name) as full_name,
    p.email,
    p.phone,
    EXISTS(SELECT 1 FROM kyc_details k WHERE k.user_id = p.id) as kyc_verified
  FROM profiles p
  WHERE is_store_user(p_store_id)
    AND (
      p.email ILIKE '%' || p_query || '%' 
      OR p.phone ILIKE '%' || p_query || '%'
      OR (p.first_name || ' ' || p.last_name) ILIKE '%' || p_query || '%'
    )
  LIMIT 50;
$$;

-- 2. Handover asset
CREATE OR REPLACE FUNCTION store_handover_asset(
  p_store_id uuid,
  p_appointment_id uuid,
  p_pin text,
  p_storage_fee_lyd numeric DEFAULT 0,
  p_payment_method text DEFAULT 'cash',
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_asset_id uuid;
  v_user_id uuid;
  v_handover_id uuid;
  v_appointment pickup_appointments;
BEGIN
  IF NOT is_store_user(p_store_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of this store';
  END IF;

  SELECT * INTO v_appointment
  FROM pickup_appointments
  WHERE id = p_appointment_id
    AND location_id IN (SELECT location_id FROM stores WHERE id = p_store_id)
    AND status IN ('confirmed', 'pending')
    AND verification_pin = p_pin;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid appointment or PIN';
  END IF;

  v_asset_id := v_appointment.asset_id;
  v_user_id := v_appointment.user_id;

  INSERT INTO asset_handovers (
    appointment_id, asset_id, store_id, user_id, processed_by,
    storage_fee_lyd, payment_method, notes
  ) VALUES (
    p_appointment_id, v_asset_id, p_store_id, v_user_id, auth.uid(),
    p_storage_fee_lyd, p_payment_method, p_notes
  ) RETURNING id INTO v_handover_id;

  UPDATE pickup_appointments
  SET status = 'completed', completed_at = now()
  WHERE id = p_appointment_id;

  UPDATE owned_assets
  SET status = 'received'
  WHERE id = v_asset_id;

  IF p_storage_fee_lyd > 0 AND p_payment_method = 'cash' THEN
    INSERT INTO store_cash_movements (
      store_id, clerk_id, movement_type, amount_lyd,
      reference_id, reference_type, notes
    ) VALUES (
      p_store_id, auth.uid(), 'sale', p_storage_fee_lyd,
      v_handover_id, 'handover', 'Storage fee'
    );
  END IF;

  RETURN v_handover_id;
END;
$$;

-- 3. POS Sale (simplified)
CREATE OR REPLACE FUNCTION store_pos_sale(p_store_id uuid, p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sale_id uuid;
  v_sale_number text;
  v_item jsonb;
  v_subtotal numeric := 0;
  v_total numeric;
BEGIN
  IF NOT is_store_user(p_store_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_sale_number := 'POS-' || EXTRACT(EPOCH FROM now())::bigint;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    v_subtotal := v_subtotal + ((v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric);
  END LOOP;

  v_total := v_subtotal;

  INSERT INTO pos_sales (
    store_id, sale_number, clerk_id, subtotal_lyd, total_lyd, status
  ) VALUES (
    p_store_id, v_sale_number, auth.uid(), v_subtotal, v_total, 'completed'
  ) RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    INSERT INTO pos_sale_items (
      sale_id, product_id, quantity, unit_price_lyd, total_lyd
    ) VALUES (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric
    );

    UPDATE inventory
    SET quantity = quantity - (v_item->>'quantity')::int
    WHERE store_id = p_store_id AND product_id = (v_item->>'product_id')::uuid;
  END LOOP;

  INSERT INTO pos_payments (sale_id, method, amount_lyd)
  VALUES (v_sale_id, COALESCE(p_payload->>'payment_method', 'cash'), v_total);

  IF COALESCE(p_payload->>'payment_method', 'cash') = 'cash' THEN
    INSERT INTO store_cash_movements (
      store_id, clerk_id, movement_type, amount_lyd, reference_id, reference_type
    ) VALUES (
      p_store_id, auth.uid(), 'sale', v_total, v_sale_id, 'pos_sale'
    );
  END IF;

  RETURN v_sale_id;
END;
$$;

-- 4. Dashboard stats
CREATE OR REPLACE FUNCTION store_get_dashboard_stats(p_store_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'today_appointments', (
      SELECT COUNT(*) FROM pickup_appointments pa
      JOIN stores s ON s.location_id = pa.location_id
      WHERE s.id = p_store_id
        AND DATE(pa.appointment_date) = CURRENT_DATE
    ),
    'today_sales', (
      SELECT COUNT(*) FROM pos_sales
      WHERE store_id = p_store_id AND DATE(created_at) = CURRENT_DATE
    ),
    'today_revenue', (
      SELECT COALESCE(SUM(total_lyd), 0) FROM pos_sales
      WHERE store_id = p_store_id AND DATE(created_at) = CURRENT_DATE
    )
  )
  WHERE is_store_user(p_store_id);
$$;

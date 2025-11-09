/*
  # Store Inventory Transfer RPCs

  Secure functions for inventory transfer operations:
  1. Request inventory transfer
  2. Approve inventory transfer
  3. Reject inventory transfer
  4. Mark transfer as shipped/in transit
  5. Receive inventory transfer
  6. Cancel transfer request
*/

-- 1. Request inventory transfer
CREATE OR REPLACE FUNCTION store_request_inventory_transfer(
  p_from_store_id uuid,
  p_to_store_id uuid,
  p_items jsonb,
  p_reason text,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_id uuid;
  v_transfer_number text;
  v_item jsonb;
  v_total_items int := 0;
BEGIN
  IF NOT is_store_user(p_from_store_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of source store';
  END IF;

  IF p_from_store_id = p_to_store_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same store';
  END IF;

  -- Generate transfer number
  v_transfer_number := 'IT-' || TO_CHAR(now(), 'YYYYMMDD-HH24MISS') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);

  -- Create transfer request
  INSERT INTO store_inventory_transfer_requests (
    transfer_number, from_store_id, to_store_id,
    status, reason, notes, requested_by
  ) VALUES (
    v_transfer_number, p_from_store_id, p_to_store_id,
    'requested', p_reason, p_notes, auth.uid()
  ) RETURNING id INTO v_request_id;

  -- Add items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO store_inventory_transfer_items (
      transfer_request_id, product_id, serial_number, quantity, status
    ) VALUES (
      v_request_id,
      (v_item->>'product_id')::uuid,
      v_item->>'serial_number',
      COALESCE((v_item->>'quantity')::int, 1),
      'pending'
    );
    v_total_items := v_total_items + COALESCE((v_item->>'quantity')::int, 1);
  END LOOP;

  -- Update total items
  UPDATE store_inventory_transfer_requests
  SET total_items = v_total_items
  WHERE id = v_request_id;

  RETURN v_request_id;
END;
$$;

-- 2. Approve inventory transfer
CREATE OR REPLACE FUNCTION store_approve_inventory_transfer(
  p_request_id uuid,
  p_approval_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request store_inventory_transfer_requests;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM store_inventory_transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found';
  END IF;

  IF v_request.status != 'requested' THEN
    RAISE EXCEPTION 'Transfer request is not in requested status';
  END IF;

  -- Check if user can approve (can be from either store)
  IF NOT (is_store_user(v_request.from_store_id) OR is_store_user(v_request.to_store_id)) THEN
    RAISE EXCEPTION 'Unauthorized to approve this transfer';
  END IF;

  -- Update request status
  UPDATE store_inventory_transfer_requests
  SET status = 'approved',
      approved_by = auth.uid(),
      approval_notes = p_approval_notes,
      approved_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  -- Update items status
  UPDATE store_inventory_transfer_items
  SET status = 'approved'
  WHERE transfer_request_id = p_request_id;

  RETURN true;
END;
$$;

-- 3. Reject inventory transfer
CREATE OR REPLACE FUNCTION store_reject_inventory_transfer(
  p_request_id uuid,
  p_rejection_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request store_inventory_transfer_requests;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM store_inventory_transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found';
  END IF;

  IF v_request.status NOT IN ('requested', 'approved') THEN
    RAISE EXCEPTION 'Transfer cannot be rejected in current status';
  END IF;

  -- Check authorization
  IF NOT (is_store_user(v_request.from_store_id) OR is_store_user(v_request.to_store_id)) THEN
    RAISE EXCEPTION 'Unauthorized to reject this transfer';
  END IF;

  -- Update request status
  UPDATE store_inventory_transfer_requests
  SET status = 'rejected',
      approved_by = auth.uid(),
      approval_notes = p_rejection_notes,
      approved_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  -- Update items status
  UPDATE store_inventory_transfer_items
  SET status = 'cancelled'
  WHERE transfer_request_id = p_request_id;

  RETURN true;
END;
$$;

-- 4. Mark transfer as shipped
CREATE OR REPLACE FUNCTION store_ship_inventory_transfer(
  p_request_id uuid,
  p_shipping_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request store_inventory_transfer_requests;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM store_inventory_transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found';
  END IF;

  IF v_request.status != 'approved' THEN
    RAISE EXCEPTION 'Transfer must be approved before shipping';
  END IF;

  -- Check authorization (must be from source store)
  IF NOT is_store_user(v_request.from_store_id) THEN
    RAISE EXCEPTION 'Only source store can mark as shipped';
  END IF;

  -- Update request status
  UPDATE store_inventory_transfer_requests
  SET status = 'in_transit',
      shipped_by = auth.uid(),
      shipping_reference = p_shipping_reference,
      notes = COALESCE(p_notes, notes),
      shipped_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  -- Update items status
  UPDATE store_inventory_transfer_items
  SET status = 'in_transit'
  WHERE transfer_request_id = p_request_id;

  -- Update inventory at source store (reduce quantity)
  UPDATE inventory i
  SET quantity = quantity - ti.quantity,
      updated_at = now()
  FROM store_inventory_transfer_items ti
  WHERE i.store_id = v_request.from_store_id
    AND i.product_id = ti.product_id
    AND ti.transfer_request_id = p_request_id;

  RETURN true;
END;
$$;

-- 5. Receive inventory transfer
CREATE OR REPLACE FUNCTION store_receive_inventory_transfer(
  p_request_id uuid,
  p_receipt_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request store_inventory_transfer_requests;
  v_item store_inventory_transfer_items;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM store_inventory_transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found';
  END IF;

  IF v_request.status != 'in_transit' THEN
    RAISE EXCEPTION 'Transfer must be in transit to receive';
  END IF;

  -- Check authorization (must be from destination store)
  IF NOT is_store_user(v_request.to_store_id) THEN
    RAISE EXCEPTION 'Only destination store can receive transfer';
  END IF;

  -- Update inventory at destination store (add quantity)
  FOR v_item IN
    SELECT * FROM store_inventory_transfer_items
    WHERE transfer_request_id = p_request_id
  LOOP
    -- Insert or update inventory
    INSERT INTO inventory (store_id, product_id, quantity)
    VALUES (v_request.to_store_id, v_item.product_id, v_item.quantity)
    ON CONFLICT (store_id, product_id)
    DO UPDATE SET
      quantity = inventory.quantity + EXCLUDED.quantity,
      updated_at = now();

    -- Record stock movement
    INSERT INTO stock_movements (
      store_id, product_id, movement_type, quantity,
      reference_type, reference_id, notes, created_by
    ) VALUES (
      v_request.to_store_id, v_item.product_id, 'transfer_in', v_item.quantity,
      'inventory_transfer', p_request_id, 'Received from transfer', auth.uid()
    );
  END LOOP;

  -- Update request status
  UPDATE store_inventory_transfer_requests
  SET status = 'received',
      received_by = auth.uid(),
      receipt_notes = p_receipt_notes,
      received_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  -- Update items status
  UPDATE store_inventory_transfer_items
  SET status = 'received'
  WHERE transfer_request_id = p_request_id;

  RETURN true;
END;
$$;

-- 6. Cancel transfer request
CREATE OR REPLACE FUNCTION store_cancel_inventory_transfer(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request store_inventory_transfer_requests;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM store_inventory_transfer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found';
  END IF;

  IF v_request.status NOT IN ('requested', 'approved') THEN
    RAISE EXCEPTION 'Transfer cannot be cancelled in current status';
  END IF;

  -- Check authorization (must be from source store)
  IF NOT is_store_user(v_request.from_store_id) THEN
    RAISE EXCEPTION 'Only source store can cancel transfer';
  END IF;

  -- Update request status
  UPDATE store_inventory_transfer_requests
  SET status = 'cancelled',
      notes = COALESCE(p_reason, notes),
      updated_at = now()
  WHERE id = p_request_id;

  -- Update items status
  UPDATE store_inventory_transfer_items
  SET status = 'cancelled'
  WHERE transfer_request_id = p_request_id;

  RETURN true;
END;
$$;

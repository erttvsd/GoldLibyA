/*
  # Generate 100 Customer Interactions - With Email Fallback

  Creates 100 customer interactions with chat and transaction history
*/

DO $$
DECLARE
  v_store_id uuid;
  v_customer_id uuid;
  v_interaction_id uuid;
  v_first_name text;
  v_last_name text;
  v_customer_name text;
  v_customer_email text;
  v_customer_phone text;
  v_interaction_type text;
  v_bar_number text;
  v_weight decimal;
  v_purity text;
  v_counter int := 1;
  v_chat_counter int;
  v_trans_counter int;
  v_amount decimal;
  v_store_user_id uuid;
  v_user_ids uuid[];
  v_user_count int;
  
  first_names text[] := ARRAY['Ahmed', 'Fatima', 'Mohammed', 'Aisha', 'Ali', 'Khadija', 'Omar', 'Zahra', 'Hassan', 'Nour', 'Youssef', 'Layla', 'Ibrahim', 'Maryam', 'Khalid', 'Sara', 'Abdullah', 'Rania', 'Mustafa', 'Hana', 'Tariq', 'Amina', 'Samir', 'Leila', 'Karim', 'Yasmin', 'Rashid', 'Salma', 'Hamza', 'Nadia', 'Malik', 'Dina', 'Bilal', 'Rana', 'Jamal', 'Huda', 'Faisal', 'Sana', 'Adel', 'Lina', 'Nabil', 'Maya', 'Walid', 'Samira', 'Ziad', 'Reem', 'Majid', 'Jana', 'Sami', 'Nada'];
  last_names text[] := ARRAY['Al-Mansour', 'Benali', 'El-Sayed', 'Khalil', 'Rahman', 'Yousef', 'Hassan', 'Amin', 'Malik', 'Farah', 'Salem', 'Nasser', 'Sharif', 'Habib', 'Karim', 'Haddad', 'Mansouri', 'Abboud', 'Rashid', 'Jamil'];
  
  purities text[] := ARRAY['24K', '22K', '21K', '18K'];
  
  messages_store text[] := ARRAY['Hello! How can I help you today?', 'Your appointment has been confirmed.', 'We have received your gold bar.', 'The verification process is complete.', 'Your transfer has been processed successfully.', 'Please bring your ID when you come to pick up.', 'The bar is ready for collection.', 'Would you like to schedule another appointment?', 'Thank you for choosing our store.', 'Is there anything else I can help you with?'];
  
  messages_customer text[] := ARRAY['I would like to store my gold bar.', 'When can I pick up my bar?', 'I want to transfer ownership.', 'Can you help me with the paperwork?', 'What are the storage fees?', 'I am interested in buying more gold.', 'How long will the verification take?', 'Thank you for your help.', 'I will come tomorrow.', 'Can I schedule an appointment?'];
  
  transaction_types text[] := ARRAY['purchase', 'transfer', 'pickup', 'deposit', 'withdrawal'];
  transaction_descs text[] := ARRAY['Gold bar purchase', 'Ownership transfer fee', 'Storage fee payment', 'Verification fee', 'Processing fee', 'Transfer service charge', 'Administrative fee', 'Deposit to account', 'Withdrawal from account', 'Bar pickup fee'];
  
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN RAISE EXCEPTION 'No store found'; END IF;
  
  SELECT user_id INTO v_store_user_id FROM store_users WHERE store_id = v_store_id LIMIT 1;
  IF v_store_user_id IS NULL THEN SELECT id INTO v_store_user_id FROM profiles LIMIT 1; END IF;
  
  SELECT ARRAY_AGG(id) INTO v_user_ids FROM profiles WHERE account_type = 'individual';
  v_user_count := COALESCE(array_length(v_user_ids, 1), 0);
  IF v_user_count = 0 THEN RAISE EXCEPTION 'No users found'; END IF;
  
  FOR v_counter IN 1..100 LOOP
    v_customer_id := v_user_ids[(v_counter % v_user_count) + 1];
    
    SELECT COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(email, ''), COALESCE(phone, '')
    INTO v_first_name, v_last_name, v_customer_email, v_customer_phone
    FROM profiles WHERE id = v_customer_id;
    
    v_first_name := CASE WHEN v_first_name = '' THEN first_names[(v_counter % 50) + 1] ELSE v_first_name END;
    v_last_name := CASE WHEN v_last_name = '' THEN last_names[(v_counter % 20) + 1] ELSE v_last_name END;
    v_customer_name := v_first_name || ' ' || v_last_name || ' #' || v_counter;
    v_customer_email := CASE WHEN v_customer_email = '' THEN lower(v_first_name || '.' || v_last_name || v_counter) || '@example.com' ELSE v_customer_email END;
    v_customer_phone := CASE WHEN v_customer_phone = '' THEN '+218' || (91000000 + v_counter)::text ELSE v_customer_phone END;
    
    v_interaction_type := CASE 
      WHEN v_counter <= 30 THEN 'appointment_set'
      WHEN v_counter <= 55 THEN 'picked_up'
      WHEN v_counter <= 75 THEN 'transferred'
      WHEN v_counter <= 90 THEN 'pending'
      ELSE 'cancelled' END;
    
    v_bar_number := 'BAR-' || to_char(v_counter, 'FM00000');
    v_weight := (10 + (random() * 990))::decimal(10,3);
    v_purity := purities[(v_counter % 4) + 1];
    
    INSERT INTO store_customer_interactions (store_id, customer_id, customer_name, customer_email, customer_phone, interaction_type, asset_bar_number, asset_weight, asset_purity, notes, created_at, updated_at)
    VALUES (v_store_id, v_customer_id, v_customer_name, v_customer_email, v_customer_phone, v_interaction_type, v_bar_number, v_weight, v_purity, 'Customer interaction #' || v_counter, now() - (random() * interval '60 days'), now() - (random() * interval '30 days'))
    RETURNING id INTO v_interaction_id;
    
    FOR v_chat_counter IN 1..(2 + floor(random() * 4))::int LOOP
      IF v_chat_counter % 2 = 1 THEN
        INSERT INTO store_customer_chat (interaction_id, sender_type, sender_id, message, created_at)
        VALUES (v_interaction_id, 'store', v_store_user_id, messages_store[(v_counter + v_chat_counter) % 10 + 1], now() - (random() * interval '50 days') + (v_chat_counter || ' hours')::interval);
      ELSE
        INSERT INTO store_customer_chat (interaction_id, sender_type, sender_id, message, created_at)
        VALUES (v_interaction_id, 'customer', v_customer_id, messages_customer[(v_counter + v_chat_counter) % 10 + 1], now() - (random() * interval '50 days') + (v_chat_counter || ' hours')::interval);
      END IF;
    END LOOP;
    
    FOR v_trans_counter IN 1..(1 + floor(random() * 3))::int LOOP
      v_amount := (50 + (random() * 950))::decimal(12,2);
      INSERT INTO store_customer_transactions (interaction_id, transaction_type, amount, currency, description, created_at)
      VALUES (v_interaction_id, transaction_types[(v_counter + v_trans_counter) % 5 + 1], v_amount, 'LYD', transaction_descs[(v_counter + v_trans_counter) % 10 + 1], now() - (random() * interval '45 days'));
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '100 customer interactions created!';
END $$;

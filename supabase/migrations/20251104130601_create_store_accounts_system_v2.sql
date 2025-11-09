/*
  # Create Store Accounts System
  
  ## Purpose
  Enable two types of accounts: Individual (customers) and Store (businesses)
  Stores can manage inventory, appointments, scan QR codes, and process pickups
  
  ## Changes
  
  1. Add account_type to profiles
  2. Create store_profiles table
  3. Create pickup_logs table  
  4. Create store_transactions table
  5. Add RLS policies for store operations
  
  ## Security
  - RLS enabled on all tables
  - Store staff can only access their own store data
*/

-- 1. Add account_type to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN account_type text DEFAULT 'individual' CHECK (account_type IN ('individual', 'store'));
  END IF;
END $$;

-- 2. Create store_profiles table
CREATE TABLE IF NOT EXISTS public.store_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.cash_deposit_locations(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  business_registration_number text,
  tax_id text,
  manager_name text NOT NULL,
  manager_phone text NOT NULL,
  manager_email text NOT NULL,
  permissions jsonb DEFAULT '{"manage_inventory": true, "process_pickups": true, "manage_appointments": true, "send_payments": true}'::jsonb,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_profiles_user ON public.store_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_store_profiles_store ON public.store_profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_store_profiles_location ON public.store_profiles(location_id);

ALTER TABLE public.store_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store profiles can view own profile"
  ON public.store_profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Store profiles can update own profile"
  ON public.store_profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Create pickup_logs table
CREATE TABLE IF NOT EXISTS public.pickup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.owned_assets(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES public.pickup_appointments(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL NOT NULL,
  processed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  qr_code_data text NOT NULL,
  id_photo_url text,
  customer_photo_url text,
  verification_notes text,
  verified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pickup_logs_asset ON public.pickup_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_customer ON public.pickup_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_store ON public.pickup_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_appointment ON public.pickup_logs(appointment_id);

ALTER TABLE public.pickup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own pickup logs"
  ON public.pickup_logs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = customer_id);

CREATE POLICY "Store staff can view store pickup logs"
  ON public.pickup_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_profiles
      WHERE user_id = (SELECT auth.uid()) AND store_id = pickup_logs.store_id
    )
  );

CREATE POLICY "Store staff can create pickup logs"
  ON public.pickup_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_profiles
      WHERE user_id = (SELECT auth.uid()) AND store_id = pickup_logs.store_id
    )
  );

-- 4. Create store_transactions table
CREATE TABLE IF NOT EXISTS public.store_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  processed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('send_to_individual', 'store_withdrawal', 'receive_from_individual')),
  amount numeric(15,2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('LYD', 'USD')),
  reference_number text NOT NULL,
  description text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_transactions_store ON public.store_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_transactions_recipient ON public.store_transactions(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_store_transactions_type ON public.store_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_store_transactions_date ON public.store_transactions(created_at DESC);

ALTER TABLE public.store_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store staff can view store transactions"
  ON public.store_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_profiles
      WHERE user_id = (SELECT auth.uid()) AND store_id = store_transactions.store_id
    )
  );

CREATE POLICY "Recipients can view transactions to them"
  ON public.store_transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = recipient_user_id);

CREATE POLICY "Store staff can create transactions"
  ON public.store_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_profiles
      WHERE user_id = (SELECT auth.uid()) AND store_id = store_transactions.store_id
    )
  );

-- 5. Add RLS policy for stores to view their appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pickup_appointments' 
    AND policyname = 'Store staff can view store appointments'
  ) THEN
    CREATE POLICY "Store staff can view store appointments"
      ON public.pickup_appointments FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.store_profiles sp
          JOIN public.stores s ON sp.store_id = s.id
          WHERE sp.user_id = (SELECT auth.uid()) 
            AND s.location_id = pickup_appointments.location_id
        )
      );
  END IF;
END $$;

-- 6. Add RLS policy for stores to update appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pickup_appointments' 
    AND policyname = 'Store staff can update store appointments'
  ) THEN
    CREATE POLICY "Store staff can update store appointments"
      ON public.pickup_appointments FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.store_profiles sp
          JOIN public.stores s ON sp.store_id = s.id
          WHERE sp.user_id = (SELECT auth.uid()) 
            AND s.location_id = pickup_appointments.location_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.store_profiles sp
          JOIN public.stores s ON sp.store_id = s.id
          WHERE sp.user_id = (SELECT auth.uid()) 
            AND s.location_id = pickup_appointments.location_id
        )
      );
  END IF;
END $$;

-- 7. Add RLS policy for stores to view inventory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventory' 
    AND policyname = 'Store staff can view store inventory'
  ) THEN
    CREATE POLICY "Store staff can view store inventory"
      ON public.inventory FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.store_profiles
          WHERE user_id = (SELECT auth.uid()) AND store_id = inventory.store_id
        )
      );
  END IF;
END $$;

-- 8. Add RLS policy for stores to update inventory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventory' 
    AND policyname = 'Store staff can update store inventory'
  ) THEN
    CREATE POLICY "Store staff can update store inventory"
      ON public.inventory FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.store_profiles
          WHERE user_id = (SELECT auth.uid()) AND store_id = inventory.store_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.store_profiles
          WHERE user_id = (SELECT auth.uid()) AND store_id = inventory.store_id
        )
      );
  END IF;
END $$;

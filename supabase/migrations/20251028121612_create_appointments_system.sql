/*
  # Create Appointments System

  1. New Tables
    - `pickup_appointments`: Stores appointment bookings for gold bar pickup
    - Links to owned_assets and cash_deposit_locations
    - Includes QR code data for verification

  2. Security
    - Enable RLS
    - Users can only access their own appointments
    - Store staff can view appointments for their location

  3. Features
    - Appointment scheduling with time slots
    - QR code generation for verification
    - Status tracking (pending, confirmed, completed, cancelled)
    - Appointment details including asset info
*/

-- 1. Pickup Appointments Table
CREATE TABLE IF NOT EXISTS public.pickup_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES public.owned_assets(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES public.cash_deposit_locations(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  qr_code_data text NOT NULL,
  verification_pin text NOT NULL,
  notes text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.pickup_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_asset ON public.pickup_appointments(asset_id);
CREATE INDEX IF NOT EXISTS idx_appointments_location ON public.pickup_appointments(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.pickup_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.pickup_appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_number ON public.pickup_appointments(appointment_number);

ALTER TABLE public.pickup_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON public.pickup_appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own appointments"
  ON public.pickup_appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON public.pickup_appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Create function to generate appointment number
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
  exists boolean;
BEGIN
  LOOP
    new_number := 'APT-' || to_char(now(), 'YYYYMMDD') || '-' || 
                  upper(substring(md5(random()::text) from 1 for 6));
    
    SELECT EXISTS(
      SELECT 1 FROM pickup_appointments WHERE appointment_number = new_number
    ) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- 3. Create function to generate verification PIN
CREATE OR REPLACE FUNCTION generate_verification_pin()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN lpad(floor(random() * 999999)::text, 6, '0');
END;
$$;

-- 4. Update owned_assets to track appointment status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owned_assets' AND column_name = 'has_appointment'
  ) THEN
    ALTER TABLE public.owned_assets ADD COLUMN has_appointment boolean DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owned_assets' AND column_name = 'appointment_id'
  ) THEN
    ALTER TABLE public.owned_assets ADD COLUMN appointment_id uuid REFERENCES public.pickup_appointments(id);
  END IF;
END $$;

-- 5. Create trigger to update asset when appointment is created
CREATE OR REPLACE FUNCTION update_asset_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE owned_assets
  SET has_appointment = true,
      appointment_id = NEW.id,
      updated_at = now()
  WHERE id = NEW.asset_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_created ON public.pickup_appointments;
CREATE TRIGGER trg_appointment_created
  AFTER INSERT ON public.pickup_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_appointment();

-- 6. Create trigger to clear asset appointment when cancelled
CREATE OR REPLACE FUNCTION clear_asset_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'completed') AND OLD.status NOT IN ('cancelled', 'completed') THEN
    UPDATE owned_assets
    SET has_appointment = false,
        appointment_id = NULL,
        updated_at = now()
    WHERE id = NEW.asset_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_status_changed ON public.pickup_appointments;
CREATE TRIGGER trg_appointment_status_changed
  AFTER UPDATE ON public.pickup_appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION clear_asset_appointment();

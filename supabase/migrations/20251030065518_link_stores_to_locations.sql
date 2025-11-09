/*
  # Link Stores to Cash Deposit Locations
  
  ## Purpose
  Connect the stores table (used for purchases) with cash_deposit_locations table (used for appointments).
  Each store should have a corresponding pickup location for appointment booking.
  
  ## Changes
  1. Add location_id column to stores table
  2. Match existing stores with cash_deposit_locations by name/city
  3. Create missing locations for stores that don't have matches
  
  ## Security
  - No RLS changes needed
  - Maintains existing policies
*/

-- 1. Add location_id to stores table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE public.stores 
    ADD COLUMN location_id uuid REFERENCES public.cash_deposit_locations(id);
  END IF;
END $$;

-- 2. For each store, try to match with existing location or create new one
DO $$
DECLARE
  store_record RECORD;
  location_id_var uuid;
BEGIN
  FOR store_record IN SELECT * FROM public.stores LOOP
    -- Try to find matching location by name and city
    SELECT id INTO location_id_var
    FROM public.cash_deposit_locations
    WHERE name = store_record.name AND city = store_record.city
    LIMIT 1;
    
    -- If no match found, create a new location
    IF location_id_var IS NULL THEN
      INSERT INTO public.cash_deposit_locations (
        name,
        branch_code,
        city,
        address,
        phone,
        working_hours,
        working_days,
        services,
        is_active
      ) VALUES (
        store_record.name,
        'BR-' || substring(md5(random()::text) from 1 for 6),
        store_record.city,
        store_record.address,
        COALESCE(store_record.phone, ''),
        '9:00 AM - 5:00 PM',
        'Sunday - Thursday',
        ARRAY['gold_purchase', 'silver_purchase', 'pickup', 'cash_deposit']::text[],
        store_record.is_active
      )
      RETURNING id INTO location_id_var;
    END IF;
    
    -- Update store with location_id
    UPDATE public.stores 
    SET location_id = location_id_var 
    WHERE id = store_record.id;
  END LOOP;
END $$;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_stores_location_id ON public.stores(location_id);

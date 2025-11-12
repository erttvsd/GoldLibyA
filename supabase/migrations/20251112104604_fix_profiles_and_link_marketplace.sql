/*
  # Fix Profiles and Link Marketplace to Inventory

  1. Changes
    - Make first_name and last_name nullable in profiles table
    - Fix account_type constraint to include 'customer'
    - Create profile for bibasly user
    - Link marketplace items to actual inventory
  
  2. Security
    - No RLS changes needed
*/

-- Make first_name and last_name nullable
ALTER TABLE profiles 
ALTER COLUMN first_name DROP NOT NULL;

ALTER TABLE profiles 
ALTER COLUMN last_name DROP NOT NULL;

-- Update account_type constraint to include customer
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_account_type_check 
CHECK (account_type = ANY (ARRAY['individual'::text, 'store'::text, 'customer'::text]));

-- Create profile for bibasly user
INSERT INTO profiles (id, email, first_name, last_name, account_type)
VALUES (
  '3ac01026-70f6-4726-827e-f3a3684d32e9',
  'bibasly@gmail.com',
  'Bibas',
  'User',
  'individual'
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
  last_name = COALESCE(profiles.last_name, EXCLUDED.last_name),
  account_type = COALESCE(profiles.account_type, EXCLUDED.account_type);

-- Now link marketplace items to actual inventory
-- For each marketplace item, find a matching inventory item from the same store
UPDATE store_marketplace_items smi
SET inventory_id = (
  SELECT inv.id
  FROM inventory inv
  JOIN products p ON inv.product_id = p.id
  WHERE inv.store_id = smi.store_id
    AND inv.quantity > 0
    AND p.type = CASE 
      WHEN smi.metal_type = 'gold' THEN 'gold'
      WHEN smi.metal_type = 'silver' THEN 'silver'
      ELSE 'gold'
    END
  ORDER BY inv.quantity DESC
  LIMIT 1
)
WHERE smi.inventory_id IS NULL;

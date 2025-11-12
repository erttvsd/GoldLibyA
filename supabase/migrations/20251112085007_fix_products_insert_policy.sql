/*
  # Fix Products Table RLS Policies

  1. Changes
    - Add INSERT policy for authenticated users
    - Add UPDATE policy for authenticated users
    - Add DELETE policy for authenticated users
    
  2. Security
    - Authenticated users can insert new products
    - Authenticated users can update products
    - Authenticated users can delete products
    - All users can read active products (existing policy)
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

-- Add INSERT policy for products
CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for products
CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for products
CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

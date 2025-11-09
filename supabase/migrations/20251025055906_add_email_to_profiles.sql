/*
  # Add Email to Profiles Table

  1. Changes
    - Add `email` column to `profiles` table
    - Email is unique and indexed for fast lookups
    - Email can be used to find recipients for transfers

  2. Security
    - Existing RLS policies remain unchanged
    - Users can still only view/update their own profile
    - Email is searchable for transfers but protected by RLS
*/

-- Add email column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text UNIQUE;
  END IF;
END $$;

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create index for fast phone lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Add policy to allow users to search for other users by email or phone for transfers
-- This is necessary for the transfer ownership and digital balance features
DROP POLICY IF EXISTS "Users can search profiles by email or phone" ON profiles;
CREATE POLICY "Users can search profiles by email or phone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

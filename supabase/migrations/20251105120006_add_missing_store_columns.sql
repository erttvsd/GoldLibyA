/*
  # Add Missing Store Columns

  Adds optional columns to stores table for better functionality:
  - operating_hours: Store operating schedule
  - email: Store email address
*/

-- Add operating_hours column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'operating_hours'
  ) THEN
    ALTER TABLE stores ADD COLUMN operating_hours text;
  END IF;
END $$;

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'email'
  ) THEN
    ALTER TABLE stores ADD COLUMN email text;
  END IF;
END $$;

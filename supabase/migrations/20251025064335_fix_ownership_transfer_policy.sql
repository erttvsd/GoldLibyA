/*
  # Fix Ownership Transfer Policy

  1. Changes
    - Update the owned_assets UPDATE policy to allow ownership transfers
    - Allow users to update assets they own (USING clause)
    - Remove restriction on new owner (remove WITH CHECK clause requiring auth.uid())
    - This enables legitimate ownership transfers while maintaining security

  2. Security
    - Users can only update assets they currently own (USING clause)
    - Users can transfer to any valid user_id (removes WITH CHECK restriction)
    - The USING clause ensures only current owners can initiate transfers
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can update own assets" ON public.owned_assets;

-- Create new policy that allows ownership transfers
CREATE POLICY "Users can update own assets"
  ON public.owned_assets
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);
  -- Note: WITH CHECK clause removed to allow changing user_id to someone else

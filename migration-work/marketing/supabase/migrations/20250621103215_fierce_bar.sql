/*
  # Fix infinite recursion in user_roles RLS policy

  1. Problem
    - The "Admin users can manage all roles" policy on user_roles table causes infinite recursion
    - Policy uses direct subquery on user_roles table to check if user is admin
    - This creates a recursive loop when the policy tries to evaluate itself

  2. Solution
    - Drop the problematic policy that uses direct subquery
    - Recreate the policy using the is_admin() function
    - The is_admin() function uses SECURITY DEFINER to bypass RLS for its internal query
    - This breaks the recursion cycle and allows safe admin role checking

  3. Changes
    - Remove existing "Admin users can manage all roles" policy
    - Create new policy using is_admin() function for safe role checking
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admin users can manage all roles" ON public.user_roles;

-- Recreate the policy using the safe is_admin() function
-- The is_admin() function uses SECURITY DEFINER to bypass RLS for its internal query
CREATE POLICY "Admin users can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
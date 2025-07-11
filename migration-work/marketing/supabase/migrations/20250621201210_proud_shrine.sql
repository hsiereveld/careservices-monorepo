/*
  # Fix infinite recursion in user_roles policies

  1. Problem
    - The "Admin users can manage all roles" policy creates infinite recursion
    - Policy tries to query user_roles table within its own USING clause
    - This happens when any RLS policy indirectly references user roles

  2. Solution
    - Drop the problematic policy that uses direct subquery
    - Recreate it using the is_admin() helper function
    - The is_admin() function uses SECURITY DEFINER to bypass RLS
    - This prevents the recursive loop during policy evaluation

  3. Changes
    - Remove recursive policy on user_roles table
    - Add non-recursive policy using helper function
    - Ensure all admin operations work correctly
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admin users can manage all roles" ON public.user_roles;

-- Recreate the admin policy using the is_admin() helper function
-- This prevents recursion because is_admin() uses SECURITY DEFINER
CREATE POLICY "Admin users can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Also ensure we have a clean BackOffice policy without recursion
DROP POLICY IF EXISTS "BackOffice can read all user roles" ON public.user_roles;

CREATE POLICY "BackOffice can read all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'backoffice'
    )
  );

-- Ensure the is_admin() function exists and is properly configured
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Also create helper function for backoffice to avoid future recursion issues
CREATE OR REPLACE FUNCTION public.is_backoffice()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'backoffice'
  );
$$;

-- Update BackOffice policy to use helper function for consistency
DROP POLICY IF EXISTS "BackOffice can read all user roles" ON public.user_roles;

CREATE POLICY "BackOffice can read all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (is_backoffice());
/*
  # Fix User Roles Policy Recursion

  1. Problem
    - Infinite recursion in user_roles policies
    - Admin policy trying to query user_roles from within user_roles policy
    - Duplicate policy creation errors

  2. Solution
    - Drop all existing problematic policies on user_roles
    - Create simple, non-recursive policies
    - Use service_role for admin operations instead of RLS policies
    - Ensure users can only manage their own roles

  3. Security
    - Users can only read/update their own role
    - Service role (backend) handles admin operations
    - No recursive policy checks
*/

-- Drop all existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Admin users can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all user roles" ON user_roles;

-- Create simple, non-recursive policies for user_roles
-- Users can read their own role (no recursion)
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own role (for registration)
CREATE POLICY "Users can insert own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own role (limited cases)
CREATE POLICY "Users can update own role"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all user roles (for admin operations)
CREATE POLICY "Service role can manage all user roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Update helper functions to be non-recursive and safe
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

CREATE OR REPLACE FUNCTION public.has_admin_privileges()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'backoffice')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_professional()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'professional'
  );
$$;

-- Update other table policies that might be using problematic admin checks
-- Fix profiles policies to use the helper functions correctly
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Admins can delete all profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert all profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
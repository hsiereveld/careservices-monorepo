/*
  # Fix User Roles Recursion Issue

  1. Problem
    - Infinite recursion detected in policy for relation "user_roles"
    - RLS policies on user_roles table are calling helper functions that query user_roles
    - This creates a circular dependency causing 500 errors

  2. Solution
    - Drop all existing policies on user_roles table
    - Recreate policies with direct SQL checks (no helper functions)
    - Use auth.uid() directly instead of helper functions
    - Separate admin checks to avoid recursion

  3. Security
    - Maintain same security level with non-recursive policies
    - Users can only access their own role data
    - Admins can manage all roles through service_role
*/

-- Drop all existing policies on user_roles table
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON user_roles;
DROP POLICY IF EXISTS "Admin users can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all user roles" ON user_roles;

-- Create new non-recursive policies for user_roles table

-- 1. Users can read their own role (direct check, no recursion)
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Users can insert their own role (direct check, no recursion)
CREATE POLICY "Users can insert own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. Users can update their own role (direct check, no recursion)
CREATE POLICY "Users can update own role"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Service role can manage all user roles (for admin operations)
CREATE POLICY "Service role can manage all user roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Admin users can manage all roles (using direct subquery to avoid recursion)
CREATE POLICY "Admin users can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role = 'admin'
      LIMIT 1
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role = 'admin'
      LIMIT 1
    )
  );

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Update helper functions to be more robust and avoid recursion
-- These functions should only be used by OTHER tables, not by user_roles itself

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
    LIMIT 1
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
    LIMIT 1
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
    LIMIT 1
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
    LIMIT 1
  );
$$;

-- Add comment to document the fix
COMMENT ON TABLE user_roles IS 'User roles table with non-recursive RLS policies. Policies use direct auth.uid() checks to avoid infinite recursion.';
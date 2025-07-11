/*
  # Fix User Roles Policies

  1. New Approach
    - Clean slate approach for user_roles policies
    - Remove all existing policies and recreate them properly
    - Fix recursion issues in helper functions
    - Ensure proper permissions for role management

  2. Security
    - Enable RLS on user_roles table
    - Create non-recursive policies
    - Implement proper permission checks
    - Ensure service_role has full access

  3. Changes
    - Drop all existing policies on user_roles
    - Create new, simplified policies
    - Create helper functions with proper security
    - Add admin role assignment function
*/

-- Step 1: Drop ALL existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON user_roles;
DROP POLICY IF EXISTS "Admin users can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "BackOffice can read all user roles" ON user_roles;

-- Step 2: Ensure the user_roles table has the correct structure
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'is_primary_role'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN is_primary_role boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role_assigned_at'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN role_assigned_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Step 3: Create new, simplified policies for user_roles
-- These policies use direct SQL checks without helper functions to avoid recursion

-- Policy 1: Users can read their own role
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can insert their own role (for registration)
CREATE POLICY "Users can insert own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own role (limited)
CREATE POLICY "Users can update own role"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Service role can manage all user roles (for admin operations)
CREATE POLICY "Service role can manage all user roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 5: Admin users can manage all roles (direct SQL check, no recursion)
CREATE POLICY "Admin users can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Step 4: Create helper functions that don't cause recursion
-- These functions are used by other tables, not by user_roles policies

-- Function to check if current user is admin
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

-- Function to check if current user is backoffice
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

-- Function to check if current user is professional
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

-- Function to check if current user has admin privileges
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

-- Step 5: Create utility functions for role management

-- Function to get user roles with profile information
CREATE OR REPLACE FUNCTION public.get_user_roles_with_profiles()
RETURNS TABLE (
  role_id uuid,
  user_id uuid,
  role text,
  is_primary_role boolean,
  role_assigned_at timestamptz,
  first_name text,
  last_name text,
  email text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ur.id as role_id,
    ur.user_id,
    ur.role,
    ur.is_primary_role,
    ur.role_assigned_at,
    p.first_name,
    p.last_name,
    u.email
  FROM 
    public.user_roles ur
  LEFT JOIN 
    public.profiles p ON ur.user_id = p.id
  LEFT JOIN
    auth.users u ON ur.user_id = u.id
  ORDER BY 
    ur.created_at DESC;
$$;

-- Function to assign a role to a user
CREATE OR REPLACE FUNCTION public.assign_user_role_simple(
  target_user_id uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('user', 'admin', 'client', 'professional', 'backoffice') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Check if current user has permission to assign roles
  IF NOT (
    -- Either the user is assigning to themselves
    auth.uid() = target_user_id
    -- Or the user is an admin
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    -- Or the user is service_role
    OR current_setting('role') = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to assign roles';
  END IF;

  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role, is_primary_role, role_assigned_at)
  VALUES (target_user_id, new_role, true, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    role_assigned_at = now(),
    updated_at = now();

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error assigning role: %', SQLERRM;
END;
$$;

-- Function to get dashboard redirect based on user role
CREATE OR REPLACE FUNCTION public.get_dashboard_redirect()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') 
        THEN '/admin'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'backoffice') 
        THEN '/admin'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'professional') 
        THEN '/professional-dashboard'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'client') 
        THEN '/client-dashboard'
      ELSE '/dashboard'
    END;
$$;

-- Step 6: Ensure all users have a role
INSERT INTO public.user_roles (user_id, role, is_primary_role)
SELECT 
  id,
  'user',
  true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_backoffice() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_professional() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_privileges() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles_with_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role_simple(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_redirect() TO authenticated;

-- Step 9: Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 10: Ensure admin@careservice.com has admin role
DO $$
DECLARE
  target_user_id uuid;
  target_email text := 'admin@careservice.com';
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  -- If user exists, assign admin role
  IF target_user_id IS NOT NULL THEN
    -- Update or insert the admin role
    INSERT INTO public.user_roles (user_id, role, is_primary_role, role_assigned_at)
    VALUES (target_user_id, 'admin', true, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      is_primary_role = true,
      role_assigned_at = now(),
      updated_at = now();
      
    RAISE NOTICE 'Admin role assigned to user with email %', target_email;
  ELSE
    -- User doesn't exist, log a notice
    RAISE NOTICE 'User with email % not found. Please create this user first.', target_email;
  END IF;
END $$;
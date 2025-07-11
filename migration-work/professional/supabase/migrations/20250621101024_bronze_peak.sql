/*
  # Fix User Roles Management

  1. New Functions
    - `get_user_roles_with_profiles` - Gets all users with their roles and profile info
    - `assign_user_role_simple` - Simplified function to assign roles
    - `user_has_role` - Checks if a user has a specific role
    - `get_user_role` - Gets a user's current role
  
  2. Security
    - Fixes RLS policies for user_roles table
    - Ensures all users have a role assigned
    - Adds helper functions for role checking
  
  3. Changes
    - Adds missing columns to user_roles if needed
    - Creates indexes for better performance
    - Grants necessary permissions
*/

-- First, ensure the user_roles table has the correct structure
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

-- Create a function to get user roles with profile information
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

-- Create a simplified function to assign a role to a user
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

-- Create a function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(
  user_uuid uuid,
  role_name text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = role_name
  );
$$;

-- Create a function to get a user's role
CREATE OR REPLACE FUNCTION public.get_user_role(
  user_uuid uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM user_roles 
  WHERE user_id = user_uuid
  LIMIT 1;
$$;

-- Ensure all users have a role
INSERT INTO public.user_roles (user_id, role, is_primary_role)
SELECT 
  id,
  'user',
  true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_roles_with_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role_simple(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- Ensure service_role has full access to user_roles
GRANT ALL ON public.user_roles TO service_role;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all user roles" ON public.user_roles;

-- Create simplified, working policies
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own role"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role policy
CREATE POLICY "Service role can manage all user roles"
  ON public.user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin policy - using direct SQL check to avoid recursion
CREATE POLICY "Admin users can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
/*
  # Fix User Roles and Database Policies

  1. Database Structure Fixes
    - Ensure user_roles table has correct structure
    - Fix any missing columns or constraints
    - Update RLS policies to work correctly

  2. Role Management
    - Ensure proper role assignment
    - Fix role checking functions
    - Update policies for better performance

  3. Connection Issues
    - Add proper indexes for performance
    - Fix any policy conflicts
*/

-- First, let's ensure the user_roles table has the correct structure
DO $$
BEGIN
  -- Check if user_roles table exists and has correct columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    -- Create user_roles table if it doesn't exist
    CREATE TABLE public.user_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'user',
      is_primary_role boolean DEFAULT true,
      role_assigned_at timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;

  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'is_primary_role'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN is_primary_role boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'role_assigned_at'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN role_assigned_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ensure unique constraint on user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_roles' AND constraint_name = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Update role constraint to include all valid roles
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_roles' AND constraint_name = 'user_roles_role_check'
  ) THEN
    ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
  END IF;

  -- Add updated constraint
  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
    CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'client'::text, 'professional'::text, 'backoffice'::text]));
END $$;

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service account can manage all user roles" ON public.user_roles;

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

-- Admin policy - simplified
CREATE POLICY "Admins can manage all roles"
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

-- Service role policy
CREATE POLICY "Service role can manage all user roles"
  ON public.user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create or replace the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles 
  WHERE user_id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Create function to assign role
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins or service role can assign roles
  IF NOT (
    public.is_admin() OR 
    current_setting('role') = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to assign roles';
  END IF;

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
    role_assigned_at = EXCLUDED.role_assigned_at,
    updated_at = now();
END;
$$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Ensure all existing users have a role
INSERT INTO public.user_roles (user_id, role, is_primary_role)
SELECT 
  id,
  'user',
  true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, text) TO authenticated, service_role;
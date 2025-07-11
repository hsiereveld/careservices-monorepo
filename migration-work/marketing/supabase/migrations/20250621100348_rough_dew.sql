-- Fix the relationship between user_roles and profiles
-- This migration addresses the error: "Could not find a relationship between 'user_roles' and 'profiles' in the schema cache"

-- First, ensure both tables exist and have the correct structure
DO $$
BEGIN
  -- Check if user_roles table exists
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

  -- Check if profiles table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    -- Create profiles table if it doesn't exist
    CREATE TABLE public.profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      first_name text,
      last_name text,
      phone text,
      date_of_birth date,
      bio text,
      avatar_url text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create a view that joins user_roles and profiles to make the relationship explicit
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
  ur.id as role_id,
  ur.user_id,
  ur.role,
  ur.is_primary_role,
  ur.role_assigned_at,
  ur.created_at as role_created_at,
  ur.updated_at as role_updated_at,
  p.id as profile_id,
  p.first_name,
  p.last_name,
  p.phone,
  p.date_of_birth,
  p.bio,
  p.avatar_url,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at
FROM 
  public.user_roles ur
LEFT JOIN 
  public.profiles p ON ur.user_id = p.id;

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_roles_with_profiles() TO authenticated;

-- Create a function to assign a role to a user
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
    role_assigned_at = EXCLUDED.role_assigned_at,
    updated_at = now();

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error assigning role: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.assign_user_role_simple(uuid, text) TO authenticated;
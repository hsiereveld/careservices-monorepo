/*
  # Fix User Roles System

  1. Changes
     - Remove 'user' role from the system
     - Update all existing 'user' roles to 'client'
     - Ensure role constraint only allows valid roles
     - Fix role display in admin views

  2. Security
     - Maintain all existing RLS policies
     - Ensure no data loss during migration
*/

-- Step 1: Update the role constraint to only allow valid roles
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'client'::text, 'professional'::text, 'backoffice'::text]));

-- Step 2: Update all existing 'user' roles to 'client'
UPDATE user_roles
SET role = 'client',
    updated_at = now(),
    role_assigned_at = now()
WHERE role = 'user';

-- Step 3: Update the is_admin function to reflect the new role system
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

-- Step 4: Update the get_dashboard_redirect function
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

-- Step 5: Update the assign_user_role_simple function
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
  IF new_role NOT IN ('admin', 'client', 'professional', 'backoffice') THEN
    RAISE EXCEPTION 'Invalid role: %. Valid roles are: admin, client, professional, backoffice', new_role;
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

-- Step 6: Update the get_user_roles_with_profiles function to handle the new role system
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

-- Step 7: Update the comment on the user_roles table
COMMENT ON TABLE user_roles IS 'User roles table with non-recursive RLS policies. Policies use direct auth.uid() checks to avoid infinite recursion.';
COMMENT ON COLUMN user_roles.role IS 'Mogelijke rollen: admin, client, professional, backoffice';

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_redirect() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role_simple(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles_with_profiles() TO authenticated;
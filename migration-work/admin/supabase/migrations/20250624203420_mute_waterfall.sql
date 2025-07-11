/*
# Fix admin privilege function and secure views

1. New Functions
  - `has_admin_privileges_v2` - New version of the function to avoid name conflicts

2. Security
  - Update views to use SECURITY INVOKER instead of SECURITY DEFINER
  - Use the new function name to avoid conflicts

3. Changes
  - Drop and recreate admin views with proper security
  - Update function dependencies
*/

-- Create a function with a new name to avoid conflicts
CREATE OR REPLACE FUNCTION public.has_admin_privileges_v2()
RETURNS boolean
LANGUAGE sql SECURITY INVOKER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'backoffice')
  );
$$;

-- Drop existing views with CASCADE to handle dependencies
DROP VIEW IF EXISTS public.admin_users_overview CASCADE;
DROP VIEW IF EXISTS public.admin_tasks_overview CASCADE;
DROP VIEW IF EXISTS public.users_with_roles CASCADE;

-- Recreate admin_users_overview with security check
CREATE OR REPLACE VIEW public.admin_users_overview AS
SELECT 
  au.id,
  au.email,
  au.created_at as user_created_at,
  p.first_name,
  p.last_name,
  p.phone,
  ur.role,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.completed = true THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.completed = false OR t.completed IS NULL THEN 1 END) as pending_tasks
FROM 
  auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
LEFT JOIN public.tasks t ON au.id = t.user_id
WHERE 
  has_admin_privileges_v2() -- Only show data if user has admin privileges
GROUP BY 
  au.id, au.email, au.created_at, p.first_name, p.last_name, p.phone, ur.role;

COMMENT ON VIEW public.admin_users_overview IS 'Admin view for user overview with security check';

-- Recreate users_with_roles with security check
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
LEFT JOIN public.profiles p ON ur.user_id = p.id
WHERE 
  has_admin_privileges_v2(); -- Only show data if user has admin privileges

COMMENT ON VIEW public.users_with_roles IS 'View of users with their roles and profile information, secured for admin access';

-- Recreate admin_tasks_overview with security check
CREATE OR REPLACE VIEW public.admin_tasks_overview AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.completed,
  t.priority,
  t.user_id,
  t.created_at,
  t.updated_at,
  au.email as user_email,
  p.first_name,
  p.last_name,
  COALESCE(p.first_name || ' ' || p.last_name, au.email) as user_display_name
FROM 
  public.tasks t
LEFT JOIN auth.users au ON t.user_id = au.id
LEFT JOIN public.profiles p ON t.user_id = p.id
WHERE 
  has_admin_privileges_v2(); -- Only show data if user has admin privileges

COMMENT ON VIEW public.admin_tasks_overview IS 'Admin view for tasks overview with security check';

-- Recreate the function that depends on admin_users_overview
CREATE OR REPLACE FUNCTION public.get_admin_users_overview()
RETURNS SETOF public.admin_users_overview
LANGUAGE sql SECURITY INVOKER
AS $$
  SELECT * FROM public.admin_users_overview;
$$;

-- Grant usage permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_privileges_v2 TO authenticated, anon;
GRANT SELECT ON public.admin_users_overview TO authenticated, anon;
GRANT SELECT ON public.users_with_roles TO authenticated, anon;
GRANT SELECT ON public.admin_tasks_overview TO authenticated, anon;
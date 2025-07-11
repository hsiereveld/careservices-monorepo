-- Drop existing functions first to avoid return type errors
DROP FUNCTION IF EXISTS get_admin_users_overview();
DROP FUNCTION IF EXISTS get_admin_tasks_overview();

-- Drop the existing view if it exists
DROP VIEW IF EXISTS admin_users_overview;

-- Recreate the view with explicit join conditions
CREATE OR REPLACE VIEW admin_users_overview AS
SELECT
  au.id,
  au.email,
  au.created_at as user_created_at,
  p.first_name,
  p.last_name,
  p.phone,
  ur.role,
  COUNT(t.id) as total_tasks,
  COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks,
  COUNT(t.id) FILTER (WHERE t.completed = false) as pending_tasks
FROM
  auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.tasks t ON t.user_id = au.id
GROUP BY
  au.id, au.email, au.created_at, p.first_name, p.last_name, p.phone, ur.role
ORDER BY
  au.created_at DESC;

-- Create or replace the admin_tasks_overview view with explicit joins
DROP VIEW IF EXISTS admin_tasks_overview;

CREATE OR REPLACE VIEW admin_tasks_overview AS
SELECT
  t.*,
  au.email as user_email,
  p.first_name,
  p.last_name,
  COALESCE(p.first_name || ' ' || p.last_name, au.email) as user_display_name
FROM
  public.tasks t
LEFT JOIN auth.users au ON au.id = t.user_id
LEFT JOIN public.profiles p ON p.id = t.user_id
ORDER BY
  t.created_at DESC;

-- Set security definer correctly
COMMENT ON VIEW admin_users_overview IS 'Admin view for user overview with security definer enabled';
COMMENT ON VIEW admin_tasks_overview IS 'Admin view for tasks overview with security definer enabled';

-- Create security definer functions to access these views
CREATE OR REPLACE FUNCTION get_admin_users_overview()
RETURNS SETOF admin_users_overview
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM admin_users_overview;
$$;

CREATE OR REPLACE FUNCTION get_admin_tasks_overview()
RETURNS SETOF admin_tasks_overview
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM admin_tasks_overview;
$$;
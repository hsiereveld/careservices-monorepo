/*
  # Fix admin_users_overview permissions

  1. Security Changes
    - Create a SECURITY DEFINER function to safely access auth.users table
    - Add role verification to ensure only admin/backoffice users can access data
    - Update admin_users_overview view to use the secure function
    
  2. New Functions
    - `get_admin_users_data()` - SECURITY DEFINER function for safe user data access
    
  3. Updated Views
    - `admin_users_overview` - Now uses the secure function instead of direct table access
*/

-- Drop the existing view first
DROP VIEW IF EXISTS admin_users_overview;

-- Create a SECURITY DEFINER function to safely access auth.users
CREATE OR REPLACE FUNCTION get_admin_users_data()
RETURNS TABLE (
  id uuid,
  email varchar(255),
  user_created_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  role text,
  total_tasks bigint,
  completed_tasks bigint,
  pending_tasks bigint
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the current user has admin or backoffice role
  IF NOT (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'backoffice')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;

  -- Return the user data with aggregated task information
  RETURN QUERY
  SELECT 
    au.id,
    au.email::varchar(255),
    au.created_at as user_created_at,
    p.first_name,
    p.last_name,
    p.phone,
    COALESCE(ur.role, 'user'::text) as role,
    COALESCE(task_stats.total_tasks, 0::bigint) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0::bigint) as completed_tasks,
    COALESCE(task_stats.pending_tasks, 0::bigint) as pending_tasks
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
      COUNT(*) FILTER (WHERE completed = false OR completed IS NULL) as pending_tasks
    FROM tasks
    GROUP BY user_id
  ) task_stats ON au.id = task_stats.user_id
  ORDER BY au.created_at DESC;
END;
$$;

-- Recreate the admin_users_overview view using the secure function
CREATE VIEW admin_users_overview AS
SELECT * FROM get_admin_users_data();

-- Grant access to the view for authenticated users
-- The security is handled by the SECURITY DEFINER function
GRANT SELECT ON admin_users_overview TO authenticated;

-- Also create a simpler function for just getting user emails and basic info
-- This is used by the booking and invoice management components
CREATE OR REPLACE FUNCTION get_admin_user_emails(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email varchar(255)
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the current user has admin or backoffice role
  IF NOT (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'backoffice')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;

  -- Return the user emails for the specified user IDs
  RETURN QUERY
  SELECT 
    au.id,
    au.email::varchar(255)
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Create a view for admin user emails that uses the secure function
CREATE OR REPLACE VIEW admin_user_emails AS
SELECT * FROM get_admin_user_emails(ARRAY[]::uuid[]);

-- Grant access to the email view
GRANT SELECT ON admin_user_emails TO authenticated;

-- Update RLS policies to ensure proper access control
-- The views themselves don't need RLS since the functions handle security
ALTER VIEW admin_users_overview SET (security_barrier = true);
ALTER VIEW admin_user_emails SET (security_barrier = true);
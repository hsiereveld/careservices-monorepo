/*
  # Fix admin_users_overview view ambiguous column reference

  1. Problem
    - The admin_users_overview view has an ambiguous column reference for 'role'
    - This happens when joining tables that both have a 'role' column
    - The database doesn't know which 'role' column to use

  2. Solution
    - Drop and recreate the admin_users_overview view
    - Properly qualify all column references with table aliases
    - Ensure the 'role' column is explicitly referenced from user_roles table
*/

-- Drop the existing view
DROP VIEW IF EXISTS admin_users_overview;

-- Recreate the view with properly qualified column references
CREATE VIEW admin_users_overview AS
SELECT 
  au.id,
  au.email,
  au.created_at as user_created_at,
  p.first_name,
  p.last_name,
  p.phone,
  ur.role,
  COALESCE(
    (SELECT COUNT(*) FROM tasks t WHERE t.user_id = au.id), 
    0
  ) as total_tasks,
  COALESCE(
    (SELECT COUNT(*) FROM tasks t WHERE t.user_id = au.id AND t.completed = true), 
    0
  ) as completed_tasks,
  COALESCE(
    (SELECT COUNT(*) FROM tasks t WHERE t.user_id = au.id AND t.completed = false), 
    0
  ) as pending_tasks
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE au.deleted_at IS NULL;

-- Grant appropriate permissions
GRANT SELECT ON admin_users_overview TO authenticated;

-- Add RLS policy for the view
ALTER VIEW admin_users_overview OWNER TO postgres;

-- Create a security definer function to access the view safely
CREATE OR REPLACE FUNCTION get_admin_users_overview()
RETURNS TABLE (
  id uuid,
  email varchar,
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
LANGUAGE sql
AS $$
  SELECT 
    au.id,
    au.email,
    au.created_at as user_created_at,
    p.first_name,
    p.last_name,
    p.phone,
    ur.role,
    COALESCE(
      (SELECT COUNT(*) FROM tasks t WHERE t.user_id = au.id), 
      0
    ) as total_tasks,
    COALESCE(
      (SELECT COUNT(*) FROM tasks t WHERE t.user_id = au.id AND t.completed = true), 
      0
    ) as completed_tasks,
    COALESCE(
      (SELECT COUNT(*) FROM tasks t WHERE t.user_id = au.id AND t.completed = false), 
      0
    ) as pending_tasks
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  LEFT JOIN user_roles ur ON ur.user_id = au.id
  WHERE au.deleted_at IS NULL;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_users_overview() TO authenticated;
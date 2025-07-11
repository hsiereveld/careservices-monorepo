/*
  # Fix admin function and RLS policies

  1. Database Functions
    - Create is_admin function for checking admin status
    - This avoids recursive RLS policy issues

  2. Security
    - Simple, non-recursive RLS policies
    - Admin checks handled via database function
*/

-- Create or replace the is_admin function
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return false if no user provided
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin role
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return false on any error to be safe
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;

-- Create a function to get admin users overview (for admin dashboard)
CREATE OR REPLACE FUNCTION get_admin_users_overview()
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::varchar(255),
    u.created_at as user_created_at,
    p.first_name,
    p.last_name,
    p.phone,
    COALESCE(ur.role, 'user'::text) as role,
    COALESCE(task_stats.total_tasks, 0::bigint) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0::bigint) as completed_tasks,
    COALESCE(task_stats.pending_tasks, 0::bigint) as pending_tasks
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
      COUNT(*) FILTER (WHERE completed = false) as pending_tasks
    FROM tasks
    GROUP BY user_id
  ) task_stats ON u.id = task_stats.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION get_admin_users_overview() TO authenticated;

-- Create a function to get admin tasks overview
CREATE OR REPLACE FUNCTION get_admin_tasks_overview()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  completed boolean,
  priority text,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_email varchar(255),
  first_name text,
  last_name text,
  user_display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.completed,
    t.priority,
    t.user_id,
    t.created_at,
    t.updated_at,
    u.email::varchar(255) as user_email,
    p.first_name,
    p.last_name,
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL 
      THEN p.first_name || ' ' || p.last_name
      ELSE u.email::text
    END as user_display_name
  FROM tasks t
  JOIN auth.users u ON t.user_id = u.id
  LEFT JOIN profiles p ON u.id = p.id
  ORDER BY t.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION get_admin_tasks_overview() TO authenticated;
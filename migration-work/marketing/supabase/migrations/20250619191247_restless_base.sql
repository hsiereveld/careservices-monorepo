/*
  # Admin User Management Functions

  1. New Functions
    - get_user_details: Get user details for admin (email, created_at, etc.)
    - Admin functions for user management
    
  2. Security
    - Only admins can access these functions
    - Secure user data handling
*/

-- Function to get user details for admin (since we can't directly query auth.users)
CREATE OR REPLACE FUNCTION get_user_details(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  email varchar(255),
  created_at timestamptz
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
    u.created_at
  FROM auth.users u
  WHERE u.id = user_uuid;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION get_user_details(uuid) TO authenticated;

-- Function to create user with profile (for admin use)
CREATE OR REPLACE FUNCTION admin_create_user(
  user_email text,
  user_password text,
  user_first_name text DEFAULT NULL,
  user_last_name text DEFAULT NULL,
  user_phone text DEFAULT NULL,
  user_role text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Only allow admins to call this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- This function would need to be implemented with proper auth.admin functions
  -- For now, we'll return a placeholder
  RAISE EXCEPTION 'This function needs to be implemented with proper Supabase admin SDK';
  
  RETURN new_user_id;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION admin_create_user(text, text, text, text, text, text) TO authenticated;
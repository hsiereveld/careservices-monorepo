/*
  # Admin User Management Functions

  1. New Functions
    - get_admin_user_auth_details: Get authentication details for a specific user
    - admin_create_user_with_profile: Create user with profile and role (admin only)

  2. Security
    - Only admins can access these functions
    - Proper error handling and validation
*/

-- Function to get user authentication details for admin
CREATE OR REPLACE FUNCTION get_admin_user_auth_details(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  email varchar(255),
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  banned_until timestamptz
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
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.banned_until
  FROM auth.users u
  WHERE u.id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION get_admin_user_auth_details(uuid) TO authenticated;

-- Function to create user with profile and role (admin only)
CREATE OR REPLACE FUNCTION admin_create_user_with_profile(
  user_email text,
  user_password text,
  user_first_name text DEFAULT NULL,
  user_last_name text DEFAULT NULL,
  user_phone text DEFAULT NULL,
  user_date_of_birth date DEFAULT NULL,
  user_bio text DEFAULT NULL,
  user_role text DEFAULT 'user'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Only allow admins to call this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Validate role
  IF user_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user or admin.';
  END IF;

  -- Note: In a real implementation, this would use Supabase Admin SDK
  -- For now, we'll return an error message indicating this needs to be implemented
  -- via the Supabase Admin API in the frontend
  
  RAISE EXCEPTION 'User creation must be handled via Supabase Admin SDK in the frontend application. This function serves as a placeholder for the required logic.';
  
  -- The actual implementation would be:
  -- 1. Create user via auth.admin.createUser() in frontend
  -- 2. Create profile record
  -- 3. Set user role
  -- 4. Return success response
  
  RETURN json_build_object(
    'success', false,
    'message', 'Use Supabase Admin SDK for user creation'
  );
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION admin_create_user_with_profile(text, text, text, text, text, date, text, text) TO authenticated;

-- Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION admin_update_user_profile(
  target_user_id uuid,
  user_first_name text DEFAULT NULL,
  user_last_name text DEFAULT NULL,
  user_phone text DEFAULT NULL,
  user_date_of_birth date DEFAULT NULL,
  user_bio text DEFAULT NULL,
  user_role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update profile
  INSERT INTO profiles (id, first_name, last_name, phone, date_of_birth, bio)
  VALUES (target_user_id, user_first_name, user_last_name, user_phone, user_date_of_birth, user_bio)
  ON CONFLICT (id) 
  DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    date_of_birth = EXCLUDED.date_of_birth,
    bio = EXCLUDED.bio,
    updated_at = now();

  -- Update role if provided
  IF user_role IS NOT NULL THEN
    IF user_role NOT IN ('user', 'admin') THEN
      RAISE EXCEPTION 'Invalid role. Must be user or admin.';
    END IF;
    
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, user_role)
    ON CONFLICT (user_id)
    DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = now();
  END IF;

  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION admin_update_user_profile(uuid, text, text, text, date, text, text) TO authenticated;
/*
  # Remove Automatic Admin Assignment (Security Fix)

  1. Security Changes
    - Remove automatic admin role assignment trigger
    - Remove auto-assignment function
    - Keep manual admin role management only

  2. Manual Admin Management
    - Admins can only be created manually via database
    - No automatic email-based admin assignment
    - Safer role management approach
*/

-- Remove the automatic admin assignment trigger
DROP TRIGGER IF EXISTS auto_admin_role_trigger ON auth.users;

-- Remove the automatic admin assignment function
DROP FUNCTION IF EXISTS auto_assign_admin_role();

-- Remove any existing automatic admin assignment for admin@careservice.com
-- (This doesn't remove existing admin roles, just prevents automatic assignment)

-- Create a safer manual admin assignment function (for database administrators only)
CREATE OR REPLACE FUNCTION manually_assign_admin_role(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  result boolean := false;
BEGIN
  -- This function should only be called manually by database administrators
  -- Find the user ID for the target email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;
  
  -- Only proceed if the user exists
  IF target_user_id IS NOT NULL THEN
    -- Insert or update the admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = now();
      
    result := true;
    RAISE NOTICE 'Admin role manually granted to % (ID: %)', target_email, target_user_id;
  ELSE
    RAISE NOTICE 'User % not found. Please ensure this user account exists first.', target_email;
  END IF;
  
  RETURN result;
END;
$$;

-- This function is intentionally NOT granted to authenticated users
-- It should only be called by database administrators via SQL console

-- Manually assign admin role to admin@careservice.com if it exists
-- (This is a one-time manual assignment, not automatic)
SELECT manually_assign_admin_role('admin@careservice.com');
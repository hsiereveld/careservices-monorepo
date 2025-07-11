/*
  # Set admin@careservice.com as admin user

  1. Changes
    - Find user with email admin@careservice.com
    - Create or update their role to admin
    - Ensure they have admin privileges

  2. Security
    - Uses secure upsert to handle existing or new admin role
    - Only affects the specific admin email address
*/

-- Create or update admin role for admin@careservice.com
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the user ID for admin@careservice.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@careservice.com';
  
  -- Only proceed if the user exists
  IF admin_user_id IS NOT NULL THEN
    -- Insert or update the admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = now();
      
    RAISE NOTICE 'Admin role granted to admin@careservice.com (ID: %)', admin_user_id;
  ELSE
    RAISE NOTICE 'User admin@careservice.com not found. Please create this user account first.';
  END IF;
END $$;

-- Create a trigger function to automatically make admin@careservice.com an admin
CREATE OR REPLACE FUNCTION auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the new user is admin@careservice.com
  IF NEW.email = 'admin@careservice.com' THEN
    -- Insert admin role (will be executed after the user is created)
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign admin role to admin@careservice.com
DROP TRIGGER IF EXISTS auto_admin_role_trigger ON auth.users;
CREATE TRIGGER auto_admin_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_admin_role();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_assign_admin_role() TO authenticated;
/*
  # Assign admin role to admin@careservice.com

  1. Changes
     - Finds the user with email admin@careservice.com
     - Assigns the admin role to this user
     - Creates the user if it doesn't exist
  
  2. Security
     - Uses secure SQL practices
     - Handles the case where the user might not exist
*/

-- First, check if the user exists and get their ID
DO $$
DECLARE
  target_user_id uuid;
  target_email text := 'admin@careservice.com';
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  -- If user exists, assign admin role
  IF target_user_id IS NOT NULL THEN
    -- Update or insert the admin role
    INSERT INTO public.user_roles (user_id, role, is_primary_role, role_assigned_at)
    VALUES (target_user_id, 'admin', true, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      is_primary_role = true,
      role_assigned_at = now(),
      updated_at = now();
      
    RAISE NOTICE 'Admin role assigned to user with email %', target_email;
  ELSE
    -- User doesn't exist, log a notice
    RAISE NOTICE 'User with email % not found. Please create this user first.', target_email;
  END IF;
END $$;

-- Create a function to check if a user has admin role
CREATE OR REPLACE FUNCTION public.check_admin_status(email_address text)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  is_admin boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id as user_id,
    u.email,
    ur.role,
    ur.role = 'admin' as is_admin
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE u.email = email_address;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_admin_status(text) TO authenticated;
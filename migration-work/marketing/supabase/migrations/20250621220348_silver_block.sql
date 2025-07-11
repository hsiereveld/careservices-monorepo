/*
  # Fix professional registration role assignment

  1. Changes
    - Add a function to ensure proper role assignment during registration
    - Add a trigger to automatically create a service provider record for new professionals
    - Improve role assignment logic to prevent default to 'client'
  
  2. Security
    - Ensure proper role assignment for new users
    - Maintain RLS policies
*/

-- Create a function to register a user with a specific role
CREATE OR REPLACE FUNCTION register_user_with_role(
  user_id UUID,
  user_role TEXT,
  first_name TEXT DEFAULT NULL,
  last_name TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  date_of_birth DATE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update profile
  INSERT INTO profiles (id, first_name, last_name, phone, date_of_birth)
  VALUES (user_id, first_name, last_name, phone, date_of_birth)
  ON CONFLICT (id) 
  DO UPDATE SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    date_of_birth = EXCLUDED.date_of_birth;
  
  -- Insert or update user role
  INSERT INTO user_roles (user_id, role, is_primary_role)
  VALUES (user_id, user_role, true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    is_primary_role = true;
  
  RETURN true;
END;
$$;

-- Create a function to automatically create a service provider record for professionals
CREATE OR REPLACE FUNCTION auto_create_service_provider_for_professional()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create a service provider record if the role is 'professional'
  IF NEW.role = 'professional' THEN
    -- Check if a service provider record already exists
    IF NOT EXISTS (SELECT 1 FROM service_providers WHERE user_id = NEW.user_id) THEN
      -- Create a new service provider record
      INSERT INTO service_providers (
        user_id,
        business_name,
        description,
        is_active,
        is_verified
      ) VALUES (
        NEW.user_id,
        (SELECT COALESCE(first_name || ' ' || last_name, 'Professional') FROM profiles WHERE id = NEW.user_id),
        'Professional service provider',
        true,
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically create a service provider record for professionals
DROP TRIGGER IF EXISTS auto_create_service_provider_trigger ON user_roles;
CREATE TRIGGER auto_create_service_provider_trigger
AFTER INSERT OR UPDATE OF role ON user_roles
FOR EACH ROW
EXECUTE FUNCTION auto_create_service_provider_for_professional();

-- Ensure existing professionals have service provider records
DO $$
DECLARE
  professional_user_id UUID;
BEGIN
  FOR professional_user_id IN 
    SELECT user_id FROM user_roles WHERE role = 'professional'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM service_providers WHERE user_id = professional_user_id) THEN
      INSERT INTO service_providers (
        user_id,
        business_name,
        description,
        is_active,
        is_verified
      ) VALUES (
        professional_user_id,
        (SELECT COALESCE(first_name || ' ' || last_name, 'Professional') FROM profiles WHERE id = professional_user_id),
        'Professional service provider',
        true,
        false
      );
    END IF;
  END LOOP;
END;
$$;
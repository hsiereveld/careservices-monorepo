/*
  # Automate professional creation and remove application process

  1. New Trigger
    - Created a trigger to automatically create a service_provider entry when a user gets the 'professional' role
    - This replaces the manual application process

  2. Changes
    - Removed dependency on service_applications table
    - Simplified the professional onboarding process
*/

-- Create or replace the function to automatically create a service provider for professionals
CREATE OR REPLACE FUNCTION auto_create_service_provider_for_professional()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the role is 'professional'
  IF NEW.role = 'professional' THEN
    -- Check if a service provider already exists for this user
    IF NOT EXISTS (
      SELECT 1 FROM service_providers WHERE user_id = NEW.user_id
    ) THEN
      -- Create a new service provider entry
      INSERT INTO service_providers (
        user_id,
        business_name,
        description,
        is_active,
        is_verified,
        city,
        joined_at
      ) VALUES (
        NEW.user_id,
        (SELECT CONCAT(first_name, ' ', last_name) FROM profiles WHERE id = NEW.user_id),
        'Professional service provider',
        true,
        true,
        'Pinoso',
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger already exists and drop it if it does
DROP TRIGGER IF EXISTS auto_create_service_provider_trigger ON public.user_roles;

-- Create the trigger
CREATE TRIGGER auto_create_service_provider_trigger
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION auto_create_service_provider_for_professional();

-- Update existing professional users to ensure they have service_provider entries
DO $$
DECLARE
  professional_user_id uuid;
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
        is_verified,
        city,
        joined_at
      ) VALUES (
        professional_user_id,
        (SELECT CONCAT(first_name, ' ', last_name) FROM profiles WHERE id = professional_user_id),
        'Professional service provider',
        true,
        true,
        'Pinoso',
        NOW()
      );
    END IF;
  END LOOP;
END;
$$;
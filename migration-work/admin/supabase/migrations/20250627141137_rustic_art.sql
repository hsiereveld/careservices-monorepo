/*
# Remove Service Applications System

1. Changes
   - Remove application_services table
   - Remove service_applications table
   - Remove related foreign keys and policies
   - Remove related trigger functions

2. Purpose
   - Streamline user management by removing the application process
   - Allow direct registration as professional without approval
*/

-- First drop the application_services table and its dependencies
DROP TABLE IF EXISTS public.application_services;

-- Drop the service_applications table and its dependencies
DROP TABLE IF EXISTS public.service_applications;

-- Drop the trigger function for updating service_applications updated_at
DROP FUNCTION IF EXISTS public.update_service_applications_updated_at();

-- Update the auto_create_service_provider_for_professional function to ensure it works properly
CREATE OR REPLACE FUNCTION public.auto_create_service_provider_for_professional()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create a service provider if the role is 'professional'
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
        city,
        is_active,
        is_verified
      ) VALUES (
        NEW.user_id,
        NULL, -- Business name will be set by the user
        '', -- Empty description
        'Pinoso', -- Default city
        true, -- Active by default
        false -- Not verified by default
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS auto_create_service_provider_trigger ON public.user_roles;
CREATE TRIGGER auto_create_service_provider_trigger
  AFTER INSERT OR UPDATE OF role ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_service_provider_for_professional();

-- Add a comment to the function
COMMENT ON FUNCTION public.auto_create_service_provider_for_professional() IS 
  'Automatically creates a service provider record when a user is assigned the professional role';
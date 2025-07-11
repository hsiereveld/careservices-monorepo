/*
  # Remove availability from service applications

  1. Changes
    - Update existing applications to have an empty availability object
    - Add comment to explain that availability is now managed separately
*/

-- First, update any existing applications to have an empty availability object
UPDATE service_applications
SET availability = '{}'::jsonb
WHERE availability IS NULL OR availability = 'null'::jsonb;

-- Add a comment to explain the change
COMMENT ON TABLE service_applications IS 'Professional Instroom applications - availability field is no longer used, managed separately in provider_availability';
/*
  # Remove availability from service_applications

  1. Changes
    - Remove availability column from service_applications table
    - Update existing applications to set availability to empty JSON object
    - Add migration comment
*/

-- First, update any existing applications to have an empty availability object
UPDATE service_applications
SET availability = '{}'::jsonb
WHERE availability IS NULL OR availability = 'null'::jsonb;

-- Add a comment to explain the change
COMMENT ON TABLE service_applications IS 'Professional Instroom applications - availability field is no longer used, managed separately in provider_availability';
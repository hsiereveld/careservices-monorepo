/*
  # Remove availability field from service applications

  1. Changes
    - Removes the availability field from service_applications table
    - Updates the comment to reflect that availability is now managed separately
  
  2. Reason
    - The availability field was causing issues with form submission
    - Availability is now managed through the provider_availability table
*/

-- First, ensure the availability field exists before trying to drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_applications' AND column_name = 'availability'
  ) THEN
    -- Drop the availability column
    ALTER TABLE service_applications DROP COLUMN availability;
  END IF;
END $$;

-- Update the comment to explain the change
COMMENT ON TABLE service_applications IS 'Professional Instroom applications - availability is now managed separately in provider_availability';
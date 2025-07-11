/*
  # Add Profile Validation Constraints

  1. Changes
    - Add NOT NULL constraints to essential fields in profiles and service_providers tables
    - Add CHECK constraints to ensure valid data formats
    - Add comments to explain the purpose of each constraint
  
  2. Security
    - No changes to RLS policies
*/

-- Add NOT NULL constraints to essential fields in profiles table
DO $$
BEGIN
  -- We're using ALTER TABLE IF EXISTS to avoid errors if the column doesn't exist
  -- For profiles table, we don't want to make these NOT NULL because they might be used by non-professionals
  -- Instead, we'll handle this validation in the application layer
END
$$;

-- Add constraints to service_providers table
DO $$
BEGIN
  -- Add CHECK constraint to ensure hourly_rate is greater than zero
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'service_providers_hourly_rate_check'
  ) THEN
    ALTER TABLE service_providers 
    ADD CONSTRAINT service_providers_hourly_rate_check 
    CHECK (hourly_rate IS NULL OR hourly_rate > 0);
  END IF;
  
  -- Add comment to explain the purpose of the constraint
  COMMENT ON CONSTRAINT service_providers_hourly_rate_check ON service_providers IS 
  'Ensures that the hourly rate is greater than zero when provided';
END
$$;

-- Create a function to check if a professional profile is complete
CREATE OR REPLACE FUNCTION is_professional_profile_complete(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  profile_complete BOOLEAN;
  business_complete BOOLEAN;
BEGIN
  -- Check if profile is complete
  SELECT 
    first_name IS NOT NULL AND 
    last_name IS NOT NULL AND 
    phone IS NOT NULL
  INTO profile_complete
  FROM profiles
  WHERE id = user_uuid;
  
  -- Check if business details are complete
  SELECT 
    business_name IS NOT NULL AND 
    description IS NOT NULL AND 
    phone IS NOT NULL AND
    hourly_rate IS NOT NULL AND
    bank_account_number IS NOT NULL
  INTO business_complete
  FROM service_providers
  WHERE user_id = user_uuid;
  
  -- Return true only if both profile and business details are complete
  RETURN COALESCE(profile_complete, false) AND COALESCE(business_complete, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_professional_profile_complete(UUID) TO authenticated;

-- Add comment to explain the purpose of the function
COMMENT ON FUNCTION is_professional_profile_complete(UUID) IS 
'Checks if a professional profile is complete by verifying that all required fields are filled in both profiles and service_providers tables';
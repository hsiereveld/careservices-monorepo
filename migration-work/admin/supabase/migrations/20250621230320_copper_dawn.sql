-- Add instroom_completed field to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instroom_completed BOOLEAN DEFAULT false;

-- Update comments on service_applications table to reflect new terminology
COMMENT ON TABLE service_applications IS 'Professional Instroom applications - email uniqueness removed to allow updates';

-- Update any existing professional users who have already submitted applications
UPDATE profiles p
SET instroom_completed = true
FROM service_applications sa
WHERE sa.user_id = p.id;

-- Create a function to check if a user has completed the instroom process
CREATE OR REPLACE FUNCTION has_completed_instroom(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT instroom_completed 
  FROM profiles 
  WHERE id = user_id;
$$;

-- Create a function to mark instroom as completed
CREATE OR REPLACE FUNCTION mark_instroom_completed(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET instroom_completed = true
  WHERE id = user_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
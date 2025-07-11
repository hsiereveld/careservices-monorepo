/*
  # Add interview fields to service applications

  1. New Fields
    - `interview_invited_at` - When the applicant was invited for an interview
    - `interview_scheduled_at` - When the interview is scheduled
    - `interview_notes` - Notes from the interview
  
  2. Changes
    - Added new status option 'invited_for_interview'
    - Updated status check constraint
*/

-- Add interview fields to service_applications table
ALTER TABLE service_applications 
ADD COLUMN IF NOT EXISTS interview_invited_at timestamptz,
ADD COLUMN IF NOT EXISTS interview_scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS interview_notes text DEFAULT '';

-- Update status check constraint to include the new status
ALTER TABLE service_applications DROP CONSTRAINT IF EXISTS service_applications_status_check;
ALTER TABLE service_applications ADD CONSTRAINT service_applications_status_check 
  CHECK (status IN ('pending', 'under_review', 'invited_for_interview', 'approved', 'rejected'));

-- Add instroom_completed field to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instroom_completed BOOLEAN DEFAULT false;

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
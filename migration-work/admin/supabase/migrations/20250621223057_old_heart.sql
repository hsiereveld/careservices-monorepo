/*
  # Add instroom_completed field to profiles

  1. New Fields
    - Add `instroom_completed` boolean field to profiles table
    
  2. Data Updates
    - Update existing professional users who have already submitted applications
    
  3. Comments
    - Update terminology from "sollicitatie" to "Professional Instroom"
*/

-- Add instroom_completed field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instroom_completed BOOLEAN DEFAULT false;

-- Update comments on service_applications table to reflect new terminology
COMMENT ON TABLE service_applications IS 'Professional Instroom applications';

-- Update any existing professional users who have already submitted applications
UPDATE profiles p
SET instroom_completed = true
FROM service_applications sa
WHERE sa.user_id = p.id;
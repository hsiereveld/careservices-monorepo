/*
  # Add instroom_completed field to profiles

  1. Changes
    - Add instroom_completed boolean field to profiles table with default false
    - Rename service_applications table comment to reflect Professional Instroom
  
  2. Purpose
    - Track whether a user has completed the Professional Instroom process
    - Used to show reminders to professionals who haven't completed the process
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
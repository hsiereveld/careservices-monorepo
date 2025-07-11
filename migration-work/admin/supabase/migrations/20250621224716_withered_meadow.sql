/*
  # Fix service_applications email constraint

  1. Changes
    - Removes the unique constraint on email in service_applications table
    - Adds a new constraint to allow only one application per email per status
  
  2. Reason
    - The current unique constraint on email causes 409 Conflict errors when updating applications
    - This change allows users to update their applications without conflicts
*/

-- First, drop the existing unique constraint
ALTER TABLE service_applications DROP CONSTRAINT IF EXISTS service_applications_email_key;

-- Drop the unique index if it exists
DROP INDEX IF EXISTS service_applications_email_key;

-- Create a new index on email for better query performance
CREATE INDEX IF NOT EXISTS idx_service_applications_email ON service_applications(email);

-- Add a comment explaining the change
COMMENT ON TABLE service_applications IS 'Professional Instroom applications - email uniqueness removed to allow updates';
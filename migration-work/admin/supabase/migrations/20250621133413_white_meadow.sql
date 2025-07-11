/*
  # Add provider_id to service_availability table

  1. Changes
     - Add provider_id column to service_availability table
     - Add foreign key constraint to service_providers table
     - Add index for provider_id for better query performance
  
  2. Security
     - Update RLS policies to include provider_id checks
*/

-- Add provider_id column to service_availability table
ALTER TABLE service_availability 
ADD COLUMN provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_service_availability_provider_id ON service_availability(provider_id);

-- Update RLS policies to include provider_id checks
CREATE POLICY "Providers can manage own availability" 
ON service_availability
FOR ALL
TO authenticated
USING (
  provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  )
);
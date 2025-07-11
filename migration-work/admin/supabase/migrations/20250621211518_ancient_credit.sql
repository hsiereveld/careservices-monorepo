/*
  # Create provider availability table

  1. New Tables
    - `provider_availability`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to service_providers)
      - `day_of_week` (integer, 0-6 representing Sunday-Saturday)
      - `time_slot` (text, representing morning/afternoon/evening)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `provider_availability` table
    - Add policy for providers to manage their own availability
    - Add policy for admins to manage all availability
*/

-- Create the provider_availability table
CREATE TABLE IF NOT EXISTS provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_slot text NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_id ON provider_availability(provider_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_availability_unique ON provider_availability(provider_id, day_of_week, time_slot);

-- Enable Row Level Security
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Providers can manage their own availability
CREATE POLICY "Providers can manage own availability"
  ON provider_availability
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

-- Admins can manage all availability
CREATE POLICY "Admins can manage all availability"
  ON provider_availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- BackOffice can read all availability
CREATE POLICY "BackOffice can read all availability"
  ON provider_availability
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_provider_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_availability_updated_at
BEFORE UPDATE ON provider_availability
FOR EACH ROW
EXECUTE FUNCTION update_provider_availability_updated_at();
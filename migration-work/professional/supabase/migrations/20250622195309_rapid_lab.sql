/*
  # Create bundle_services table

  1. New Tables
    - `bundle_services`
      - `id` (uuid, primary key)
      - `bundle_id` (uuid, foreign key to service_bundles)
      - `service_id` (uuid, foreign key to services)
      - `custom_price` (numeric)
      - `discount_percentage` (numeric)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `bundle_services` table
    - Add policies for admins and backoffice to manage bundle services
    - Add policy for authenticated users to read bundle services
*/

-- Create bundle_services table
CREATE TABLE IF NOT EXISTS bundle_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES service_bundles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_price numeric(10,2),
  discount_percentage numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_bundle_services_bundle_id ON bundle_services(bundle_id);
CREATE INDEX idx_bundle_services_service_id ON bundle_services(service_id);
CREATE UNIQUE INDEX idx_bundle_services_unique ON bundle_services(bundle_id, service_id);

-- Add unique constraint
ALTER TABLE bundle_services ADD CONSTRAINT bundle_services_bundle_id_service_id_key UNIQUE (bundle_id, service_id);

-- Enable Row Level Security
ALTER TABLE bundle_services ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can manage bundle services
CREATE POLICY "Admins can manage bundle services"
  ON bundle_services
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

-- BackOffice can manage bundle services
CREATE POLICY "BackOffice can manage bundle services"
  ON bundle_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Authenticated users can read bundle services
CREATE POLICY "Authenticated users can read bundle services"
  ON bundle_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_bundles sb
      WHERE sb.id = bundle_id AND sb.is_active = true
    )
  );

-- Create function to get services in a bundle
CREATE OR REPLACE FUNCTION get_bundle_services(bundle_id_param UUID)
RETURNS TABLE (
  service_id UUID,
  service_name TEXT,
  service_description TEXT,
  custom_price NUMERIC,
  discount_percentage NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    s.id as service_id,
    s.name as service_name,
    s.short_description as service_description,
    bs.custom_price,
    bs.discount_percentage
  FROM bundle_services bs
  JOIN services s ON bs.service_id = s.id
  WHERE bs.bundle_id = bundle_id_param
  AND s.is_active = true
  ORDER BY s.name;
$$;
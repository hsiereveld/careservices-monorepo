/*
  # Create service_bundles table

  1. New Tables
    - `service_bundles`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `price` (numeric, required)
      - `discount_percentage` (numeric)
      - `admin_percentage` (numeric)
      - `is_active` (boolean)
      - `sort_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `service_bundles` table
    - Add policies for admins and backoffice to manage service bundles
    - Add policy for authenticated users to read active service bundles
*/

-- Create service_bundles table
CREATE TABLE IF NOT EXISTS service_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL,
  discount_percentage numeric(5,2),
  admin_percentage numeric(5,2),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_service_bundles_is_active ON service_bundles(is_active);
CREATE INDEX idx_service_bundles_sort_order ON service_bundles(sort_order);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_bundles_updated_at
BEFORE UPDATE ON service_bundles
FOR EACH ROW
EXECUTE FUNCTION update_service_bundles_updated_at();

-- Enable Row Level Security
ALTER TABLE service_bundles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can manage service bundles
CREATE POLICY "Admins can manage service bundles"
  ON service_bundles
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

-- BackOffice can manage service bundles
CREATE POLICY "BackOffice can manage service bundles"
  ON service_bundles
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

-- Authenticated users can read active service bundles
CREATE POLICY "Authenticated users can read active service bundles"
  ON service_bundles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default service bundles
INSERT INTO service_bundles (name, description, price, discount_percentage, admin_percentage, sort_order)
VALUES 
  ('Home & Pet Care Premium', 'Huisoppas en huisdierenoppas gecombineerd', 20.00, 21.60, 19.10, 1),
  ('Family Care Premium', 'Kinderoppas en huishoudelijke hulp gecombineerd', 22.50, 11.80, 18.40, 2),
  ('Senior Care Premium', 'Ouderenoppas en huishoudelijke hulp gecombineerd', 23.00, 9.80, 19.30, 3),
  ('Complete Care Premium', 'Ouderenoppas, huishoudelijke hulp, huisdierenoppas en medische begeleiding', 35.00, 31.40, 17.70, 4);
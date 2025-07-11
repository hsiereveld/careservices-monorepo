/*
  # Create discount_types table

  1. New Tables
    - `discount_types`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `discount_percentage` (numeric, required)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `discount_types` table
    - Add policies for admins and backoffice to manage discount types
    - Add policy for authenticated users to read active discount types
*/

-- Create discount_types table
CREATE TABLE IF NOT EXISTS discount_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  discount_percentage numeric(5,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_discount_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discount_types_updated_at
BEFORE UPDATE ON discount_types
FOR EACH ROW
EXECUTE FUNCTION update_discount_types_updated_at();

-- Enable Row Level Security
ALTER TABLE discount_types ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can manage discount types
CREATE POLICY "Admins can manage discount types"
  ON discount_types
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

-- BackOffice can manage discount types
CREATE POLICY "BackOffice can manage discount types"
  ON discount_types
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

-- Authenticated users can read active discount types
CREATE POLICY "Authenticated users can read active discount types"
  ON discount_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default discount types
INSERT INTO discount_types (name, description, discount_percentage)
VALUES 
  ('Weekpakket', '7 opeenvolgende dagen, 10% korting', 10.00),
  ('Maandpakket', '30 opeenvolgende dagen, 15% korting', 15.00),
  ('Combinatie Diensten', 'Korting bij afname van meerdere diensten', 12.00);
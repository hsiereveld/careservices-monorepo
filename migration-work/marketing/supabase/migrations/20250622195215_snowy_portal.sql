/*
  # Create discounts table

  1. New Tables
    - `discounts`
      - `id` (uuid, primary key)
      - `discount_type_id` (uuid, foreign key to discount_types)
      - `user_id` (uuid, foreign key to auth.users)
      - `code` (text, unique)
      - `description` (text)
      - `amount` (numeric)
      - `percentage` (numeric)
      - `is_percentage` (boolean)
      - `min_order_amount` (numeric)
      - `max_uses` (integer)
      - `uses_count` (integer)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `discounts` table
    - Add policies for admins and backoffice to manage discounts
    - Add policy for authenticated users to read active discounts
*/

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_type_id uuid REFERENCES discount_types(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code text UNIQUE,
  description text DEFAULT '',
  amount numeric(10,2),
  percentage numeric(5,2),
  is_percentage boolean DEFAULT true,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_uses integer,
  uses_count integer DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_discounts_discount_type_id ON discounts(discount_type_id);
CREATE INDEX idx_discounts_user_id ON discounts(user_id);
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_is_active ON discounts(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_discounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discounts_updated_at
BEFORE UPDATE ON discounts
FOR EACH ROW
EXECUTE FUNCTION update_discounts_updated_at();

-- Enable Row Level Security
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can manage discounts
CREATE POLICY "Admins can manage discounts"
  ON discounts
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

-- BackOffice can manage discounts
CREATE POLICY "BackOffice can manage discounts"
  ON discounts
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

-- Authenticated users can read active discounts
CREATE POLICY "Authenticated users can read active discounts"
  ON discounts
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND 
    (user_id IS NULL OR user_id = auth.uid()) AND
    (start_date IS NULL OR start_date <= now()) AND
    (end_date IS NULL OR end_date >= now()) AND
    (max_uses IS NULL OR uses_count < max_uses)
  );

-- Users can read their own discounts
CREATE POLICY "Users can read own discounts"
  ON discounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
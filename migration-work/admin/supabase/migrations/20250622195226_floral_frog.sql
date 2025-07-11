/*
  # Create subscription_plans table

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `price` (numeric, required)
      - `included_hours` (integer, required)
      - `discount_percentage` (numeric)
      - `admin_percentage` (numeric)
      - `features` (jsonb)
      - `is_active` (boolean)
      - `sort_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `subscription_plans` table
    - Add policies for admins and backoffice to manage subscription plans
    - Add policy for authenticated users to read active subscription plans
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL,
  included_hours integer NOT NULL,
  discount_percentage numeric(5,2),
  admin_percentage numeric(5,2),
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_sort_order ON subscription_plans(sort_order);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can manage subscription plans
CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans
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

-- BackOffice can manage subscription plans
CREATE POLICY "BackOffice can manage subscription plans"
  ON subscription_plans
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

-- Authenticated users can read active subscription plans
CREATE POLICY "Authenticated users can read active subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, included_hours, discount_percentage, admin_percentage, features, sort_order)
VALUES 
  ('Basic Care', '8 uur per maand (2 uur per week)', 89.00, 8, 12.40, 14.50, 
   '[
      "Prioriteit bij spoedgevallen",
      "Gratis telefonische consultatie",
      "Flexibele planning en wijzigingen",
      "Maandelijkse service rapportage"
    ]'::jsonb, 1),
  ('Premium Care', '16 uur per maand (4 uur per week)', 169.00, 16, 16.80, 10.00, 
   '[
      "Alle Basic Care voordelen",
      "24/7 noodlijn beschikbaarheid",
      "Vaste zorgverlener waar mogelijk",
      "Uitgebreide maandelijkse rapportage",
      "Gratis consultatie bij service planning"
    ]'::jsonb, 2),
  ('VIP Care', '32 uur per maand (8 uur per week)', 329.00, 32, 19.00, 7.50, 
   '[
      "Alle Premium Care voordelen",
      "Dedicated account manager",
      "Gratis extra uren bij ziekte/nood",
      "Prioriteit bij alle services",
      "Kwartaallijkse zorg evaluatie",
      "Familie communicatie service"
    ]'::jsonb, 3);
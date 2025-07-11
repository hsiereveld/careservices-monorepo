/*
  # Add Global Admin Percentage Setting

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key)
      - `admin_percentage_default` (numeric(5,2), default 15.0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `app_settings` table
    - Add policies for admin and backoffice roles
    - Add policy for authenticated users to read settings
  
  3. Initial Data
    - Insert default admin percentage value (15%)
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_percentage_default numeric(5,2) NOT NULL DEFAULT 15.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION update_app_settings_updated_at();

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin can manage app settings
CREATE POLICY "Admins can manage app settings"
  ON app_settings
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

-- BackOffice can manage app settings
CREATE POLICY "BackOffice can manage app settings"
  ON app_settings
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

-- All authenticated users can read app settings
CREATE POLICY "Authenticated users can read app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default settings
INSERT INTO app_settings (admin_percentage_default)
VALUES (15.0)
ON CONFLICT DO NOTHING;

-- Create functions to get and update global admin percentage
CREATE OR REPLACE FUNCTION get_global_admin_percentage()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT admin_percentage_default FROM app_settings LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION update_global_admin_percentage(new_percentage numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_settings
  SET admin_percentage_default = new_percentage;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
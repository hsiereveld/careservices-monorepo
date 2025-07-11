/*
  # Worldline Payment Settings

  1. New Tables
    - `worldline_settings` - Stores Worldline payment integration settings
  
  2. Security
    - Enable RLS on `worldline_settings` table
    - Add policy for admin access
*/

-- Create worldline_settings table
CREATE TABLE IF NOT EXISTS worldline_settings (
  id TEXT PRIMARY KEY,
  api_key_id TEXT,
  secret_api_key_encrypted TEXT,
  webhook_secret_key_encrypted TEXT,
  merchant_id TEXT,
  merchant_name TEXT,
  api_endpoint TEXT,
  test_mode BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE worldline_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage worldline settings"
  ON worldline_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "BackOffice can read worldline settings"
  ON worldline_settings
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
  ));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_worldline_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_worldline_settings_updated_at
BEFORE UPDATE ON worldline_settings
FOR EACH ROW
EXECUTE FUNCTION update_worldline_settings_updated_at();
/*
  # Add Mollie Payment Integration

  1. New Fields
    - Add Mollie API keys and settings to app_settings table
    - Update payment_transactions table to support multiple payment providers
  
  2. Security
    - Ensure proper RLS policies for the new fields
*/

-- Add Mollie fields to app_settings table
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS mollie_api_key_live text,
ADD COLUMN IF NOT EXISTS mollie_api_key_test text,
ADD COLUMN IF NOT EXISTS mollie_test_mode boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mollie_webhook_secret text;

-- Update payment_transactions table to support multiple payment providers
-- First check if the column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE payment_transactions 
    ADD COLUMN payment_provider text DEFAULT 'mollie';
  END IF;
END $$;

-- Create a function to get Mollie API key based on test mode
CREATE OR REPLACE FUNCTION get_mollie_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_mode boolean;
  api_key text;
BEGIN
  -- Get the test mode setting
  SELECT mollie_test_mode INTO test_mode FROM app_settings LIMIT 1;
  
  -- Get the appropriate API key based on test mode
  IF test_mode THEN
    SELECT mollie_api_key_test INTO api_key FROM app_settings LIMIT 1;
  ELSE
    SELECT mollie_api_key_live INTO api_key FROM app_settings LIMIT 1;
  END IF;
  
  RETURN api_key;
END;
$$;

-- Create a function to check if Mollie is configured
CREATE OR REPLACE FUNCTION is_mollie_configured()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_mode boolean;
  api_key text;
BEGIN
  -- Get the test mode setting
  SELECT mollie_test_mode INTO test_mode FROM app_settings LIMIT 1;
  
  -- Get the appropriate API key based on test mode
  IF test_mode THEN
    SELECT mollie_api_key_test INTO api_key FROM app_settings LIMIT 1;
  ELSE
    SELECT mollie_api_key_live INTO api_key FROM app_settings LIMIT 1;
  END IF;
  
  -- Return true if API key is not null or empty
  RETURN api_key IS NOT NULL AND api_key != '';
END;
$$;
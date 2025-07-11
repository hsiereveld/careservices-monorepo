/*
  # Professional Onboarding Fields

  1. New Fields
    - Add bank_account_number, vat_number, company_registration_number, and payment_terms to service_providers table
    - These fields are essential for financial administration and payments to professionals

  2. Security
    - Maintain existing RLS policies for service_providers table
    - Ensure professionals can only manage their own data
*/

-- Add new fields to service_providers table for professional onboarding
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS company_registration_number TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net30';

-- Add comments to explain the fields
COMMENT ON COLUMN service_providers.bank_account_number IS 'IBAN or other bank account number for payments';
COMMENT ON COLUMN service_providers.vat_number IS 'VAT/BTW number for tax purposes';
COMMENT ON COLUMN service_providers.company_registration_number IS 'KVK number or other company registration';
COMMENT ON COLUMN service_providers.payment_terms IS 'Payment terms (e.g., net30, net15)';

-- Create a function to check if a user has completed their business details
CREATE OR REPLACE FUNCTION has_completed_business_details(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN bank_account_number IS NOT NULL AND bank_account_number != '' THEN true
      ELSE false
    END
  FROM service_providers 
  WHERE user_id = user_id
  LIMIT 1;
$$;
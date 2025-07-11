/*
  # Add Commission Rate Override to Provider Services

  1. New Fields
    - `commission_rate_override` (numeric(5,2)) to provider_services table
  
  2. Changes
    - Adds an optional commission rate override field to provider services
    - This allows for service-specific commission rates that override the category default
    - Adds a check constraint to ensure values are between 0 and 100
  
  3. Security
    - No changes to RLS policies needed as existing policies already control access
    - Professional can propose a rate, but it requires admin approval via the existing review process
*/

-- Add commission_rate_override to provider_services if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_services' AND column_name = 'commission_rate_override'
  ) THEN
    ALTER TABLE public.provider_services 
    ADD COLUMN commission_rate_override NUMERIC(5,2);
    
    -- Add check constraint to ensure commission_rate_override is between 0 and 100
    ALTER TABLE public.provider_services 
    ADD CONSTRAINT provider_services_commission_rate_override_check 
    CHECK (commission_rate_override IS NULL OR (commission_rate_override >= 0 AND commission_rate_override <= 100));
  END IF;
END $$;

-- Add comment to explain the column
COMMENT ON COLUMN public.provider_services.commission_rate_override IS 'Optional override for the commission percentage for this specific service. If NULL, the category commission_rate will be used.';
/*
  # Add Commission Rate to Categories

  1. New Fields
    - `commission_rate` (numeric(5,2)) to service_categories table
  
  2. Changes
    - Adds a default commission rate field to service categories
    - Sets a default value of 15.0%
    - Adds a check constraint to ensure values are between 0 and 100
  
  3. Security
    - No changes to RLS policies needed as existing policies already control access
*/

-- Add commission_rate to service_categories if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_categories' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE public.service_categories 
    ADD COLUMN commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.0;
    
    -- Add check constraint to ensure commission_rate is between 0 and 100
    ALTER TABLE public.service_categories 
    ADD CONSTRAINT service_categories_commission_rate_check 
    CHECK (commission_rate >= 0 AND commission_rate <= 100);
  END IF;
END $$;

-- Update existing categories to have the default commission rate if needed
UPDATE public.service_categories
SET commission_rate = 15.0
WHERE commission_rate IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.service_categories.commission_rate IS 'Default commission percentage for all services in this category';
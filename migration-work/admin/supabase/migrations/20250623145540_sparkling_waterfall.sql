/*
  # Add price unit type to pricing tiers

  1. New Types
    - `price_unit_type` enum with values for different pricing units
  
  2. Changes
    - Add `price_unit` column to `pricing_tiers` table
    - Set default value to 'per_hour'
    
  3. Security
    - No changes to RLS policies needed
*/

-- Create the price_unit_type enum
CREATE TYPE price_unit_type AS ENUM (
  'per_hour',
  'per_day',
  'per_service',
  'per_km',
  'per_item',
  'per_month',
  'per_week'
);

-- Add price_unit column to pricing_tiers table
ALTER TABLE pricing_tiers
ADD COLUMN price_unit price_unit_type NOT NULL DEFAULT 'per_hour';

-- Add comment to explain the column
COMMENT ON COLUMN pricing_tiers.price_unit IS 'Unit of measurement for the price (e.g., per hour, per day, per service)';

-- Update existing pricing tiers based on description
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Update pricing tiers with "per kilometer" in description
  UPDATE pricing_tiers
  SET price_unit = 'per_km'
  WHERE description ILIKE '%kilometer%' OR description ILIKE '%km%';

  -- Update pricing tiers with "per dag" in description
  UPDATE pricing_tiers
  SET price_unit = 'per_day'
  WHERE description ILIKE '%dag%' OR description ILIKE '%day%';

  -- Update pricing tiers with "per maand" in description
  UPDATE pricing_tiers
  SET price_unit = 'per_month'
  WHERE description ILIKE '%maand%' OR description ILIKE '%month%';

  -- Update pricing tiers with "per week" in description
  UPDATE pricing_tiers
  SET price_unit = 'per_week'
  WHERE description ILIKE '%week%';

  -- Update pricing tiers with "per item" or "per stuk" in description
  UPDATE pricing_tiers
  SET price_unit = 'per_item'
  WHERE description ILIKE '%item%' OR description ILIKE '%stuk%';

  -- Update pricing tiers with "service" in description that don't have time units
  UPDATE pricing_tiers
  SET price_unit = 'per_service'
  WHERE description ILIKE '%service%' 
    AND description NOT ILIKE '%hour%' 
    AND description NOT ILIKE '%uur%'
    AND description NOT ILIKE '%dag%'
    AND description NOT ILIKE '%day%';
END $$;
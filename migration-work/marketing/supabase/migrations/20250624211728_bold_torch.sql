/*
  # Add price_unit to service_bundles

  1. New Columns
    - `price_unit` (price_unit_type) to service_bundles table
      - Default value: 'per_service'
      - Not nullable

  2. Security
    - Maintains existing RLS policies
*/

-- Add price_unit column to service_bundles table
ALTER TABLE public.service_bundles
ADD COLUMN price_unit price_unit_type NOT NULL DEFAULT 'per_service';

-- Add comment to explain the column
COMMENT ON COLUMN public.service_bundles.price_unit IS 'Unit of measurement for the price (e.g., per hour, per day, per service)';
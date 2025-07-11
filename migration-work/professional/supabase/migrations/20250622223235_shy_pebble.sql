/*
  # Add anonymous access to offers

  1. Changes
    - Add policies for anonymous users to view subscription plans, discount types, service bundles, and public discounts
    - Check if policies exist before creating them to avoid errors

  2. Security
    - Only allows read access to active/public items
    - Maintains existing security for authenticated users
*/

-- Check if policy exists before creating for subscription plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Anyone can read active subscription plans'
  ) THEN
    CREATE POLICY "Anyone can read active subscription plans"
      ON subscription_plans
      FOR SELECT
      TO anon
      USING (is_active = true);
  END IF;
END
$$;

-- Check if policy exists before creating for discount types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discount_types' 
    AND policyname = 'Anyone can read active discount types'
  ) THEN
    CREATE POLICY "Anyone can read active discount types"
      ON discount_types
      FOR SELECT
      TO anon
      USING (is_active = true);
  END IF;
END
$$;

-- Check if policy exists before creating for service bundles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_bundles' 
    AND policyname = 'Anyone can read active service bundles'
  ) THEN
    CREATE POLICY "Anyone can read active service bundles"
      ON service_bundles
      FOR SELECT
      TO anon
      USING (is_active = true);
  END IF;
END
$$;

-- Check if policy exists before creating for bundle services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bundle_services' 
    AND policyname = 'Anyone can read bundle services'
  ) THEN
    CREATE POLICY "Anyone can read bundle services"
      ON bundle_services
      FOR SELECT
      TO anon
      USING (EXISTS (
        SELECT 1
        FROM service_bundles sb
        WHERE sb.id = bundle_services.bundle_id
        AND sb.is_active = true
      ));
  END IF;
END
$$;

-- Check if policy exists before creating for discounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discounts' 
    AND policyname = 'Anyone can read public discounts'
  ) THEN
    CREATE POLICY "Anyone can read public discounts"
      ON discounts
      FOR SELECT
      TO anon
      USING (
        is_active = true
        AND user_id IS NULL
        AND (start_date IS NULL OR start_date <= now())
        AND (end_date IS NULL OR end_date >= now())
        AND (max_uses IS NULL OR uses_count < max_uses)
      );
  END IF;
END
$$;
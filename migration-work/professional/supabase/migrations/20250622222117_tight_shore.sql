/*
  # Allow anonymous access to offers

  1. Security
    - Enable anonymous access to subscription plans, discounts, and service bundles
    - Only allow read access to active items
    - Maintain existing authenticated user policies

  2. Changes
    - Add 'anon' role to existing RLS policies for subscription_plans
    - Add 'anon' role to existing RLS policies for discounts
    - Add 'anon' role to existing RLS policies for service_bundles
*/

-- Allow anonymous users to read active subscription plans
CREATE POLICY "Anyone can read active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Allow anonymous users to read active discounts (only public ones with null user_id)
CREATE POLICY "Anyone can read active public discounts"
  ON public.discounts
  FOR SELECT
  TO anon
  USING (
    is_active = true 
    AND user_id IS NULL
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  );

-- Allow anonymous users to read active service bundles
CREATE POLICY "Anyone can read active service bundles"
  ON public.service_bundles
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Allow anonymous users to read bundle services for active bundles
CREATE POLICY "Anyone can read bundle services"
  ON public.bundle_services
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM service_bundles sb
      WHERE sb.id = bundle_services.bundle_id
      AND sb.is_active = true
    )
  );

-- Allow anonymous users to read discount types
CREATE POLICY "Anyone can read active discount types"
  ON public.discount_types
  FOR SELECT
  TO anon
  USING (is_active = true);
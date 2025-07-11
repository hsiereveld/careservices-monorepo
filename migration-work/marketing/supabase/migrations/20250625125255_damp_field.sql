/*
  # Create Get Effective Commission Rate Function

  1. New Functions
    - `get_effective_commission_rate(p_provider_service_id UUID)` - Returns the effective commission rate for a provider service
  
  2. Changes
    - Creates a new SQL function that implements the commission rate hierarchy:
      1. Provider service override (most specific)
      2. Service category default
      3. Global app setting (least specific)
  
  3. Security
    - Function is accessible to all authenticated users
*/

-- Create or replace the function to get the effective commission rate
CREATE OR REPLACE FUNCTION public.get_effective_commission_rate(p_provider_service_id UUID)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_commission_rate NUMERIC(5,2);
  v_service_id UUID;
  v_category_id UUID;
  v_global_rate NUMERIC(5,2);
BEGIN
  -- First, try to get the provider service override
  SELECT commission_rate_override INTO v_commission_rate
  FROM provider_services
  WHERE id = p_provider_service_id;
  
  -- If we found an override, return it
  IF v_commission_rate IS NOT NULL THEN
    RETURN v_commission_rate;
  END IF;
  
  -- No override, get the service_id for this provider service
  SELECT service_id INTO v_service_id
  FROM provider_services
  WHERE id = p_provider_service_id;
  
  -- Get the category_id for this service
  SELECT category_id INTO v_category_id
  FROM services
  WHERE id = v_service_id;
  
  -- Get the category commission rate
  SELECT commission_rate INTO v_commission_rate
  FROM service_categories
  WHERE id = v_category_id;
  
  -- If we found a category rate, return it
  IF v_commission_rate IS NOT NULL THEN
    RETURN v_commission_rate;
  END IF;
  
  -- No category rate, fall back to the global default
  SELECT admin_percentage_default INTO v_global_rate
  FROM app_settings
  LIMIT 1;
  
  -- Return the global rate, or 15.0 if that's not found
  RETURN COALESCE(v_global_rate, 15.0);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_effective_commission_rate(UUID) TO authenticated;

-- Add comment to explain the function
COMMENT ON FUNCTION public.get_effective_commission_rate(UUID) IS 'Returns the effective commission rate for a provider service based on the hierarchy: 1) provider_service override, 2) service category default, 3) global app setting';
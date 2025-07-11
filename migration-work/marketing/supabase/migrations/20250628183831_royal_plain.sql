-- Add custom fields to provider_services table only if they don't exist
DO $$
BEGIN
  -- Check and add custom_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_services' AND column_name = 'custom_name'
  ) THEN
    ALTER TABLE public.provider_services ADD COLUMN custom_name TEXT;
  END IF;

  -- Check and add custom_short_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_services' AND column_name = 'custom_short_description'
  ) THEN
    ALTER TABLE public.provider_services ADD COLUMN custom_short_description TEXT;
  END IF;

  -- Check and add custom_full_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_services' AND column_name = 'custom_full_description'
  ) THEN
    ALTER TABLE public.provider_services ADD COLUMN custom_full_description TEXT;
  END IF;

  -- Check and add custom_price_unit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_services' AND column_name = 'custom_price_unit'
  ) THEN
    ALTER TABLE public.provider_services ADD COLUMN custom_price_unit price_unit_type;
  END IF;

  -- Check and add custom_duration_minutes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_services' AND column_name = 'custom_duration_minutes'
  ) THEN
    ALTER TABLE public.provider_services ADD COLUMN custom_duration_minutes INTEGER;
  END IF;

  -- Check and add custom_target_audience
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_services' AND column_name = 'custom_target_audience'
  ) THEN
    ALTER TABLE public.provider_services ADD COLUMN custom_target_audience TEXT;
  END IF;

  -- Check and add custom_image_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_services' AND column_name = 'custom_image_url'
  ) THEN
    ALTER TABLE public.provider_services ADD COLUMN custom_image_url TEXT;
  END IF;
END $$;

-- Create index for faster queries if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'provider_services' AND indexname = 'idx_provider_services_custom_name'
  ) THEN
    CREATE INDEX idx_provider_services_custom_name ON public.provider_services(custom_name);
  END IF;
END $$;

-- Check if the policy exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Professionals can manage own services'
    AND tablename = 'provider_services'
    AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Professionals can manage own services"
      ON public.provider_services
      FOR ALL
      TO authenticated
      USING (provider_id IN (
        SELECT id FROM service_providers
        WHERE user_id = auth.uid()
      ))
      WITH CHECK (provider_id IN (
        SELECT id FROM service_providers
        WHERE user_id = auth.uid()
      ));
  END IF;
END
$$;
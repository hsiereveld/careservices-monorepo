/*
  # Fix BackOffice permissions for service management
  
  1. Changes
    - Add policies for BackOffice to manage service-related tables if they don't exist already
    - Includes policies for pricing_tiers, service_details, service_client_types, service_requirements, and service_availability
  
  2. Security
    - Ensures BackOffice users can fully manage all service components
    - Uses EXISTS checks to verify user role
*/

-- Add policy for BackOffice to manage pricing tiers (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pricing_tiers' AND policyname = 'BackOffice can manage pricing tiers'
  ) THEN
    CREATE POLICY "BackOffice can manage pricing tiers"
      ON pricing_tiers
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      );
  END IF;
END
$$;

-- Add policy for BackOffice to manage service details (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_details' AND policyname = 'BackOffice can manage service details'
  ) THEN
    CREATE POLICY "BackOffice can manage service details"
      ON service_details
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      );
  END IF;
END
$$;

-- Add policy for BackOffice to manage service client types (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_client_types' AND policyname = 'BackOffice can manage service client types'
  ) THEN
    CREATE POLICY "BackOffice can manage service client types"
      ON service_client_types
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      );
  END IF;
END
$$;

-- Add policy for BackOffice to manage service requirements (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_requirements' AND policyname = 'BackOffice can manage service requirements'
  ) THEN
    CREATE POLICY "BackOffice can manage service requirements"
      ON service_requirements
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      );
  END IF;
END
$$;

-- Add policy for BackOffice to manage service availability (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_availability' AND policyname = 'BackOffice can manage service availability'
  ) THEN
    CREATE POLICY "BackOffice can manage service availability"
      ON service_availability
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'backoffice'
        )
      );
  END IF;
END
$$;
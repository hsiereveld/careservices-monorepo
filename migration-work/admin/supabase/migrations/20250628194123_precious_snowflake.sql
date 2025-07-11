/*
  # Fix app_settings table schema

  1. New Tables
    - Ensures app_settings table exists with proper UUID type for id column
  2. Changes
    - Adds site_name, site_url, contact_email and other columns if they don't exist
    - Creates policies for admin, backoffice and authenticated users
  3. Security
    - Enables RLS on app_settings table
    - Adds appropriate policies
*/

-- First check if the table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_settings') THEN
    -- Create app_settings table if it doesn't exist
    CREATE TABLE public.app_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_percentage_default NUMERIC(5,2) NOT NULL DEFAULT 15.0,
      site_name TEXT DEFAULT 'Care & Service Pinoso',
      site_url TEXT DEFAULT 'https://care-service-pinoso.com',
      contact_email TEXT DEFAULT 'info@care-service-pinoso.com',
      default_language TEXT DEFAULT 'nl',
      time_zone TEXT DEFAULT 'Europe/Madrid',
      maintenance_mode BOOLEAN DEFAULT false,
      debug_mode BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Admins can manage app settings"
      ON public.app_settings
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
      );

    CREATE POLICY "BackOffice can manage app settings"
      ON public.app_settings
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
        )
      );

    CREATE POLICY "Authenticated users can read app settings"
      ON public.app_settings
      FOR SELECT
      TO authenticated
      USING (true);
      
  ELSE
    -- If the table exists, check if we need to add the new columns
    -- First check if we need to add site_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'site_name') THEN
      ALTER TABLE public.app_settings ADD COLUMN site_name TEXT DEFAULT 'Care & Service Pinoso';
    END IF;
    
    -- Check if we need to add site_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'site_url') THEN
      ALTER TABLE public.app_settings ADD COLUMN site_url TEXT DEFAULT 'https://care-service-pinoso.com';
    END IF;
    
    -- Check if we need to add contact_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'contact_email') THEN
      ALTER TABLE public.app_settings ADD COLUMN contact_email TEXT DEFAULT 'info@care-service-pinoso.com';
    END IF;
    
    -- Check if we need to add default_language column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'default_language') THEN
      ALTER TABLE public.app_settings ADD COLUMN default_language TEXT DEFAULT 'nl';
    END IF;
    
    -- Check if we need to add time_zone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'time_zone') THEN
      ALTER TABLE public.app_settings ADD COLUMN time_zone TEXT DEFAULT 'Europe/Madrid';
    END IF;
    
    -- Check if we need to add maintenance_mode column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'maintenance_mode') THEN
      ALTER TABLE public.app_settings ADD COLUMN maintenance_mode BOOLEAN DEFAULT false;
    END IF;
    
    -- Check if we need to add debug_mode column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'debug_mode') THEN
      ALTER TABLE public.app_settings ADD COLUMN debug_mode BOOLEAN DEFAULT false;
    END IF;
  END IF;
END
$$;

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION update_app_settings_updated_at();

-- Insert default settings if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings LIMIT 1) THEN
    INSERT INTO public.app_settings (
      admin_percentage_default,
      site_name, 
      site_url, 
      contact_email,
      default_language,
      time_zone,
      maintenance_mode,
      debug_mode
    ) VALUES (
      15.0,
      'Care & Service Pinoso', 
      'https://care-service-pinoso.com', 
      'info@care-service-pinoso.com',
      'nl',
      'Europe/Madrid',
      false,
      false
    );
  END IF;
END
$$;
-- Drop the trigger function
DROP TRIGGER IF EXISTS update_worldline_settings_updated_at ON public.worldline_settings;
DROP FUNCTION IF EXISTS update_worldline_settings_updated_at();

-- Drop policies
DROP POLICY IF EXISTS "Admins can manage worldline settings" ON public.worldline_settings;
DROP POLICY IF EXISTS "BackOffice can read worldline settings" ON public.worldline_settings;

-- Drop the table
DROP TABLE IF EXISTS public.worldline_settings;
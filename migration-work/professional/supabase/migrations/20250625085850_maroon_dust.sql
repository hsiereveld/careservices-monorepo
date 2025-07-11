/*
  # Aanpassen van provider_services voor aangepaste diensten

  1. Nieuwe Tabellen
    - Geen nieuwe tabellen nodig

  2. Wijzigingen
    - Toevoegen van custom velden aan provider_services tabel
    - Automatiseren van service_provider aanmaak bij professional rol toewijzing

  3. Security
    - Bestaande RLS policies worden behouden
*/

-- Voeg custom velden toe aan provider_services tabel
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS custom_name TEXT;
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS custom_short_description TEXT;
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS custom_full_description TEXT;
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS custom_price_unit price_unit_type DEFAULT 'per_hour'::price_unit_type;
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS custom_duration_minutes INTEGER;
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS custom_target_audience TEXT;
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS custom_image_url TEXT;

-- Automatiseer service_provider aanmaak bij professional rol toewijzing
CREATE OR REPLACE FUNCTION public.auto_create_service_provider_for_professional()
RETURNS TRIGGER AS $$
BEGIN
  -- Alleen uitvoeren als de nieuwe rol 'professional' is
  IF NEW.role = 'professional' THEN
    -- Controleer of er al een service_provider record bestaat voor deze gebruiker
    IF NOT EXISTS (SELECT 1 FROM public.service_providers WHERE user_id = NEW.user_id) THEN
      -- Maak een nieuw service_provider record aan
      INSERT INTO public.service_providers (
        user_id,
        business_name,
        description,
        city,
        is_active,
        is_verified
      )
      VALUES (
        NEW.user_id,
        (SELECT CONCAT(first_name, ' ', last_name) FROM public.profiles WHERE id = NEW.user_id),
        'Professional service provider',
        'Pinoso',
        true,
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Maak of vervang de trigger
DROP TRIGGER IF EXISTS auto_create_service_provider_trigger ON public.user_roles;
CREATE TRIGGER auto_create_service_provider_trigger
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_service_provider_for_professional();
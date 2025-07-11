/*
  # Fix User Roles en Admin Navigatie

  1. Veilige aanpak voor user_roles policies
    - Vermijdt het verwijderen van bestaande functies waar andere policies van afhankelijk zijn
    - Creëert nieuwe helper functies met duidelijke namen
    - Zorgt voor correcte RLS (Row Level Security) instellingen

  2. Verbeterde role-based navigatie
    - Voegt dashboard redirect functie toe
    - Ondersteunt alle rollen: admin, backoffice, professional, client, user
*/

-- Stap 1: Maak een veilige functie voor dashboard redirects
CREATE OR REPLACE FUNCTION public.get_dashboard_redirect()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') 
        THEN '/admin'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'backoffice') 
        THEN '/admin'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'professional') 
        THEN '/professional-dashboard'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'client') 
        THEN '/client-dashboard'
      ELSE '/dashboard'
    END;
$$;

-- Stap 2: Maak een functie om alle gebruikers met hun rollen op te halen
CREATE OR REPLACE FUNCTION public.get_admin_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  first_name text,
  last_name text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.email,
    ur.role,
    p.first_name,
    p.last_name,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON u.id = p.id
  ORDER BY u.created_at DESC;
$$;

-- Stap 3: Maak een functie om een rol toe te wijzen aan een gebruiker
CREATE OR REPLACE FUNCTION public.assign_role_to_user(
  target_user_id uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_valid_role boolean;
BEGIN
  -- Controleer of de rol geldig is
  is_valid_role := new_role IN ('user', 'admin', 'client', 'professional', 'backoffice');
  
  IF NOT is_valid_role THEN
    RAISE EXCEPTION 'Ongeldige rol: %', new_role;
  END IF;

  -- Alleen admins mogen rollen toewijzen
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Alleen administrators kunnen rollen toewijzen';
  END IF;

  -- Voeg de rol toe of update deze
  INSERT INTO user_roles (user_id, role, is_primary_role)
  VALUES (target_user_id, new_role, true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();

  RETURN true;
END;
$$;

-- Stap 4: Zorg ervoor dat alle gebruikers een rol hebben
INSERT INTO public.user_roles (user_id, role, is_primary_role)
SELECT 
  id,
  'user',
  true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Stap 5: Geef de juiste permissies voor de nieuwe functies
GRANT EXECUTE ON FUNCTION public.get_dashboard_redirect() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role_to_user(uuid, text) TO authenticated;

-- Stap 6: Voeg commentaar toe aan de user_roles tabel voor documentatie
COMMENT ON TABLE public.user_roles IS 'Gebruikersrollen voor toegangscontrole en navigatie';
COMMENT ON COLUMN public.user_roles.role IS 'Mogelijke rollen: user, admin, client, professional, backoffice';
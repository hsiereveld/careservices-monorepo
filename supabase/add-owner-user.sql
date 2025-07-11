-- ============================================================================
-- ADD OWNER/ADMIN USER - Henk Siereveld
-- Care & Service Pinoso - Owner/Administrator Account
-- ============================================================================

-- Deze script voegt de eigenaar Henk Siereveld toe als admin user
-- Run dit script ALLEEN in development/staging omgeving!

-- ============================================================================
-- OWNER/ADMIN USER: HENK SIEREVELD
-- ============================================================================

-- Admin User: Henk Siereveld (Eigenaar/Administrator)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, email_confirm_token)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'h.siereveld@gmail.com',
  NOW() - INTERVAL '120 days',
  NOW() - INTERVAL '120 days',
  NOW() - INTERVAL '120 days',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Profile voor Henk Siereveld
INSERT INTO profiles (id, first_name, last_name, email, phone, address, city, postal_code, language, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Henk',
  'Siereveld',
  'h.siereveld@gmail.com',
  '+31 6 12345678',
  'Calle Principal 1',
  'Pinoso',
  '03650',
  'nl',
  'customer', -- Kan later professional worden als hij ook services aanbiedt
  NOW() - INTERVAL '120 days'
) ON CONFLICT (id) DO NOTHING;

-- Admin rol toekennen
INSERT INTO user_roles (user_id, role, is_primary_role, role_assigned_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  true,
  NOW() - INTERVAL '120 days'
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  is_primary_role = true,
  role_assigned_at = NOW() - INTERVAL '120 days',
  updated_at = NOW();

-- ============================================================================
-- FRANCHISE ASSIGNMENT (als franchise schema bestaat)
-- ============================================================================

-- Probeer franchise toe te wijzen (alleen als franchise tabel bestaat)
DO $$
BEGIN
  -- Check if franchises table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'franchises') THEN
    -- Update profile with franchise_id
    UPDATE profiles 
    SET franchise_id = (SELECT id FROM franchises WHERE slug = 'pinoso' LIMIT 1)
    WHERE id = '00000000-0000-0000-0000-000000000001';
  END IF;
END $$;

-- ============================================================================
-- ADMIN PRIVILEGES VERIFICATION
-- ============================================================================

-- Functie om admin privileges te checken voor Henk
CREATE OR REPLACE FUNCTION public.verify_henk_admin_access()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  role text,
  has_admin_access boolean,
  franchise_assigned boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    au.id as user_id,
    au.email,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    ur.role,
    (ur.role = 'admin') as has_admin_access,
    (p.franchise_id IS NOT NULL) as franchise_assigned
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  WHERE au.email = 'h.siereveld@gmail.com';
$$;

-- ============================================================================
-- SAMPLE BUSINESS DATA FOR HENK (OPTIONAL)
-- ============================================================================

-- Als Henk ook services wil aanbieden, kan hij een service provider worden
-- Dit is optioneel en kan later toegevoegd worden

/*
-- Service Provider profiel voor Henk (uncomment als gewenst)
INSERT INTO service_providers (id, user_id, business_name, description, phone, email, address, city, postal_code, hourly_rate, is_active, is_verified, rating_average, total_reviews, total_bookings, joined_at)
VALUES (
  '00000000-1111-2222-3333-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Care & Service Pinoso - Eigenaar Services',
  'Persoonlijke dienstverlening door de eigenaar van Care & Service Pinoso',
  '+31 6 12345678',
  'h.siereveld@gmail.com',
  'Calle Principal 1',
  'Pinoso',
  '03650',
  25.00,
  true,
  true,
  5.0,
  0,
  0,
  NOW() - INTERVAL '120 days'
) ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- VERIFICATIE QUERIES
-- ============================================================================

-- Check of Henk correct is aangemaakt
SELECT 'User Creation Check' as check_type, 
       CASE 
         WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'h.siereveld@gmail.com') 
         THEN 'SUCCESS: User exists in auth.users'
         ELSE 'ERROR: User not found in auth.users'
       END as result
UNION ALL
SELECT 'Profile Check',
       CASE 
         WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'h.siereveld@gmail.com') 
         THEN 'SUCCESS: Profile exists'
         ELSE 'ERROR: Profile not found'
       END
UNION ALL
SELECT 'Admin Role Check',
       CASE 
         WHEN EXISTS (
           SELECT 1 FROM user_roles ur
           JOIN auth.users au ON ur.user_id = au.id
           WHERE au.email = 'h.siereveld@gmail.com' AND ur.role = 'admin'
         ) 
         THEN 'SUCCESS: Admin role assigned'
         ELSE 'ERROR: Admin role not found'
       END;

-- Toon volledige user info voor Henk
SELECT 
  'h.siereveld@gmail.com User Details' as info_type,
  au.id as user_id,
  au.email,
  au.created_at as user_created,
  p.first_name,
  p.last_name,
  p.phone,
  p.city,
  ur.role,
  ur.role_assigned_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email = 'h.siereveld@gmail.com';

-- ============================================================================
-- ADMIN DASHBOARD DATA VOOR HENK
-- ============================================================================

/*
Henk zou als admin de volgende data moeten kunnen zien:

ADMIN DASHBOARD ACCESS:
- User ID: 00000000-0000-0000-0000-000000000001
- Email: h.siereveld@gmail.com
- Role: admin
- Full Name: Henk Siereveld
- Created: 120 dagen geleden (oprichter van het platform)

ADMIN PRIVILEGES:
✅ Toegang tot admin dashboard (/admin-dashboard)
✅ User management (alle users bekijken/bewerken)
✅ Booking management (alle bookings bekijken)
✅ Service provider management
✅ Financial overview en commissies
✅ Platform statistieken
✅ System settings

DASHBOARD STATISTICS (die hij zou moeten zien):
- Total Users: Alle geregistreerde users
- Active Customers: Actieve klanten
- Active Professionals: Actieve service providers
- Total Bookings: Alle bookings in het systeem
- Monthly Revenue: Totale maandelijkse omzet
- Commission Earned: Verdiende commissies
- Recent Activity: Laatste activiteiten op het platform

LOGIN INSTRUCTIES:
1. Ga naar de login pagina
2. Gebruik email: h.siereveld@gmail.com
3. Wachtwoord moet via Supabase Auth dashboard ingesteld worden
4. Na login redirect naar /admin-dashboard
5. Volledige admin toegang tot alle platform functies
*/ 
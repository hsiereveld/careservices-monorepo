-- ============================================================================
-- SIMPLE DATABASE CHECK SCRIPT
-- Care & Service Pinoso - Basis Database Controle
-- ============================================================================

-- Eenvoudige versie die werkt met basic permissions

-- 1. TABELLEN OVERZICHT
SELECT 
  'TABLE_LIST' as section,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. GEBRUIKERS TOTAAL
SELECT 
  'USER_COUNT' as section,
  COUNT(*) as total_users
FROM auth.users;

-- 3. HENK CHECK
SELECT 
  'HENK_CHECK' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'h.siereveld@gmail.com')
    THEN 'HENK_EXISTS'
    ELSE 'HENK_NOT_FOUND'
  END as henk_status;

-- 4. CORE TABELLEN CHECK
SELECT 
  'CORE_TABLES' as section,
  'profiles' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'CORE_TABLES' as section,
  'user_roles' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'CORE_TABLES' as section,
  'services' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'CORE_TABLES' as section,
  'bookings' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'CORE_TABLES' as section,
  'reviews' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'CORE_TABLES' as section,
  'payments' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
ORDER BY table_name;

-- 5. EINDE
SELECT 'SIMPLE_CHECK_COMPLETED' as final_status; 
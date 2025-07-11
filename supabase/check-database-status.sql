-- ============================================================================
-- DATABASE STATUS CHECK SCRIPT
-- Care & Service Pinoso - Huidige Database Analyse
-- ============================================================================

-- Dit script controleert de huidige status van de Supabase database
-- Gebruik met service_role key voor volledige toegang

-- ============================================================================
-- 1. BESTAANDE TABELLEN OVERZICHT
-- ============================================================================

SELECT 
  'EXISTING TABLES' as check_type,
  table_name,
  table_type,
  CASE 
    WHEN table_name IN ('profiles', 'user_roles', 'services', 'bookings', 'reviews', 'payments') 
    THEN '✅ CORE TABLE'
    WHEN table_name IN ('franchises', 'service_categories', 'commission_requests')
    THEN '🏢 FRANCHISE TABLE'
    WHEN table_name IN ('service_providers', 'provider_services', 'booking_status_history', 'booking_reviews')
    THEN '📊 EXTENDED TABLE'
    ELSE '📝 OTHER TABLE'
  END as table_category
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. RECORD COUNTS PER TABEL
-- ============================================================================

-- Core tabellen record counts
SELECT 'RECORD COUNTS - CORE TABLES' as section;

DO $$
DECLARE
    tbl_name text;
    tbl_count integer;
    sql_stmt text;
BEGIN
    -- Loop door core tabellen
    FOR tbl_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('profiles', 'user_roles', 'services', 'bookings', 'reviews', 'payments')
        ORDER BY table_name
    LOOP
        sql_stmt := 'SELECT COUNT(*) FROM ' || tbl_name;
        EXECUTE sql_stmt INTO tbl_count;
        RAISE NOTICE 'Table: % | Records: %', tbl_name, tbl_count;
    END LOOP;
END $$;

-- ============================================================================
-- 3. USER ACCOUNTS ANALYSE
-- ============================================================================

SELECT 'USER ACCOUNTS ANALYSIS' as section;

-- Check auth.users (als toegankelijk)
SELECT 
  'auth.users' as table_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_users
FROM auth.users;

-- Check profiles tabel (als bestaat)
DO $$
DECLARE
  rec RECORD;
  temp_count INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- First check what columns exist in profiles table
    RAISE NOTICE 'Profiles table exists - checking structure...';
    
    -- Check available columns
    FOR rec IN 
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE 'Column: % (type: %)', rec.column_name, rec.data_type;
    END LOOP;
    
    -- Get basic count
    EXECUTE 'SELECT COUNT(*) FROM profiles' INTO temp_count;
    RAISE NOTICE 'Total profiles: %', temp_count;
    
  ELSE
    RAISE NOTICE 'Profiles table does not exist';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error analyzing profiles table: %', SQLERRM;
END $$;

-- Check user_roles (als bestaat)
DO $$
DECLARE
  rec RECORD;
  temp_count INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    RAISE NOTICE 'User_roles table exists - checking structure...';
    
    -- Check available columns
    FOR rec IN 
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND table_schema = 'public'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE 'Column: % (type: %)', rec.column_name, rec.data_type;
    END LOOP;
    
    -- Get basic count
    EXECUTE 'SELECT COUNT(*) FROM user_roles' INTO temp_count;
    RAISE NOTICE 'Total user_roles: %', temp_count;
    
  ELSE
    RAISE NOTICE 'User_roles table does not exist';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error analyzing user_roles table: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. HENK SIEREVELD CHECK
-- ============================================================================

SELECT 'HENK SIEREVELD ADMIN CHECK' as section;

-- Check of Henk al bestaat in auth.users
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'h.siereveld@gmail.com')
    THEN '✅ Henk exists in auth.users'
    ELSE '❌ Henk NOT found in auth.users'
  END as henk_auth_status;

-- Check of Henk profiel bestaat (als profiles tabel bestaat)
DO $$
DECLARE
  has_email_col BOOLEAN;
  henk_exists BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Check if email column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'email'
    ) INTO has_email_col;
    
    IF has_email_col THEN
      SELECT EXISTS (SELECT 1 FROM profiles WHERE email = 'h.siereveld@gmail.com') INTO henk_exists;
      IF henk_exists THEN
        RAISE NOTICE '✅ Henk profile exists';
      ELSE
        RAISE NOTICE '❌ Henk profile NOT found';
      END IF;
    ELSE
      RAISE NOTICE '⚠️ Profiles table exists but has no email column - cannot check for Henk';
    END IF;
  ELSE
    RAISE NOTICE '❌ Profiles table does not exist';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error checking Henk profile: %', SQLERRM;
END $$;

-- Check of Henk admin rol heeft (als user_roles tabel bestaat)
DO $$
DECLARE
  has_role_col BOOLEAN;
  has_user_id_col BOOLEAN;
  henk_admin BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    -- Check if required columns exist
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND column_name = 'role'
    ) INTO has_role_col;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND column_name = 'user_id'
    ) INTO has_user_id_col;
    
    IF has_role_col AND has_user_id_col THEN
      SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN auth.users au ON ur.user_id = au.id
        WHERE au.email = 'h.siereveld@gmail.com' AND ur.role = 'admin'
      ) INTO henk_admin;
      
      IF henk_admin THEN
        RAISE NOTICE '✅ Henk has admin role';
      ELSE
        RAISE NOTICE '❌ Henk does NOT have admin role';
      END IF;
    ELSE
      RAISE NOTICE '⚠️ User_roles table missing required columns (role: %, user_id: %)', has_role_col, has_user_id_col;
    END IF;
  ELSE
    RAISE NOTICE '❌ User_roles table does not exist';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error checking Henk admin role: %', SQLERRM;
END $$;

-- ============================================================================
-- 5. SAMPLE DATA CHECK
-- ============================================================================

SELECT 'SAMPLE DATA CHECK' as section;

-- Check voor test users uit sample data
DO $$
DECLARE
    test_emails text[] := ARRAY[
        'maria.gonzalez@example.com',
        'jan.janssen@example.nl', 
        'sarah.thompson@example.co.uk',
        'carlos.martinez@professional.com',
        'petra.vandenberg@zorg.nl'
    ];
    test_email text;
    user_exists boolean;
BEGIN
    FOREACH test_email IN ARRAY test_emails
    LOOP
        SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = test_email) INTO user_exists;
        IF user_exists THEN
            RAISE NOTICE '✅ Test user exists: %', test_email;
        ELSE
            RAISE NOTICE '❌ Test user missing: %', test_email;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 6. BOOKING DATA ANALYSE
-- ============================================================================

SELECT 'BOOKING DATA ANALYSIS' as section;

DO $$
DECLARE
  rec RECORD;
  temp_count INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    RAISE NOTICE 'Bookings table exists - checking structure...';
    
    -- Check available columns
    FOR rec IN 
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND table_schema = 'public'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE 'Column: % (type: %)', rec.column_name, rec.data_type;
    END LOOP;
    
    -- Get basic count
    EXECUTE 'SELECT COUNT(*) FROM bookings' INTO temp_count;
    RAISE NOTICE 'Total bookings: %', temp_count;
    
  ELSE
    RAISE NOTICE 'Bookings table does not exist';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error analyzing bookings table: %', SQLERRM;
END $$;

-- ============================================================================
-- 7. SCHEMA VERSION DETECTION
-- ============================================================================

SELECT 'SCHEMA VERSION DETECTION' as section;

-- Detect welk schema actief is gebaseerd op bestaande tabellen
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'franchises')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_categories')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commission_requests')
    THEN '🏢 FRANCHISE SCHEMA (v2.0+)'
    
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_providers')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_reviews')
    THEN '📊 EXTENDED SCHEMA (v1.5+)'
    
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles')
    THEN '✅ COMPLETE SCHEMA (v1.0)'
    
    ELSE '❓ UNKNOWN/INCOMPLETE SCHEMA'
  END as detected_schema_version;

-- ============================================================================
-- 8. MISSING CORE TABLES CHECK
-- ============================================================================

SELECT 'MISSING CORE TABLES CHECK' as section;

-- Check welke core tabellen ontbreken
WITH core_tables AS (
  SELECT unnest(ARRAY['profiles', 'user_roles', 'services', 'bookings', 'reviews', 'payments']) as required_table
)
SELECT 
  ct.required_table,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = ct.required_table AND table_schema = 'public'
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as table_status
FROM core_tables ct
ORDER BY ct.required_table;

-- ============================================================================
-- 9. RLS (ROW LEVEL SECURITY) STATUS
-- ============================================================================

SELECT 'ROW LEVEL SECURITY STATUS' as section;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_roles', 'services', 'bookings', 'reviews', 'payments')
ORDER BY tablename;

-- ============================================================================
-- 10. DATABASE SUMMARY
-- ============================================================================

SELECT 'DATABASE SUMMARY' as section;

SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_public_tables,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
    THEN (SELECT COUNT(*) FROM profiles)
    ELSE 0
  END as total_profiles,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings')
    THEN (SELECT COUNT(*) FROM bookings)
    ELSE 0
  END as total_bookings,
  NOW() as analysis_timestamp;

-- ============================================================================
-- EINDE ANALYSE
-- ============================================================================

SELECT 'DATABASE STATUS CHECK COMPLETED' as final_message,
       'Check the output above for detailed analysis' as instructions; 
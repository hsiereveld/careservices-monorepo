-- ============================================================================
-- FRANCHISE SCHEMA MIGRATION SCRIPT
-- ============================================================================
-- 
-- Dit script past het franchise schema toe op een bestaande Supabase database.
-- 
-- VOORAF: Maak een backup van je database!
-- 
-- Uitvoeren in Supabase SQL Editor of via CLI:
-- psql -h your-project.supabase.co -U postgres -d postgres -f apply-franchise-schema.sql
-- 
-- ============================================================================

-- Stap 1: Backup bestaande data (optioneel - voor veiligheid)
-- CREATE TABLE profiles_backup AS SELECT * FROM profiles;
-- CREATE TABLE services_backup AS SELECT * FROM services;
-- CREATE TABLE bookings_backup AS SELECT * FROM bookings;

-- ============================================================================
-- NIEUWE TABELLEN TOEVOEGEN
-- ============================================================================

-- 1. Franchises table
CREATE TABLE IF NOT EXISTS public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'ES',
  is_active BOOLEAN DEFAULT true,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Service categories table
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Commission requests table
CREATE TABLE IF NOT EXISTS public.commission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  current_commission_rate DECIMAL(5,2) NOT NULL,
  requested_commission_rate DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BESTAANDE TABELLEN UITBREIDEN
-- ============================================================================

-- 1. Profiles table uitbreiden met franchise_id
DO $$ 
BEGIN
  -- Check if franchise_id column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.profiles ADD COLUMN franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Services table uitbreiden
DO $$ 
BEGIN
  -- Add category_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'category_id') THEN
    ALTER TABLE public.services ADD COLUMN category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL;
  END IF;
  
  -- Add franchise_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.services ADD COLUMN franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE;
  END IF;
  
  -- Add base_price if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'base_price') THEN
    ALTER TABLE public.services ADD COLUMN base_price DECIMAL(10,2);
  END IF;
  
  -- Add commission_rate if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'commission_rate') THEN
    ALTER TABLE public.services ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 15.00;
  END IF;
  
  -- Add final_price if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'final_price') THEN
    ALTER TABLE public.services ADD COLUMN final_price DECIMAL(10,2) GENERATED ALWAYS AS (base_price * (1 + commission_rate / 100)) STORED;
  END IF;
END $$;

-- 3. Bookings table uitbreiden
DO $$ 
BEGIN
  -- Add franchise_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.bookings ADD COLUMN franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE;
  END IF;
  
  -- Add base_amount if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'base_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN base_amount DECIMAL(10,2);
  END IF;
  
  -- Add commission_amount if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'commission_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN commission_amount DECIMAL(10,2);
  END IF;
END $$;

-- 4. Reviews table uitbreiden
DO $$ 
BEGIN
  -- Add franchise_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reviews' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.reviews ADD COLUMN franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Payments table uitbreiden
DO $$ 
BEGIN
  -- Add franchise_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'payments' AND column_name = 'franchise_id') THEN
    ALTER TABLE public.payments ADD COLUMN franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- INDEXES TOEVOEGEN
-- ============================================================================

-- Franchise indexes
CREATE INDEX IF NOT EXISTS franchises_slug_idx ON public.franchises(slug);
CREATE INDEX IF NOT EXISTS franchises_region_idx ON public.franchises(region);
CREATE INDEX IF NOT EXISTS franchises_active_idx ON public.franchises(is_active);

-- Service category indexes
CREATE INDEX IF NOT EXISTS service_categories_active_idx ON public.service_categories(is_active);
CREATE INDEX IF NOT EXISTS service_categories_sort_idx ON public.service_categories(sort_order);

-- Profile indexes (extended)
CREATE INDEX IF NOT EXISTS profiles_franchise_idx ON public.profiles(franchise_id);

-- Service indexes (extended)
CREATE INDEX IF NOT EXISTS services_category_idx ON public.services(category_id);
CREATE INDEX IF NOT EXISTS services_franchise_idx ON public.services(franchise_id);
CREATE INDEX IF NOT EXISTS services_active_idx ON public.services(is_active);

-- Commission request indexes
CREATE INDEX IF NOT EXISTS commission_requests_professional_idx ON public.commission_requests(professional_id);
CREATE INDEX IF NOT EXISTS commission_requests_status_idx ON public.commission_requests(status);
CREATE INDEX IF NOT EXISTS commission_requests_franchise_idx ON public.commission_requests(franchise_id);

-- Booking indexes (extended)
CREATE INDEX IF NOT EXISTS bookings_franchise_idx ON public.bookings(franchise_id);

-- Review indexes (extended)
CREATE INDEX IF NOT EXISTS reviews_franchise_idx ON public.reviews(franchise_id);

-- Payment indexes (extended)
CREATE INDEX IF NOT EXISTS payments_franchise_idx ON public.payments(franchise_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_requests ENABLE ROW LEVEL SECURITY;

-- Franchise policies (admin only)
DROP POLICY IF EXISTS "Admin can manage franchises" ON public.franchises;
CREATE POLICY "Admin can manage franchises" ON public.franchises
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active franchises" ON public.franchises;
CREATE POLICY "Anyone can view active franchises" ON public.franchises
  FOR SELECT USING (is_active = true);

-- Service category policies (admin only)
DROP POLICY IF EXISTS "Admin can manage service categories" ON public.service_categories;
CREATE POLICY "Admin can manage service categories" ON public.service_categories
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active service categories" ON public.service_categories;
CREATE POLICY "Anyone can view active service categories" ON public.service_categories
  FOR SELECT USING (is_active = true);

-- Commission requests policies
DROP POLICY IF EXISTS "Professionals can view own commission requests" ON public.commission_requests;
CREATE POLICY "Professionals can view own commission requests" ON public.commission_requests
  FOR SELECT USING (
    professional_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Professionals can create commission requests" ON public.commission_requests;
CREATE POLICY "Professionals can create commission requests" ON public.commission_requests
  FOR INSERT WITH CHECK (
    professional_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Admin can manage commission requests" ON public.commission_requests;
CREATE POLICY "Admin can manage commission requests" ON public.commission_requests
  FOR ALL USING (public.is_admin());

-- Update existing policies to be franchise-scoped
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services in franchise" ON public.services
  FOR SELECT USING (
    is_active = true AND 
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Professionals can manage own services" ON public.services;
CREATE POLICY "Professionals can manage own services in franchise" ON public.services
  FOR ALL USING (
    professional_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

-- Update bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings in franchise" ON public.bookings
  FOR SELECT USING (
    (customer_id = auth.uid() OR professional_id = auth.uid()) AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings in franchise" ON public.bookings
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings in franchise" ON public.bookings
  FOR UPDATE USING (
    (customer_id = auth.uid() OR professional_id = auth.uid()) AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

-- ============================================================================
-- FUNCTIES TOEVOEGEN
-- ============================================================================

-- Function to get current franchise for user
CREATE OR REPLACE FUNCTION public.get_current_franchise()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT franchise_id FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get franchise by slug
CREATE OR REPLACE FUNCTION public.get_franchise_by_slug(franchise_slug text)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.franchises 
    WHERE slug = franchise_slug AND is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS TOEVOEGEN
-- ============================================================================

-- Trigger for franchises updated_at
DROP TRIGGER IF EXISTS on_franchises_updated ON public.franchises;
CREATE TRIGGER on_franchises_updated
  BEFORE UPDATE ON public.franchises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for service_categories updated_at
DROP TRIGGER IF EXISTS on_service_categories_updated ON public.service_categories;
CREATE TRIGGER on_service_categories_updated
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for commission_requests updated_at
DROP TRIGGER IF EXISTS on_commission_requests_updated ON public.commission_requests;
CREATE TRIGGER on_commission_requests_updated
  BEFORE UPDATE ON public.commission_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default franchise (Pinoso)
INSERT INTO public.franchises (name, slug, display_name, region, contact_email, contact_phone, address)
VALUES (
  'Care & Service Pinoso',
  'pinoso',
  'Pinoso',
  'Valencia',
  'info@careservicepinoso.es',
  '+34 965 123 456',
  'Calle Mayor 123, 03650 Pinoso, Alicante'
) ON CONFLICT (slug) DO NOTHING;

-- Insert default service categories
INSERT INTO public.service_categories (name, description, icon, sort_order) VALUES
('Huishoudelijke hulp', 'Schoonmaak, wassen, strijken en andere huishoudelijke taken', 'home', 1),
('Vervoer & begeleiding', 'Vervoer naar afspraken, boodschappen en sociale activiteiten', 'car', 2),
('Ouderenzorg', 'Gezelschap, basiszorg en ondersteuning voor senioren', 'heart', 3),
('Technische hulp', 'Klusjesman, elektricien, loodgieter en airco technicus', 'wrench', 4),
('Administratieve ondersteuning', 'Hulp bij NIE, empadronamiento, bankzaken en belastingen', 'document', 5),
('Zwembad techniek', 'Onderhoud en reparatie van zwembadinstallaties', 'water', 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DATA MIGRATIE
-- ============================================================================

-- Update existing services to have franchise_id and base_price
UPDATE public.services 
SET 
  franchise_id = (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1),
  base_price = COALESCE(price, 0)
WHERE franchise_id IS NULL;

-- Update existing bookings to have franchise_id and pricing breakdown
UPDATE public.bookings 
SET 
  franchise_id = (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1),
  base_amount = COALESCE(total_amount * 0.85, 0),
  commission_amount = COALESCE(total_amount * 0.15, 0)
WHERE franchise_id IS NULL;

-- Update existing profiles to have franchise_id
UPDATE public.profiles 
SET franchise_id = (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
WHERE franchise_id IS NULL;

-- ============================================================================
-- VERIFICATIE
-- ============================================================================

-- Check if all tables exist
SELECT 'franchises' as table_name, COUNT(*) as row_count FROM public.franchises
UNION ALL
SELECT 'service_categories', COUNT(*) FROM public.service_categories
UNION ALL
SELECT 'commission_requests', COUNT(*) FROM public.commission_requests;

-- Check if franchise data is populated
SELECT 'Default franchise' as check_name, 
       (SELECT COUNT(*) FROM public.franchises WHERE slug = 'pinoso') as result
UNION ALL
SELECT 'Service categories', 
       (SELECT COUNT(*) FROM public.service_categories) as result;

-- Check if existing data has franchise_id
SELECT 'Profiles with franchise_id' as check_name,
       (SELECT COUNT(*) FROM public.profiles WHERE franchise_id IS NOT NULL) as result
UNION ALL
SELECT 'Services with franchise_id',
       (SELECT COUNT(*) FROM public.services WHERE franchise_id IS NOT NULL) as result
UNION ALL
SELECT 'Bookings with franchise_id',
       (SELECT COUNT(*) FROM public.bookings WHERE franchise_id IS NOT NULL) as result; 
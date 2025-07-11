-- ============================================================================
-- FIX SERVICES TABLE SCRIPT
-- ============================================================================
-- 
-- Dit script voegt ontbrekende kolommen toe aan de services tabel.
-- Voer dit script UIT VOOR het franchise schema script.
-- 
-- ============================================================================

-- 1. Controleer welke kolommen er al bestaan
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Voeg ontbrekende kolommen toe aan services tabel
DO $$ 
BEGIN
  -- Add professional_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'professional_id') THEN
    ALTER TABLE public.services ADD COLUMN professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add title if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'title') THEN
    ALTER TABLE public.services ADD COLUMN title TEXT;
  END IF;
  
  -- Add description if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'description') THEN
    ALTER TABLE public.services ADD COLUMN description TEXT;
  END IF;
  
  -- Add price if not exists (voor backward compatibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'price') THEN
    ALTER TABLE public.services ADD COLUMN price DECIMAL(10,2);
  END IF;
  
  -- Add location if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'location') THEN
    ALTER TABLE public.services ADD COLUMN location TEXT;
  END IF;
  
  -- Add is_active if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'is_active') THEN
    ALTER TABLE public.services ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add created_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'created_at') THEN
    ALTER TABLE public.services ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'updated_at') THEN
    ALTER TABLE public.services ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 3. Voeg ontbrekende kolommen toe aan bookings tabel
DO $$ 
BEGIN
  -- Add customer_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'customer_id') THEN
    ALTER TABLE public.bookings ADD COLUMN customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add professional_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'professional_id') THEN
    ALTER TABLE public.bookings ADD COLUMN professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add service_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'service_id') THEN
    ALTER TABLE public.bookings ADD COLUMN service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
  
  -- Add booking_date if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'booking_date') THEN
    ALTER TABLE public.bookings ADD COLUMN booking_date DATE;
  END IF;
  
  -- Add start_time if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'start_time') THEN
    ALTER TABLE public.bookings ADD COLUMN start_time TIME;
  END IF;
  
  -- Add end_time if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'end_time') THEN
    ALTER TABLE public.bookings ADD COLUMN end_time TIME;
  END IF;
  
  -- Add total_amount if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'total_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN total_amount DECIMAL(10,2);
  END IF;
  
  -- Add status if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'status') THEN
    ALTER TABLE public.bookings ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
  END IF;
  
  -- Add created_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'created_at') THEN
    ALTER TABLE public.bookings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'updated_at') THEN
    ALTER TABLE public.bookings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 4. Voeg ontbrekende kolommen toe aan profiles tabel
DO $$ 
BEGIN
  -- Add role if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'professional', 'admin'));
  END IF;
  
  -- Add full_name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
  
  -- Add phone if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
  
  -- Add avatar_url if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
  
  -- Add rating if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'rating') THEN
    ALTER TABLE public.profiles ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
  END IF;
  
  -- Add review_count if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'review_count') THEN
    ALTER TABLE public.profiles ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add created_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 5. Enable RLS op bestaande tabellen (als nog niet enabled)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Basis RLS policies voor bestaande tabellen
-- Services policies
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Professionals can manage own services" ON public.services;
CREATE POLICY "Professionals can manage own services" ON public.services
  FOR ALL USING (professional_id = auth.uid());

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (customer_id = auth.uid() OR professional_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (customer_id = auth.uid() OR professional_id = auth.uid());

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 7. Indexes voor bestaande tabellen
CREATE INDEX IF NOT EXISTS services_professional_idx ON public.services(professional_id);
CREATE INDEX IF NOT EXISTS services_active_idx ON public.services(is_active);
CREATE INDEX IF NOT EXISTS services_location_idx ON public.services(location);

CREATE INDEX IF NOT EXISTS bookings_customer_idx ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS bookings_professional_idx ON public.bookings(professional_id);
CREATE INDEX IF NOT EXISTS bookings_service_idx ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_rating_idx ON public.profiles(rating);

-- 8. Triggers voor updated_at
DROP TRIGGER IF EXISTS on_services_updated ON public.services;
CREATE TRIGGER on_services_updated
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_bookings_updated ON public.bookings;
CREATE TRIGGER on_bookings_updated
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Verificatie
SELECT 'Services table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Bookings table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Profiles table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 
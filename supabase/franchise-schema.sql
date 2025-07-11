-- Franchise-Enabled Database Schema for Care & Service Pinoso
-- This extends the complete schema with franchise support, commission requests, and multi-regional pricing

-- Enable Row Level Security on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FRANCHISES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g., 'pinoso', 'alicante', 'torrevieja'
  display_name TEXT NOT NULL, -- e.g., 'Pinoso', 'Alicante', 'Torrevieja'
  region TEXT NOT NULL, -- e.g., 'Valencia', 'Alicante'
  country TEXT NOT NULL DEFAULT 'ES',
  is_active BOOLEAN DEFAULT true,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Default 15% commission
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SERVICE CATEGORIES TABLE (Admin managed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name or SVG
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROFILES TABLE (Extended with franchise support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  language TEXT DEFAULT 'nl',
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'professional')),
  
  -- Franchise support
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
  
  -- Professional specific fields
  business_name TEXT,
  business_description TEXT,
  services TEXT[], -- Array van services
  experience TEXT,
  certifications TEXT,
  hourly_rate DECIMAL(10,2),
  availability JSONB, -- JSON object voor beschikbaarheid
  
  -- Consent fields
  marketing_consent BOOLEAN DEFAULT false,
  background_check_consent BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('client', 'professional', 'admin', 'backoffice')),
  is_primary_role BOOLEAN DEFAULT true,
  role_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SERVICES TABLE (Extended with franchise and category support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Pricing (franchise-scoped)
  base_price DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Can override franchise default
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (base_price * (1 + commission_rate / 100)) STORED,
  
  duration INTEGER, -- in minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMMISSION REQUESTS TABLE (Professional requests for commission changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.commission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  
  -- Request details
  current_commission_rate DECIMAL(5,2) NOT NULL,
  requested_commission_rate DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BOOKINGS TABLE (Extended with franchise support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  
  -- Pricing breakdown
  base_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Franchise indexes
CREATE INDEX IF NOT EXISTS franchises_slug_idx ON public.franchises(slug);
CREATE INDEX IF NOT EXISTS franchises_region_idx ON public.franchises(region);
CREATE INDEX IF NOT EXISTS franchises_active_idx ON public.franchises(is_active);

-- Service category indexes
CREATE INDEX IF NOT EXISTS service_categories_active_idx ON public.service_categories(is_active);
CREATE INDEX IF NOT EXISTS service_categories_sort_idx ON public.service_categories(sort_order);

-- Profile indexes (extended)
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON public.profiles(city);
CREATE INDEX IF NOT EXISTS profiles_services_idx ON public.profiles USING GIN(services);
CREATE INDEX IF NOT EXISTS profiles_franchise_idx ON public.profiles(franchise_id);

-- Service indexes (extended)
CREATE INDEX IF NOT EXISTS services_professional_id_idx ON public.services(professional_id);
CREATE INDEX IF NOT EXISTS services_category_idx ON public.services(category_id);
CREATE INDEX IF NOT EXISTS services_franchise_idx ON public.services(franchise_id);
CREATE INDEX IF NOT EXISTS services_active_idx ON public.services(is_active);

-- Commission request indexes
CREATE INDEX IF NOT EXISTS commission_requests_professional_idx ON public.commission_requests(professional_id);
CREATE INDEX IF NOT EXISTS commission_requests_status_idx ON public.commission_requests(status);
CREATE INDEX IF NOT EXISTS commission_requests_franchise_idx ON public.commission_requests(franchise_id);

-- Booking indexes (extended)
CREATE INDEX IF NOT EXISTS bookings_customer_id_idx ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS bookings_professional_id_idx ON public.bookings(professional_id);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS bookings_franchise_idx ON public.bookings(franchise_id);

-- Review indexes (extended)
CREATE INDEX IF NOT EXISTS reviews_professional_id_idx ON public.reviews(professional_id);
CREATE INDEX IF NOT EXISTS reviews_franchise_idx ON public.reviews(franchise_id);

-- Payment indexes (extended)
CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS payments_franchise_idx ON public.payments(franchise_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Franchise policies (admin only)
CREATE POLICY "Admin can manage franchises" ON public.franchises
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view active franchises" ON public.franchises
  FOR SELECT USING (is_active = true);

-- Service category policies (admin only)
CREATE POLICY "Admin can manage service categories" ON public.service_categories
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view active service categories" ON public.service_categories
  FOR SELECT USING (is_active = true);

-- Profiles policies (franchise-scoped)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own role" ON public.user_roles
  FOR UPDATE USING (user_id = auth.uid());

-- Services policies (franchise-scoped)
CREATE POLICY "Anyone can view active services in franchise" ON public.services
  FOR SELECT USING (
    is_active = true AND 
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

CREATE POLICY "Professionals can manage own services in franchise" ON public.services
  FOR ALL USING (
    professional_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

-- Commission requests policies (franchise-scoped)
CREATE POLICY "Professionals can view own commission requests" ON public.commission_requests
  FOR SELECT USING (
    professional_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

CREATE POLICY "Professionals can create commission requests" ON public.commission_requests
  FOR INSERT WITH CHECK (
    professional_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

CREATE POLICY "Admin can manage commission requests" ON public.commission_requests
  FOR ALL USING (public.is_admin());

-- Bookings policies (franchise-scoped)
CREATE POLICY "Users can view own bookings in franchise" ON public.bookings
  FOR SELECT USING (
    (customer_id = auth.uid() OR professional_id = auth.uid()) AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

CREATE POLICY "Users can create own bookings in franchise" ON public.bookings
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

CREATE POLICY "Users can update own bookings in franchise" ON public.bookings
  FOR UPDATE USING (
    (customer_id = auth.uid() OR professional_id = auth.uid()) AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

-- Reviews policies (franchise-scoped)
CREATE POLICY "Anyone can view reviews in franchise" ON public.reviews
  FOR SELECT USING (
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

CREATE POLICY "Users can create own reviews in franchise" ON public.reviews
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() AND
    franchise_id = COALESCE(
      (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );

-- Payments policies (franchise-scoped)
CREATE POLICY "Users can view own payments in franchise" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payments.booking_id 
      AND (bookings.customer_id = auth.uid() OR bookings.professional_id = auth.uid())
      AND bookings.franchise_id = COALESCE(
        (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
        (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
      )
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to handle new user creation (extended with franchise)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, user_type, franchise_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'user_type',
    COALESCE(
      (SELECT id FROM public.franchises WHERE slug = NEW.raw_user_meta_data->>'franchise_slug'),
      (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'backoffice')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND is_primary_role = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign user role
CREATE OR REPLACE FUNCTION public.assign_user_role_simple(
  user_uuid uuid,
  role_name text
)
RETURNS void AS $$
BEGIN
  -- Delete existing primary role
  DELETE FROM public.user_roles 
  WHERE user_id = user_uuid AND is_primary_role = true;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role, is_primary_role)
  VALUES (user_uuid, role_name, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard redirect based on role
CREATE OR REPLACE FUNCTION public.get_dashboard_redirect()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_role();
  
  CASE user_role
    WHEN 'admin' THEN
      RETURN '/admin';
    WHEN 'backoffice' THEN
      RETURN '/admin';
    WHEN 'professional' THEN
      RETURN '/pro';
    WHEN 'client' THEN
      RETURN '/my';
    ELSE
      RETURN '/';
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- TRIGGERS
-- ============================================================================

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_user_roles_updated ON public.user_roles;
CREATE TRIGGER on_user_roles_updated
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_services_updated ON public.services;
CREATE TRIGGER on_services_updated
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_bookings_updated ON public.bookings;
CREATE TRIGGER on_bookings_updated
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_payments_updated ON public.payments;
CREATE TRIGGER on_payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_franchises_updated ON public.franchises;
CREATE TRIGGER on_franchises_updated
  BEFORE UPDATE ON public.franchises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_service_categories_updated ON public.service_categories;
CREATE TRIGGER on_service_categories_updated
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

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
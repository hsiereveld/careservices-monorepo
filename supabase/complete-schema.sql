-- Complete Database Schema for Care & Service Pinoso
-- This consolidates all the tables and functions needed for the application

-- Enable Row Level Security on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE
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
-- SERVICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER, -- in minutes
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
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
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON public.profiles(city);
CREATE INDEX IF NOT EXISTS profiles_services_idx ON public.profiles USING GIN(services);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS services_professional_id_idx ON public.services(professional_id);
CREATE INDEX IF NOT EXISTS services_category_idx ON public.services(category);
CREATE INDEX IF NOT EXISTS bookings_customer_id_idx ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS bookings_professional_id_idx ON public.bookings(professional_id);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS reviews_professional_id_idx ON public.reviews(professional_id);
CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON public.payments(booking_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
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

-- Services policies
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Professionals can manage own services" ON public.services
  FOR ALL USING (professional_id = auth.uid());

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (customer_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (customer_id = auth.uid() OR professional_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payments.booking_id 
      AND (bookings.customer_id = auth.uid() OR bookings.professional_id = auth.uid())
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'user_type'
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
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
    LIMIT 1
  );
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM user_roles 
  WHERE user_id = user_uuid
  LIMIT 1;
$$;

-- Function to assign user role
CREATE OR REPLACE FUNCTION public.assign_user_role_simple(
  target_user_id uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('client', 'professional', 'admin', 'backoffice') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Check if current user has permission to assign roles
  IF NOT (
    -- Either the user is assigning to themselves
    auth.uid() = target_user_id
    -- Or the user is an admin
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    -- Or the user is service_role
    OR current_setting('role') = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to assign roles';
  END IF;

  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role, is_primary_role, role_assigned_at)
  VALUES (target_user_id, new_role, true, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    role_assigned_at = now(),
    updated_at = now();

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error assigning role: %', SQLERRM;
END;
$$;

-- Function to get dashboard redirect
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
        THEN '/pro'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'client') 
        THEN '/my'
      ELSE '/my'
    END;
$$;

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

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.bookings TO service_role;
GRANT ALL ON public.reviews TO service_role;
GRANT ALL ON public.payments TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_user_role_simple(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_redirect() TO authenticated, service_role; 
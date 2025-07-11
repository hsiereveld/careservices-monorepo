-- Service Catalog & Booking System Schema
-- Extends the existing schema with comprehensive service management

-- ============================================================================
-- SERVICE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_nl TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description TEXT,
  description_nl TEXT,
  description_en TEXT,
  description_es TEXT,
  icon TEXT,
  color TEXT DEFAULT '#4a9b8e',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SERVICE TEMPLATES TABLE (Admin managed service definitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_nl TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description TEXT,
  description_nl TEXT,
  description_en TEXT,
  description_es TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  price_unit TEXT NOT NULL DEFAULT 'hour' CHECK (price_unit IN ('hour', 'day', 'visit', 'km')),
  minimum_duration INTEGER DEFAULT 60, -- in minutes
  call_out_fee DECIMAL(10,2) DEFAULT 0,
  emergency_premium DECIMAL(10,2) DEFAULT 0,
  is_emergency_available BOOLEAN DEFAULT false,
  languages TEXT[] DEFAULT ARRAY['nl', 'es', 'en'],
  requirements TEXT[],
  inclusions TEXT[],
  exclusions TEXT[],
  faq JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROFESSIONAL SERVICES TABLE (Professional's specific service offerings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.service_templates(id) ON DELETE CASCADE,
  custom_name TEXT,
  custom_description TEXT,
  custom_price DECIMAL(10,2),
  custom_minimum_duration INTEGER,
  custom_call_out_fee DECIMAL(10,2),
  custom_emergency_premium DECIMAL(10,2),
  is_emergency_available BOOLEAN DEFAULT false,
  languages TEXT[],
  specializations TEXT[],
  certifications TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure either template_id or custom fields are provided
  CONSTRAINT check_service_definition CHECK (
    (template_id IS NOT NULL) OR 
    (custom_name IS NOT NULL AND custom_price IS NOT NULL)
  )
);

-- ============================================================================
-- PROFESSIONAL AVAILABILITY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_emergency_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(professional_id, day_of_week, start_time, end_time)
);

-- ============================================================================
-- PROFESSIONAL BLOCKED DATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.professional_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  is_all_day BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_service_id UUID REFERENCES public.professional_services(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  total_amount DECIMAL(10,2) NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  call_out_fee DECIMAL(10,2) DEFAULT 0,
  emergency_premium DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Service location
  service_address TEXT,
  service_city TEXT,
  service_postal_code TEXT,
  service_instructions TEXT,
  
  -- Customer requirements
  special_requirements TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  access_instructions TEXT,
  language_preference TEXT DEFAULT 'nl',
  
  -- Booking status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  cancellation_reason TEXT,
  cancellation_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Recurring booking
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT CHECK (recurring_pattern IN ('weekly', 'bi_weekly', 'monthly')),
  recurring_end_date DATE,
  parent_booking_id UUID REFERENCES public.bookings(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'ideal', 'bancontact', 'paypal', 'bank_transfer', 'cash')),
  payment_provider TEXT,
  transaction_id TEXT,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS service_categories_active_idx ON public.service_categories(is_active);
CREATE INDEX IF NOT EXISTS service_templates_category_idx ON public.service_templates(category_id);
CREATE INDEX IF NOT EXISTS service_templates_active_idx ON public.service_templates(is_active);
CREATE INDEX IF NOT EXISTS professional_services_professional_idx ON public.professional_services(professional_id);
CREATE INDEX IF NOT EXISTS professional_services_template_idx ON public.professional_services(template_id);
CREATE INDEX IF NOT EXISTS professional_services_active_idx ON public.professional_services(is_active);
CREATE INDEX IF NOT EXISTS professional_availability_professional_idx ON public.professional_availability(professional_id);
CREATE INDEX IF NOT EXISTS professional_blocked_dates_professional_idx ON public.professional_blocked_dates(professional_id);
CREATE INDEX IF NOT EXISTS professional_blocked_dates_date_idx ON public.professional_blocked_dates(blocked_date);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS bookings_professional_idx ON public.bookings(professional_id);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_recurring_idx ON public.bookings(is_recurring, parent_booking_id);
CREATE INDEX IF NOT EXISTS payments_booking_idx ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);
CREATE INDEX IF NOT EXISTS subscriptions_customer_idx ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_active_idx ON public.subscriptions(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Service categories: anyone can view active categories
CREATE POLICY "Anyone can view active service categories" ON public.service_categories
  FOR SELECT USING (is_active = true);

-- Service templates: anyone can view active templates
CREATE POLICY "Anyone can view active service templates" ON public.service_templates
  FOR SELECT USING (is_active = true);

-- Professional services: anyone can view approved active services
CREATE POLICY "Anyone can view approved active professional services" ON public.professional_services
  FOR SELECT USING (is_active = true AND is_approved = true);

-- Professionals can manage their own services
CREATE POLICY "Professionals can manage own services" ON public.professional_services
  FOR ALL USING (professional_id = auth.uid());

-- Professional availability: anyone can view
CREATE POLICY "Anyone can view professional availability" ON public.professional_availability
  FOR SELECT USING (true);

-- Professionals can manage their own availability
CREATE POLICY "Professionals can manage own availability" ON public.professional_availability
  FOR ALL USING (professional_id = auth.uid());

-- Professional blocked dates: anyone can view
CREATE POLICY "Anyone can view professional blocked dates" ON public.professional_blocked_dates
  FOR SELECT USING (true);

-- Professionals can manage their own blocked dates
CREATE POLICY "Professionals can manage own blocked dates" ON public.professional_blocked_dates
  FOR ALL USING (professional_id = auth.uid());

-- Enhanced bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (customer_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (customer_id = auth.uid() OR professional_id = auth.uid());

-- Enhanced payments policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payments.booking_id 
      AND (bookings.customer_id = auth.uid() OR bookings.professional_id = auth.uid())
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
  FOR ALL USING (customer_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate booking total
CREATE OR REPLACE FUNCTION public.calculate_booking_total(
  base_amount DECIMAL,
  duration_minutes INTEGER,
  call_out_fee DECIMAL DEFAULT 0,
  emergency_premium DECIMAL DEFAULT 0,
  discount_percentage DECIMAL DEFAULT 0
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  total DECIMAL;
BEGIN
  total := base_amount + call_out_fee + emergency_premium;
  
  IF discount_percentage > 0 THEN
    total := total * (1 - discount_percentage / 100);
  END IF;
  
  RETURN total;
END;
$$;

-- Function to check professional availability
CREATE OR REPLACE FUNCTION public.check_professional_availability(
  p_professional_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  day_of_week INTEGER;
  is_available BOOLEAN;
  has_conflict BOOLEAN;
BEGIN
  -- Get day of week (0=Sunday, 1=Monday, etc.)
  day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Check if professional is available on this day and time
  SELECT EXISTS (
    SELECT 1 FROM public.professional_availability
    WHERE professional_id = p_professional_id
    AND day_of_week = day_of_week
    AND start_time <= p_start_time
    AND end_time >= p_end_time
    AND is_available = true
  ) INTO is_available;
  
  IF NOT is_available THEN
    RETURN false;
  END IF;
  
  -- Check for blocked dates
  SELECT EXISTS (
    SELECT 1 FROM public.professional_blocked_dates
    WHERE professional_id = p_professional_id
    AND blocked_date = p_date
    AND (
      is_all_day = true OR
      (start_time IS NULL AND end_time IS NULL) OR
      (start_time <= p_start_time AND end_time >= p_end_time)
    )
  ) INTO has_conflict;
  
  IF has_conflict THEN
    RETURN false;
  END IF;
  
  -- Check for existing bookings
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE professional_id = p_professional_id
    AND booking_date = p_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      (start_time < p_end_time AND end_time > p_start_time)
    )
  ) INTO has_conflict;
  
  IF has_conflict THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to get customer subscription discount
CREATE OR REPLACE FUNCTION public.get_customer_discount(p_customer_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  discount DECIMAL;
BEGIN
  SELECT discount_percentage INTO discount
  FROM public.subscriptions
  WHERE customer_id = p_customer_id
  AND is_active = true
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(discount, 0);
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for updated_at on all tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER on_service_categories_updated
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_service_templates_updated
  BEFORE UPDATE ON public.service_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_professional_services_updated
  BEFORE UPDATE ON public.professional_services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_professional_availability_updated
  BEFORE UPDATE ON public.professional_availability
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_bookings_updated
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample service categories
INSERT INTO public.service_categories (name, name_nl, name_en, name_es, description, description_nl, description_en, description_es, icon, color, sort_order) VALUES
('Medical Support', 'Medische Ondersteuning', 'Medical Support', 'Apoyo Médico', 'Professional medical assistance and accompaniment', 'Professionele medische hulp en begeleiding', 'Professional medical assistance and accompaniment', 'Asistencia médica profesional y acompañamiento', 'medical', '#4a9b8e', 1),
('Care Services', 'Zorgdiensten', 'Care Services', 'Servicios de Cuidado', 'Personal care and companionship services', 'Persoonlijke zorg en gezelschapsdiensten', 'Personal care and companionship services', 'Servicios de cuidado personal y compañía', 'care', '#6bb6ab', 2),
('Household Services', 'Huishoudelijke Diensten', 'Household Services', 'Servicios Domésticos', 'Home maintenance and cleaning services', 'Thuisonderhoud en schoonmaakdiensten', 'Home maintenance and cleaning services', 'Servicios de mantenimiento y limpieza del hogar', 'household', '#8bc34a', 3),
('Technical Help', 'Technische Hulp', 'Technical Help', 'Ayuda Técnica', 'Technical and maintenance services', 'Technische en onderhoudsdiensten', 'Technical and maintenance services', 'Servicios técnicos y de mantenimiento', 'technical', '#ff9800', 4),
('Administrative Support', 'Administratieve Ondersteuning', 'Administrative Support', 'Apoyo Administrativo', 'Administrative and bureaucratic assistance', 'Administratieve en bureaucratische hulp', 'Administrative and bureaucratic assistance', 'Asistencia administrativa y burocrática', 'admin', '#9c27b0', 5),
('Emergency Services', 'Nooddiensten', 'Emergency Services', 'Servicios de Emergencia', '24/7 emergency services', '24/7 nooddiensten', '24/7 emergency services', 'Servicios de emergencia 24/7', 'emergency', '#f44336', 6);

-- Insert sample service templates
INSERT INTO public.service_templates (category_id, name, name_nl, name_en, name_es, description, description_nl, description_en, description_es, base_price, price_unit, minimum_duration, call_out_fee, emergency_premium, is_emergency_available, languages, requirements, inclusions, exclusions) VALUES
((SELECT id FROM public.service_categories WHERE name = 'Medical Support'), 'Medical Accompaniment', 'Medische Begeleiding', 'Medical Accompaniment', 'Acompañamiento Médico', 'Professional medical accompaniment to appointments', 'Professionele medische begeleiding naar afspraken', 'Professional medical accompaniment to appointments', 'Acompañamiento médico profesional a citas', 15.00, 'hour', 60, 0, 5.00, true, ARRAY['nl', 'es', 'en'], ARRAY['Valid ID'], ARRAY['Transport to appointment', 'Translation support', 'Medical documentation assistance'], ARRAY['Medical treatment', 'Prescription medication']),
((SELECT id FROM public.service_categories WHERE name = 'Technical Help'), 'Pool Maintenance', 'Zwembad Onderhoud', 'Pool Maintenance', 'Mantenimiento de Piscina', 'Professional pool maintenance and cleaning', 'Professioneel zwembad onderhoud en schoonmaak', 'Professional pool maintenance and cleaning', 'Mantenimiento y limpieza profesional de piscinas', 30.00, 'hour', 60, 25.00, 10.00, true, ARRAY['nl', 'es', 'en'], ARRAY['Pool access'], ARRAY['Water testing', 'Chemical balancing', 'Cleaning', 'Equipment maintenance'], ARRAY['Major repairs', 'Equipment replacement']),
((SELECT id FROM public.service_categories WHERE name = 'Household Services'), 'Cleaning Service', 'Schoonmaakdienst', 'Cleaning Service', 'Servicio de Limpieza', 'Professional home cleaning service', 'Professionele thuis schoonmaakdienst', 'Professional home cleaning service', 'Servicio profesional de limpieza del hogar', 15.00, 'hour', 120, 0, 5.00, true, ARRAY['nl', 'es', 'en'], ARRAY['Access to home'], ARRAY['General cleaning', 'Kitchen cleaning', 'Bathroom cleaning', 'Vacuuming'], ARRAY['Deep cleaning', 'Window cleaning', 'Laundry']); 
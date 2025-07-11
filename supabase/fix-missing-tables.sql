-- ============================================================================
-- FIX MISSING TABLES SCRIPT
-- ============================================================================
-- 
-- Dit script maakt ontbrekende tabellen aan die nodig zijn voor het franchise schema.
-- Voer dit script UIT VOOR het franchise schema script.
-- 
-- ============================================================================

-- 1. Reviews table (als deze nog niet bestaat)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Payments table (als deze nog niet bestaat)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User roles table (als deze nog niet bestaat)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'professional', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. Enable RLS op nieuwe tabellen
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Basis RLS policies voor nieuwe tabellen
-- Reviews policies
DROP POLICY IF EXISTS "Users can view public reviews" ON public.reviews;
CREATE POLICY "Users can view public reviews" ON public.reviews
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT USING (
    customer_id = auth.uid() OR 
    professional_id = auth.uid()
  );

DROP POLICY IF EXISTS "Customers can create reviews" ON public.reviews;
CREATE POLICY "Customers can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    customer_id = auth.uid() OR 
    professional_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- User roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can manage user roles" ON public.user_roles;
CREATE POLICY "Admin can manage user roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- 6. Indexes voor nieuwe tabellen
CREATE INDEX IF NOT EXISTS reviews_booking_idx ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS reviews_customer_idx ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS reviews_professional_idx ON public.reviews(professional_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews(rating);

CREATE INDEX IF NOT EXISTS payments_booking_idx ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS payments_customer_idx ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS payments_professional_idx ON public.payments(professional_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(payment_status);

CREATE INDEX IF NOT EXISTS user_roles_user_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles(role);

-- 7. Triggers voor updated_at
DROP TRIGGER IF EXISTS on_reviews_updated ON public.reviews;
CREATE TRIGGER on_reviews_updated
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_payments_updated ON public.payments;
CREATE TRIGGER on_payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_user_roles_updated ON public.user_roles;
CREATE TRIGGER on_user_roles_updated
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Verificatie
SELECT 'reviews' as table_name, COUNT(*) as row_count FROM public.reviews
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles; 
-- ============================================================================
-- UTILITY FUNCTIONS SCRIPT
-- ============================================================================
-- 
-- Dit script maakt utility functies aan die nodig zijn voor het franchise schema.
-- Voer dit script UIT VOOR de andere schema scripts.
-- 
-- ============================================================================

-- 1. handle_updated_at function (voor automatische updated_at updates)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. is_admin function (voor admin role checks)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_user_role function (voor role checks)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. is_professional function (voor professional role checks)
CREATE OR REPLACE FUNCTION public.is_professional()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'professional'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. is_customer function (voor customer role checks)
CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'customer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. get_user_franchise function (voor franchise checks)
CREATE OR REPLACE FUNCTION public.get_user_franchise()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT franchise_id FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verificatie
SELECT 'Utility functions created successfully' as status; 
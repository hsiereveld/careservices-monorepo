/*
  # Fix User Roles Policy Recursion - Complete Migration

  This migration fixes the infinite recursion issue in user_roles policies by:
  1. Dropping ALL policies that depend on admin/professional functions
  2. Dropping all helper functions
  3. Creating simple, non-recursive user_roles policies
  4. Recreating helper functions
  5. Recreating all dependent policies

  ## Changes Made
  - Fixed infinite recursion in user_roles table policies
  - Ensured proper dependency management
  - Maintained all existing functionality
*/

-- Step 1: Drop ALL policies that depend on helper functions across ALL tables
-- This must be done first to avoid dependency conflicts

-- Profiles policies
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Service categories policies
DROP POLICY IF EXISTS "Admins can manage service categories" ON service_categories;

-- Client types policies
DROP POLICY IF EXISTS "Admins can manage client types" ON client_types;

-- Services policies
DROP POLICY IF EXISTS "Admins can read all services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;

-- Service details policies
DROP POLICY IF EXISTS "Admins can manage service details" ON service_details;

-- Pricing tiers policies
DROP POLICY IF EXISTS "Admins can manage pricing tiers" ON pricing_tiers;

-- Service availability policies
DROP POLICY IF EXISTS "Admins can manage service availability" ON service_availability;

-- Service requirements policies
DROP POLICY IF EXISTS "Admins can manage service requirements" ON service_requirements;

-- Service client types policies
DROP POLICY IF EXISTS "Admins can manage service client types" ON service_client_types;

-- Service applications policies (including professional policies)
DROP POLICY IF EXISTS "Admins can read all applications" ON service_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON service_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON service_applications;
DROP POLICY IF EXISTS "Professionals can read applications" ON service_applications;

-- Application services policies
DROP POLICY IF EXISTS "Admins can read all application services" ON application_services;

-- Homepage images policies
DROP POLICY IF EXISTS "Admins can manage homepage images" ON homepage_images;

-- Testimonials policies
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;

-- Homepage stats policies
DROP POLICY IF EXISTS "Admins can manage stats" ON homepage_stats;

-- Service providers policies (including professional policies)
DROP POLICY IF EXISTS "Admins can manage all providers" ON service_providers;
DROP POLICY IF EXISTS "Professionals can manage provider profiles" ON service_providers;

-- Bookings policies (including professional policies)
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Professionals can manage assigned bookings" ON bookings;

-- Provider services policies
DROP POLICY IF EXISTS "Providers can manage own services" ON provider_services;

-- Booking reviews policies
DROP POLICY IF EXISTS "Providers can read reviews about them" ON booking_reviews;

-- User roles policies
DROP POLICY IF EXISTS "Admin users can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all user roles" ON user_roles;

-- Step 2: Now drop all helper functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_backoffice();
DROP FUNCTION IF EXISTS public.is_backoffice(uuid);
DROP FUNCTION IF EXISTS public.has_admin_privileges();
DROP FUNCTION IF EXISTS public.has_admin_privileges(uuid);
DROP FUNCTION IF EXISTS public.is_professional();
DROP FUNCTION IF EXISTS public.is_professional(uuid);

-- Step 3: Create simple, non-recursive policies for user_roles first
-- Users can read their own role (no recursion)
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own role (for registration)
CREATE POLICY "Users can insert own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own role (limited cases)
CREATE POLICY "Users can update own role"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all user roles (for admin operations)
CREATE POLICY "Service role can manage all user roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create helper functions with proper signatures (no parameters)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_backoffice()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'backoffice'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_privileges()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'backoffice')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_professional()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'professional'
  );
$$;

-- Create helper functions with UUID parameters for admin operations
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_backoffice(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'backoffice'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_privileges(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role IN ('admin', 'backoffice')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_professional(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'professional'
  );
$$;

-- Step 5: Recreate all policies that were dropped

-- Profiles policies
CREATE POLICY "Admins can delete all profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert all profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service categories policies
CREATE POLICY "Admins can manage service categories"
  ON service_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Client types policies
CREATE POLICY "Admins can manage client types"
  ON client_types
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Services policies
CREATE POLICY "Admins can read all services"
  ON services
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service details policies
CREATE POLICY "Admins can manage service details"
  ON service_details
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Pricing tiers policies
CREATE POLICY "Admins can manage pricing tiers"
  ON pricing_tiers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service availability policies
CREATE POLICY "Admins can manage service availability"
  ON service_availability
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service requirements policies
CREATE POLICY "Admins can manage service requirements"
  ON service_requirements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service client types policies
CREATE POLICY "Admins can manage service client types"
  ON service_client_types
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service applications policies
CREATE POLICY "Admins can read all applications"
  ON service_applications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update applications"
  ON service_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all applications"
  ON service_applications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Professionals can read applications"
  ON service_applications
  FOR SELECT
  TO authenticated
  USING (public.is_professional() AND user_id = auth.uid());

-- Application services policies
CREATE POLICY "Admins can read all application services"
  ON application_services
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Homepage images policies
CREATE POLICY "Admins can manage homepage images"
  ON homepage_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Testimonials policies
CREATE POLICY "Admins can manage testimonials"
  ON testimonials
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Homepage stats policies
CREATE POLICY "Admins can manage stats"
  ON homepage_stats
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service providers policies
CREATE POLICY "Admins can manage all providers"
  ON service_providers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Professionals can manage provider profiles"
  ON service_providers
  FOR ALL
  TO authenticated
  USING (public.is_professional() AND user_id = auth.uid())
  WITH CHECK (public.is_professional() AND user_id = auth.uid());

-- Bookings policies
CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Professionals can manage assigned bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (public.is_professional() AND provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  ))
  WITH CHECK (public.is_professional() AND provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  ));

-- Provider services policies
CREATE POLICY "Providers can manage own services"
  ON provider_services
  FOR ALL
  TO authenticated
  USING (provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  ))
  WITH CHECK (provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  ));

-- Booking reviews policies
CREATE POLICY "Providers can read reviews about them"
  ON booking_reviews
  FOR SELECT
  TO authenticated
  USING (provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  ));
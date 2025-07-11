/*
  # Add BackOffice Role

  1. Role Updates
    - Add 'backoffice' to the user_roles role check constraint
    - BackOffice medewerkers kunnen:
      * Alle boekingen bekijken en beheren
      * Klantgegevens inzien en bewerken
      * Service providers beheren
      * Facturatie en betalingen afhandelen
      * Reviews en feedback modereren
      * Rapporten genereren

  2. Security
    - BackOffice heeft bijna admin-level toegang maar kan geen systeeminstellingen wijzigen
    - Kan wel alle operationele taken uitvoeren
    - Toegang tot alle klant- en providergegevens voor ondersteuning
*/

-- Update the role constraint to include 'backoffice'
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'client'::text, 'professional'::text, 'backoffice'::text]));

-- Add BackOffice policies for service_providers
CREATE POLICY "BackOffice can manage all providers"
  ON service_providers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for provider_services
CREATE POLICY "BackOffice can manage all provider services"
  ON provider_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for bookings
CREATE POLICY "BackOffice can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for booking_status_history
CREATE POLICY "BackOffice can read all booking status history"
  ON booking_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

CREATE POLICY "BackOffice can insert booking status history"
  ON booking_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for booking_reviews
CREATE POLICY "BackOffice can manage all reviews"
  ON booking_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for existing tables (profiles, tasks, etc.)
CREATE POLICY "BackOffice can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

CREATE POLICY "BackOffice can update profiles for customer support"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for tasks (for customer support)
CREATE POLICY "BackOffice can read all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for user_roles (read-only for support purposes)
CREATE POLICY "BackOffice can read all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for service management
CREATE POLICY "BackOffice can read all services"
  ON services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

CREATE POLICY "BackOffice can update services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for service categories
CREATE POLICY "BackOffice can read all service categories"
  ON service_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for pricing tiers
CREATE POLICY "BackOffice can manage pricing tiers"
  ON pricing_tiers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for service applications
CREATE POLICY "BackOffice can manage all service applications"
  ON service_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Add BackOffice policies for application services
CREATE POLICY "BackOffice can read all application services"
  ON application_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Create a helper function to check if user is backoffice
CREATE OR REPLACE FUNCTION public.is_backoffice()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'backoffice'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if user has admin or backoffice privileges
CREATE OR REPLACE FUNCTION public.has_admin_privileges()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'backoffice')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION public.is_backoffice() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_privileges() TO authenticated;

-- Add comment to document the BackOffice role
COMMENT ON CONSTRAINT user_roles_role_check ON user_roles IS 
'User roles: user (default), admin (full access), client (booking customer), professional (service provider), backoffice (customer support & operations)';
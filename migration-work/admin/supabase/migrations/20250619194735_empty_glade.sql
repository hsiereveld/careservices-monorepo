/*
  # Admin permissions voor profiles en user_roles tabellen

  1. Beveiliging
    - Voeg admin policies toe voor volledige CRUD toegang tot profiles
    - Voeg admin policies toe voor volledige CRUD toegang tot user_roles
    - Gebruik bestaande is_admin() functie voor verificatie

  2. Wijzigingen
    - Drop bestaande conflicterende policies indien aanwezig
    - Maak nieuwe admin policies aan
    - Behoud bestaande gebruiker policies
*/

-- Drop bestaande admin policies indien aanwezig (om conflicten te voorkomen)
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can read all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete all user roles" ON user_roles;

-- Admin policies voor profiles tabel
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can insert all profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admin policies voor user_roles tabel
CREATE POLICY "Admins can read all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all user roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can insert all user roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all user roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (is_admin());
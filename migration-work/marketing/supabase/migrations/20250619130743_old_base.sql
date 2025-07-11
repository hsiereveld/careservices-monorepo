/*
  # Admin systeem voor TaskCare

  1. Nieuwe Tabellen
    - `user_roles` - Voor het beheren van gebruikersrollen (admin/user)
    
  2. Admin Functionaliteiten
    - Admin rol toekenning
    - Admin policies voor toegang tot alle gebruikers en taken
    
  3. Security
    - RLS policies voor admin toegang
    - Veilige rol verificatie
    
  4. Views
    - Admin overzicht van gebruikers met statistieken
    - Admin overzicht van alle taken per gebruiker
*/

-- User roles tabel
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS inschakelen voor user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies voor user_roles
CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Users kunnen hun eigen rol lezen
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin policies voor profiles (admins kunnen alle profielen lezen)
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Admin policies voor tasks (admins kunnen alle taken lezen)
CREATE POLICY "Admins can read all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Admins kunnen alle taken beheren
CREATE POLICY "Admins can manage all tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Trigger functie voor updated_at op user_roles
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger voor updated_at op user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- Functie om automatisch user rol aan te maken
CREATE OR REPLACE FUNCTION create_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger om automatisch user rol aan te maken bij registratie
DROP TRIGGER IF EXISTS create_user_role_trigger ON auth.users;
CREATE TRIGGER create_user_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_role();

-- Admin view voor gebruikers statistieken
CREATE OR REPLACE VIEW admin_users_overview AS
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  p.first_name,
  p.last_name,
  p.phone,
  ur.role,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.completed = true THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.completed = false THEN 1 END) as pending_tasks
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.email, u.created_at, p.first_name, p.last_name, p.phone, ur.role
ORDER BY u.created_at DESC;

-- Admin view voor taken overzicht
CREATE OR REPLACE VIEW admin_tasks_overview AS
SELECT 
  t.*,
  u.email as user_email,
  p.first_name,
  p.last_name,
  COALESCE(p.first_name || ' ' || p.last_name, u.email) as user_display_name
FROM tasks t
JOIN auth.users u ON t.user_id = u.id
LEFT JOIN profiles p ON u.id = p.id
ORDER BY t.created_at DESC;
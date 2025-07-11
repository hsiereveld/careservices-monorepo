/*
  # Fix BackOffice Access to Admin Functions

  1. New Functions
    - `has_admin_privileges()` - Returns true for both admin and backoffice roles
  
  2. Updated Functions
    - Drop and recreate admin overview functions with proper return types
    - Update functions to use has_admin_privileges instead of is_admin
  
  3. Security
    - Add BackOffice policies to relevant tables
    - Ensure BackOffice users can access admin data for support purposes
*/

-- Create the has_admin_privileges function
CREATE OR REPLACE FUNCTION public.has_admin_privileges()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'backoffice')
  );
$$;

-- Drop existing admin overview functions to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_admin_tasks_overview();
DROP FUNCTION IF EXISTS public.get_admin_users_overview();

-- Recreate get_admin_tasks_overview with proper return type
CREATE OR REPLACE FUNCTION public.get_admin_tasks_overview()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  completed boolean,
  priority text,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_email varchar(255),
  first_name text,
  last_name text,
  user_display_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.id,
    t.title,
    t.description,
    t.completed,
    t.priority,
    t.user_id,
    t.created_at,
    t.updated_at,
    u.email::varchar(255) as user_email,
    p.first_name,
    p.last_name,
    COALESCE(p.first_name || ' ' || p.last_name, u.email) as user_display_name
  FROM 
    tasks t
  LEFT JOIN 
    auth.users u ON t.user_id = u.id
  LEFT JOIN 
    profiles p ON t.user_id = p.id
  WHERE 
    has_admin_privileges() = true
  ORDER BY 
    t.created_at DESC
  LIMIT 1000;
$$;

-- Recreate get_admin_users_overview with proper return type
CREATE OR REPLACE FUNCTION public.get_admin_users_overview()
RETURNS TABLE (
  id uuid,
  email varchar(255),
  user_created_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  role text,
  total_tasks bigint,
  completed_tasks bigint,
  pending_tasks bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.email::varchar(255),
    u.created_at as user_created_at,
    p.first_name,
    p.last_name,
    p.phone,
    COALESCE(ur.role, 'client') as role,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.completed = true THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.completed = false THEN 1 END) as pending_tasks
  FROM 
    auth.users u
  LEFT JOIN 
    profiles p ON u.id = p.id
  LEFT JOIN 
    user_roles ur ON u.id = ur.user_id
  LEFT JOIN 
    tasks t ON u.id = t.user_id
  WHERE 
    has_admin_privileges() = true
  GROUP BY 
    u.id, u.email, u.created_at, p.first_name, p.last_name, p.phone, ur.role
  ORDER BY 
    u.created_at DESC
  LIMIT 1000;
$$;

-- Add BackOffice policies to relevant tables
DO $$
BEGIN
  -- BackOffice policy for profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'BackOffice can read all profiles'
  ) THEN
    CREATE POLICY "BackOffice can read all profiles" 
    ON profiles FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

  -- BackOffice policy for tasks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' AND policyname = 'BackOffice can read all tasks'
  ) THEN
    CREATE POLICY "BackOffice can read all tasks" 
    ON tasks FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

  -- BackOffice policy for user_roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' AND policyname = 'BackOffice can read all user roles'
  ) THEN
    CREATE POLICY "BackOffice can read all user roles" 
    ON user_roles FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

  -- BackOffice policy for service_applications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_applications' AND policyname = 'BackOffice can manage all service applications'
  ) THEN
    CREATE POLICY "BackOffice can manage all service applications" 
    ON service_applications FOR ALL 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

  -- BackOffice policy for application_services
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'application_services' AND policyname = 'BackOffice can read all application services'
  ) THEN
    CREATE POLICY "BackOffice can read all application services" 
    ON application_services FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

  -- BackOffice policy for services
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' AND policyname = 'BackOffice can read all services'
  ) THEN
    CREATE POLICY "BackOffice can read all services" 
    ON services FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

  -- BackOffice policy for service_categories
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_categories' AND policyname = 'BackOffice can read all service categories'
  ) THEN
    CREATE POLICY "BackOffice can read all service categories" 
    ON service_categories FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

  -- BackOffice policy for bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'BackOffice can manage all bookings'
  ) THEN
    CREATE POLICY "BackOffice can manage all bookings" 
    ON bookings FOR ALL 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

  -- BackOffice policy for service_providers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_providers' AND policyname = 'BackOffice can manage all providers'
  ) THEN
    CREATE POLICY "BackOffice can manage all providers" 
    ON service_providers FOR ALL 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'backoffice'
      )
    );
  END IF;

END
$$;
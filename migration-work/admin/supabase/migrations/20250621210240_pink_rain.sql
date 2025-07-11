/*
  # Fix user_roles infinite recursion and function return types

  1. Helper Functions
    - Recreate helper functions with SECURITY DEFINER to avoid recursion
    - Add role-specific helper functions (is_admin, is_backoffice, etc.)
  
  2. Policies
    - Fix policies on user_roles table to prevent infinite recursion
    - Use direct SQL checks for user_roles policies
  
  3. Dashboard Redirect
    - Add dashboard redirect function for role-based navigation
*/

-- First drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_admin_tasks_overview();
DROP FUNCTION IF EXISTS public.get_admin_users_overview();

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admin users can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "BackOffice can read all user roles" ON public.user_roles;

-- Create helper functions with SECURITY DEFINER to avoid recursion
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

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'client'
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
    WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'backoffice')
  );
$$;

-- Recreate policies using the helper functions
CREATE POLICY "Admin users can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "BackOffice can read all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (is_backoffice());

-- Create dashboard redirect function
CREATE OR REPLACE FUNCTION public.get_dashboard_redirect()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') 
        THEN '/admin-dashboard'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'backoffice') 
        THEN '/backoffice-dashboard'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'professional') 
        THEN '/professional-dashboard'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'client') 
        THEN '/client-dashboard'
      ELSE '/client-dashboard'
    END;
$$;

-- Create admin functions with proper return types
CREATE FUNCTION public.get_admin_tasks_overview()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  completed boolean,
  priority text,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_email text,
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
    u.email as user_email,
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
    t.created_at DESC;
$$;

CREATE FUNCTION public.get_admin_users_overview()
RETURNS TABLE (
  id uuid,
  email text,
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
    u.email,
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
    u.created_at DESC;
$$;
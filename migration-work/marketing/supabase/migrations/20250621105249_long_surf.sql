-- Update the role constraint to only allow valid roles
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'client'::text, 'professional'::text, 'backoffice'::text]));

-- Update all existing 'user' roles to 'client'
UPDATE user_roles
SET role = 'client',
    updated_at = now(),
    role_assigned_at = now()
WHERE role = 'user';

-- Create a function to get user role display name
CREATE OR REPLACE FUNCTION public.get_user_role_display_name(role_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
IMMUTABLE
AS $$
  SELECT 
    CASE 
      WHEN role_name = 'admin' THEN 'Administrator'
      WHEN role_name = 'backoffice' THEN 'BackOffice'
      WHEN role_name = 'professional' THEN 'Professional'
      WHEN role_name = 'client' THEN 'Klant'
      ELSE 'Klant'
    END;
$$;

-- Create a function to get user role with display name
CREATE OR REPLACE FUNCTION public.get_user_role_with_display_name(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE (
  role text,
  display_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ur.role,
    public.get_user_role_display_name(ur.role) as display_name
  FROM 
    user_roles ur
  WHERE 
    ur.user_id = user_uuid
  LIMIT 1;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_role_display_name(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_with_display_name(uuid) TO authenticated;

-- Update the admin users overview function to use the new display names
CREATE OR REPLACE FUNCTION public.get_admin_users_overview()
RETURNS TABLE (
  id uuid,
  email text,
  user_created_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  role text,
  role_display_name text,
  total_tasks bigint,
  completed_tasks bigint,
  pending_tasks bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at,
    p.first_name,
    p.last_name,
    p.phone,
    COALESCE(ur.role, 'client') as role,
    public.get_user_role_display_name(COALESCE(ur.role, 'client')) as role_display_name,
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = false) as pending_tasks
  FROM 
    auth.users u
  LEFT JOIN 
    public.profiles p ON u.id = p.id
  LEFT JOIN 
    public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN 
    public.tasks t ON u.id = t.user_id
  GROUP BY 
    u.id, u.email, u.created_at, p.first_name, p.last_name, p.phone, ur.role
  ORDER BY 
    u.created_at DESC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_users_overview() TO authenticated;
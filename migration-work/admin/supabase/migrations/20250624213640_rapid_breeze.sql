/*
  # Fix ambiguous column reference in admin_users_overview view

  1. Changes
    - Drop the existing admin_users_overview view
    - Recreate it with properly qualified column references
    - Ensure the 'role' column is explicitly qualified to avoid ambiguity

  2. Security
    - Maintain the same RLS and access patterns as before
    - View remains accessible to admin users only
*/

-- Drop the existing view
DROP VIEW IF EXISTS public.admin_users_overview;

-- Recreate the view with properly qualified columns
CREATE VIEW public.admin_users_overview AS
SELECT 
  au.id,
  au.email,
  au.created_at AS user_created_at,
  p.first_name,
  p.last_name,
  p.phone,
  ur.role,  -- Explicitly qualify the role column from user_roles table
  COALESCE(
    (SELECT COUNT(*) FROM public.tasks t WHERE t.user_id = au.id), 
    0
  ) AS total_tasks,
  COALESCE(
    (SELECT COUNT(*) FROM public.tasks t WHERE t.user_id = au.id AND t.completed = true), 
    0
  ) AS completed_tasks,
  COALESCE(
    (SELECT COUNT(*) FROM public.tasks t WHERE t.user_id = au.id AND t.completed = false), 
    0
  ) AS pending_tasks
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id;

-- Grant appropriate permissions
GRANT SELECT ON public.admin_users_overview TO authenticated;
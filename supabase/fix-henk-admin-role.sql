-- ============================================================================
-- FIX HENK ADMIN ROLE
-- Update h.siereveld@gmail.com role from 'client' to 'admin'
-- ============================================================================

-- Update the user role to admin
UPDATE user_roles 
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'h.siereveld@gmail.com'
);

-- Verify the change
SELECT 
  au.email,
  ur.role,
  ur.updated_at
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email = 'h.siereveld@gmail.com';

-- Check if update was successful
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN auth.users au ON ur.user_id = au.id
      WHERE au.email = 'h.siereveld@gmail.com' AND ur.role = 'admin'
    )
    THEN '✅ HENK IS NOW ADMIN'
    ELSE '❌ UPDATE FAILED'
  END as admin_status; 
-- Fix issues with user registration and role assignment

-- Step 1: Ensure the user_roles table has the correct structure and constraints
DO $$
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_roles' AND constraint_name = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Step 2: Fix the role constraint to only allow valid roles
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'client'::text, 'professional'::text, 'backoffice'::text]));

-- Step 3: Create a more robust function for user registration
CREATE OR REPLACE FUNCTION public.register_user_with_role(
  user_id uuid,
  user_role text,
  first_name text DEFAULT NULL,
  last_name text DEFAULT NULL,
  phone text DEFAULT NULL,
  date_of_birth date DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF user_role NOT IN ('admin', 'client', 'professional', 'backoffice') THEN
    RAISE EXCEPTION 'Invalid role: %. Valid roles are: admin, client, professional, backoffice', user_role;
  END IF;

  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (id, first_name, last_name, phone, date_of_birth)
  VALUES (user_id, first_name, last_name, phone, date_of_birth)
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
    updated_at = now();

  -- Assign role
  INSERT INTO public.user_roles (user_id, role, is_primary_role, role_assigned_at)
  VALUES (user_id, user_role, true, now())
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_primary_role = true,
    role_assigned_at = now(),
    updated_at = now();

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error registering user: %', SQLERRM;
END;
$$;

-- Step 4: Create a trigger to automatically create a profile when a user is created
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'create_profile_for_user_trigger'
  ) THEN
    CREATE TRIGGER create_profile_for_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_profile_for_user();
  END IF;
END $$;

-- Step 5: Create a trigger to automatically create a user role when a user is created
CREATE OR REPLACE FUNCTION public.create_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, is_primary_role)
  VALUES (NEW.id, 'client', true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'create_user_role_trigger'
  ) THEN
    CREATE TRIGGER create_user_role_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_role();
  END IF;
END $$;

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.register_user_with_role(uuid, text, text, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_for_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_role() TO service_role;
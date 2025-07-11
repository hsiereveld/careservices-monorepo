-- Create avatars bucket if it doesn't exist
DO $$
BEGIN
  -- Check if the bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
  END IF;
END $$;

-- Create RLS policies for the avatars bucket
-- Allow users to insert their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can upload their own avatars' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can upload their own avatars"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow users to update their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update their own avatars' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can update their own avatars"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow users to delete their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete their own avatars' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can delete their own avatars"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow users to select their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view their own avatars' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can view their own avatars"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow public access to avatars for display purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public can view avatars' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public can view avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (
      bucket_id = 'avatars'
    );
  END IF;
END $$;

-- Ensure avatar_url column exists in profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;
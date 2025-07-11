/*
  # Fix bookings-profiles relationship

  1. Changes
    - Add foreign key constraint from bookings.customer_id to profiles.id
    - This allows direct joins between bookings and profiles tables in Supabase queries

  2. Security
    - No changes to existing RLS policies
    - Maintains existing data integrity
*/

-- Add foreign key constraint from bookings.customer_id to profiles.id
-- This allows Supabase to infer the relationship for direct joins
DO $$
BEGIN
  -- Check if the constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_customer_id_profiles_fkey' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_customer_id_profiles_fkey 
    FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
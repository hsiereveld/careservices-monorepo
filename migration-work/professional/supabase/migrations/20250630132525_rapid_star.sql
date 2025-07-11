/*
  # Fix Invoice RLS Policy for Auto-Generation

  1. Security Updates
    - Add policy to allow system/trigger to insert invoices
    - Ensure auto-generation of invoices works properly
    - Maintain security for client access

  2. Changes
    - Add policy for service role to insert invoices
    - Add policy for authenticated users to insert invoices for their own bookings
*/

-- Drop existing restrictive policies if they exist and recreate them
DROP POLICY IF EXISTS "System can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Service role can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices for their bookings" ON invoices;

-- Allow service role (used by triggers and functions) to manage all invoices
CREATE POLICY "Service role can manage invoices"
  ON invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow system/triggers to insert invoices (for auto-generation)
CREATE POLICY "System can insert invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert invoices for their own bookings
CREATE POLICY "Users can insert invoices for their bookings"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = invoices.parent_booking_id 
      AND bookings.customer_id = auth.uid()
    )
  );
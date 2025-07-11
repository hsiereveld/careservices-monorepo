/*
  # Fix missing users table and invoice generation function

  1. New Tables
    - `users` table to mirror auth.users for easier querying
    - Ensure proper relationships exist

  2. Functions
    - Create or replace `generate_invoice_from_booking` function
    - Create or replace `generate_booking_confirmation_installments` function
    - Create or replace `mark_installment_as_paid` function

  3. Security
    - Enable RLS on users table
    - Add appropriate policies
    - Ensure functions have proper permissions
*/

-- Create users table if it doesn't exist (mirrors auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Admins can manage all users" ON users;
  DROP POLICY IF EXISTS "Service role can manage all users" ON users;

  -- Create new policies
  CREATE POLICY "Users can read own data"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Admins can manage all users"
    ON users
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );

  CREATE POLICY "Service role can manage all users"
    ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- Function to sync auth.users with public.users
CREATE OR REPLACE FUNCTION sync_user_to_public()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NEW.created_at, NEW.updated_at)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = EXCLUDED.updated_at;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.users SET
      email = NEW.email,
      updated_at = NEW.updated_at
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync auth.users with public.users
DROP TRIGGER IF EXISTS sync_user_to_public_trigger ON auth.users;
CREATE TRIGGER sync_user_to_public_trigger
  AFTER INSERT OR UPDATE OR DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_to_public();

-- Sync existing auth.users to public.users
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = EXCLUDED.updated_at;

-- Create or replace the generate_invoice_from_booking function
CREATE OR REPLACE FUNCTION generate_invoice_from_booking(p_booking_id uuid)
RETURNS uuid AS $$
DECLARE
  v_invoice_id uuid;
  v_booking_record bookings%ROWTYPE;
  v_service_record services%ROWTYPE;
  v_invoice_number text;
  v_due_date date;
  v_line_total numeric(10,2);
  v_vat_amount numeric(10,2);
  v_net_amount numeric(10,2);
BEGIN
  -- Get booking details
  SELECT * INTO v_booking_record
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found with id: %', p_booking_id;
  END IF;

  -- Get service details
  SELECT * INTO v_service_record
  FROM services
  WHERE id = v_booking_record.service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found with id: %', v_booking_record.service_id;
  END IF;

  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_number_seq')::text, 6, '0');

  -- Calculate due date (30 days from now)
  v_due_date := CURRENT_DATE + INTERVAL '30 days';

  -- Calculate amounts
  v_line_total := COALESCE(v_booking_record.estimated_price, 0);
  v_vat_amount := v_line_total * 0.21; -- 21% VAT
  v_net_amount := v_line_total - v_vat_amount;

  -- Create invoice
  INSERT INTO invoices (
    invoice_number,
    client_id,
    issue_date,
    due_date,
    total_amount,
    vat_amount,
    net_amount,
    status,
    payment_type,
    parent_booking_id
  ) VALUES (
    v_invoice_number,
    v_booking_record.customer_id,
    CURRENT_DATE,
    v_due_date,
    v_line_total,
    v_vat_amount,
    v_net_amount,
    'draft',
    'installment',
    p_booking_id
  ) RETURNING id INTO v_invoice_id;

  -- Create invoice line item
  INSERT INTO invoice_line_items (
    invoice_id,
    booking_id,
    description,
    quantity,
    unit_price,
    vat_rate,
    line_total
  ) VALUES (
    v_invoice_id,
    p_booking_id,
    v_service_record.name || ' - ' || TO_CHAR(v_booking_record.booking_date, 'DD/MM/YYYY'),
    COALESCE(v_booking_record.duration_hours, 1),
    v_line_total / COALESCE(v_booking_record.duration_hours, 1),
    21.0,
    v_line_total
  );

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the generate_booking_confirmation_installments function
CREATE OR REPLACE FUNCTION generate_booking_confirmation_installments(
  p_invoice_id uuid,
  p_booking_date timestamptz
)
RETURNS void AS $$
DECLARE
  v_invoice_record invoices%ROWTYPE;
  v_first_installment_amount numeric(10,2);
  v_second_installment_amount numeric(10,2);
  v_first_due_date timestamptz;
  v_second_due_date timestamptz;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice_record
  FROM invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found with id: %', p_invoice_id;
  END IF;

  -- Calculate installment amounts (50/50 split)
  v_first_installment_amount := v_invoice_record.total_amount * 0.5;
  v_second_installment_amount := v_invoice_record.total_amount - v_first_installment_amount;

  -- Calculate due dates
  -- First installment: 7 days before booking date
  v_first_due_date := p_booking_date - INTERVAL '7 days';
  -- Second installment: 7 days after booking date
  v_second_due_date := p_booking_date + INTERVAL '7 days';

  -- Create first installment (50%)
  INSERT INTO invoice_installments (
    invoice_id,
    installment_number,
    percentage_due,
    amount_due,
    due_date,
    status
  ) VALUES (
    p_invoice_id,
    1,
    50.0,
    v_first_installment_amount,
    v_first_due_date,
    'pending'
  );

  -- Create second installment (50%)
  INSERT INTO invoice_installments (
    invoice_id,
    installment_number,
    percentage_due,
    amount_due,
    due_date,
    status
  ) VALUES (
    p_invoice_id,
    2,
    50.0,
    v_second_installment_amount,
    v_second_due_date,
    'pending'
  );

  -- Update invoice payment type to installment
  UPDATE invoices 
  SET payment_type = 'installment'
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the mark_installment_as_paid function
CREATE OR REPLACE FUNCTION mark_installment_as_paid(
  p_installment_id uuid,
  p_payment_method text DEFAULT 'worldline',
  p_transaction_id text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_installment_record invoice_installments%ROWTYPE;
  v_invoice_id uuid;
BEGIN
  -- Get installment details
  SELECT * INTO v_installment_record
  FROM invoice_installments
  WHERE id = p_installment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Installment not found with id: %', p_installment_id;
  END IF;

  v_invoice_id := v_installment_record.invoice_id;

  -- Mark installment as paid
  UPDATE invoice_installments
  SET 
    status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
  WHERE id = p_installment_id;

  -- Create payment record
  INSERT INTO invoice_payments (
    invoice_id,
    amount,
    payment_date,
    payment_method,
    transaction_id,
    notes
  ) VALUES (
    v_invoice_id,
    v_installment_record.amount_due,
    NOW(),
    p_payment_method,
    p_transaction_id,
    p_notes
  );

  -- Check if all installments are paid and update invoice status
  IF NOT EXISTS (
    SELECT 1 FROM invoice_installments 
    WHERE invoice_id = v_invoice_id AND status != 'paid'
  ) THEN
    UPDATE invoices 
    SET 
      status = 'paid',
      payment_date = NOW(),
      updated_at = NOW()
    WHERE id = v_invoice_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sequence for invoice numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
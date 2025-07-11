-- Add payment_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_payment_type') THEN
    CREATE TYPE invoice_payment_type AS ENUM (
      'full',
      'installment'
    );
  END IF;
END
$$;

-- Add invoice_installment_status enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_installment_status') THEN
    CREATE TYPE invoice_installment_status AS ENUM (
      'pending',
      'paid',
      'overdue',
      'cancelled'
    );
  END IF;
END
$$;

-- Alter invoices table to add new columns
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_type invoice_payment_type NOT NULL DEFAULT 'full',
ADD COLUMN IF NOT EXISTS parent_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;

-- Create invoice_installments table
CREATE TABLE IF NOT EXISTS invoice_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  percentage_due numeric(5,2) NOT NULL,
  amount_due numeric(10,2) NOT NULL,
  due_date timestamptz NOT NULL,
  status invoice_installment_status NOT NULL DEFAULT 'pending',
  payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security for invoice_installments
ALTER TABLE invoice_installments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_installments
-- Admins can manage all invoice installments
CREATE POLICY "Admins can manage all invoice installments"
  ON invoice_installments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- BackOffice can manage all invoice installments
CREATE POLICY "BackOffice can manage all invoice installments"
  ON invoice_installments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
  ));

-- Clients can view their own invoice installments
CREATE POLICY "Clients can view their own invoice installments"
  ON invoice_installments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_installments.invoice_id AND invoices.client_id = auth.uid()
  ));

-- Create trigger to update updated_at column for invoice_installments
CREATE TRIGGER update_invoice_installments_updated_at
BEFORE UPDATE ON invoice_installments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_updated_at_column(); -- Reusing existing update_invoice_updated_at_column function

-- Create indexes for better performance on invoice_installments
CREATE INDEX idx_invoice_installments_invoice_id ON invoice_installments(invoice_id);
CREATE INDEX idx_invoice_installments_due_date ON invoice_installments(due_date);
CREATE INDEX idx_invoice_installments_status ON invoice_installments(status);

-- Create function to generate installments for an invoice
CREATE OR REPLACE FUNCTION generate_invoice_installments(
  p_invoice_id uuid,
  p_first_percentage numeric,
  p_second_percentage numeric,
  p_first_due_date timestamptz,
  p_second_due_date timestamptz
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice record;
  v_total_amount numeric(10,2);
  v_first_amount numeric(10,2);
  v_second_amount numeric(10,2);
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  
  -- Update invoice payment type
  UPDATE invoices
  SET payment_type = 'installment'
  WHERE id = p_invoice_id;
  
  -- Calculate amounts
  v_total_amount := v_invoice.total_amount;
  v_first_amount := (v_total_amount * p_first_percentage / 100)::numeric(10,2);
  v_second_amount := (v_total_amount * p_second_percentage / 100)::numeric(10,2);
  
  -- Create first installment
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
    p_first_percentage,
    v_first_amount,
    p_first_due_date,
    'pending'
  );
  
  -- Create second installment
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
    p_second_percentage,
    v_second_amount,
    p_second_due_date,
    'pending'
  );
END;
$$;

-- Create function to generate standard 50/50 installments for a booking confirmation
CREATE OR REPLACE FUNCTION generate_booking_confirmation_installments(
  p_invoice_id uuid,
  p_booking_date timestamptz
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_confirmation_date timestamptz;
  v_service_date timestamptz;
BEGIN
  -- Set confirmation date to now
  v_confirmation_date := now();
  
  -- Set service date to booking date or 24 hours before if not provided
  v_service_date := COALESCE(p_booking_date, now() + interval '24 hours');
  
  -- If service date is less than 24 hours away, set second installment due date to now
  IF v_service_date - v_confirmation_date < interval '24 hours' THEN
    v_service_date := v_confirmation_date;
  ELSE
    v_service_date := v_service_date - interval '24 hours';
  END IF;
  
  -- Generate installments with 50% due now and 50% due 24 hours before service
  PERFORM generate_invoice_installments(
    p_invoice_id,
    50, -- 50% first installment
    50, -- 50% second installment
    v_confirmation_date, -- First installment due immediately
    v_service_date -- Second installment due 24 hours before service
  );
END;
$$;

-- Create function to mark installment as paid
CREATE OR REPLACE FUNCTION mark_installment_as_paid(
  p_installment_id uuid,
  p_payment_method text,
  p_transaction_id text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_installment record;
  v_invoice_id uuid;
  v_all_paid boolean;
BEGIN
  -- Get installment details
  SELECT * INTO v_installment FROM invoice_installments WHERE id = p_installment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Installment not found';
  END IF;
  
  v_invoice_id := v_installment.invoice_id;
  
  -- Update installment status
  UPDATE invoice_installments
  SET 
    status = 'paid',
    payment_date = now()
  WHERE id = p_installment_id;
  
  -- Create payment record
  INSERT INTO invoice_payments (
    invoice_id,
    amount,
    payment_method,
    transaction_id,
    notes
  ) VALUES (
    v_invoice_id,
    v_installment.amount_due,
    p_payment_method,
    p_transaction_id,
    p_notes
  );
  
  -- Check if all installments are paid
  SELECT 
    NOT EXISTS (
      SELECT 1 
      FROM invoice_installments 
      WHERE invoice_id = v_invoice_id AND status != 'paid'
    )
  INTO v_all_paid;
  
  -- If all installments are paid, mark invoice as paid
  IF v_all_paid THEN
    UPDATE invoices
    SET 
      status = 'paid',
      payment_date = now()
    WHERE id = v_invoice_id;
  END IF;
END;
$$;

-- Create function to check for overdue installments
CREATE OR REPLACE FUNCTION update_overdue_installments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update status to 'overdue' for unpaid installments past their due date
  UPDATE invoice_installments
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < now();
    
  -- Update invoice status to 'overdue' if any installment is overdue
  UPDATE invoices
  SET status = 'overdue'
  WHERE id IN (
    SELECT DISTINCT invoice_id
    FROM invoice_installments
    WHERE status = 'overdue'
  )
  AND status != 'paid';
END;
$$;
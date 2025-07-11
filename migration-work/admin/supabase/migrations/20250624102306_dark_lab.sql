/*
  # Invoice Management System

  1. New Tables
    - `invoices` - Stores invoice header information
    - `invoice_line_items` - Stores individual line items for each invoice
    - `invoice_payments` - Tracks payments made against invoices
    - `invoice_status_history` - Tracks changes to invoice status
  
  2. New Types
    - `invoice_status` - Enum for invoice statuses (draft, sent, paid, overdue, cancelled)
  
  3. Functions
    - `generate_invoice_number()` - Generates sequential invoice numbers with year prefix
    - `calculate_invoice_totals()` - Automatically calculates invoice totals from line items
    - `track_invoice_status_changes()` - Tracks status changes in history table
    - `update_overdue_invoices()` - Marks invoices as overdue when past due date
    - `generate_invoice_from_booking()` - Creates an invoice from a booking
  
  4. Security
    - RLS enabled on all tables
    - Policies for admins, backoffice, and clients
*/

-- Create invoice status enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM (
      'draft',
      'sent',
      'paid',
      'overdue',
      'cancelled'
    );
  END IF;
END
$$;

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  net_amount numeric(10,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  payment_date timestamptz,
  invoice_pdf_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  vat_rate numeric(5,2) NOT NULL DEFAULT 21,
  line_total numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_payments table
CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_method text NOT NULL,
  transaction_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_status_history table
CREATE TABLE IF NOT EXISTS invoice_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  old_status invoice_status,
  new_status invoice_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Admins can manage all invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "BackOffice can manage all invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
  ));

CREATE POLICY "Clients can view their own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Create policies for invoice_line_items
CREATE POLICY "Admins can manage all invoice line items"
  ON invoice_line_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "BackOffice can manage all invoice line items"
  ON invoice_line_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
  ));

CREATE POLICY "Clients can view their own invoice line items"
  ON invoice_line_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_line_items.invoice_id AND invoices.client_id = auth.uid()
  ));

-- Create policies for invoice_payments
CREATE POLICY "Admins can manage all invoice payments"
  ON invoice_payments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "BackOffice can manage all invoice payments"
  ON invoice_payments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
  ));

CREATE POLICY "Clients can view their own invoice payments"
  ON invoice_payments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_payments.invoice_id AND invoices.client_id = auth.uid()
  ));

-- Create policies for invoice_status_history
CREATE POLICY "Admins can manage all invoice status history"
  ON invoice_status_history
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "BackOffice can manage all invoice status history"
  ON invoice_status_history
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
  ));

CREATE POLICY "Clients can view their own invoice status history"
  ON invoice_status_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_status_history.invoice_id AND invoices.client_id = auth.uid()
  ));

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  year_prefix text;
  next_number integer;
  invoice_number text;
BEGIN
  -- Get current year as prefix
  year_prefix := to_char(current_date, 'YYYY');
  
  -- Get the next number in sequence for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS integer)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE year_prefix || '-%';
  
  -- Format the invoice number
  invoice_number := year_prefix || '-' || LPAD(next_number::text, 5, '0');
  
  RETURN invoice_number;
END;
$$;

-- Create function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  net_total numeric(10,2);
  vat_total numeric(10,2);
  grand_total numeric(10,2);
BEGIN
  -- Calculate totals from line items
  SELECT 
    COALESCE(SUM(line_total / (1 + (vat_rate/100))), 0),
    COALESCE(SUM(line_total - (line_total / (1 + (vat_rate/100)))), 0),
    COALESCE(SUM(line_total), 0)
  INTO 
    net_total,
    vat_total,
    grand_total
  FROM invoice_line_items
  WHERE invoice_id = NEW.invoice_id;
  
  -- Update the invoice with calculated totals
  UPDATE invoices
  SET 
    net_amount = net_total,
    vat_amount = vat_total,
    total_amount = grand_total,
    updated_at = now()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for invoice line items to update invoice totals
CREATE TRIGGER update_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_totals();

-- Create function to track invoice status changes
CREATE OR REPLACE FUNCTION track_invoice_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO invoice_status_history (
      invoice_id,
      old_status,
      new_status,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Status updated via admin interface'
    );
    
    -- If status changed to 'paid', update payment_date
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
      NEW.payment_date = COALESCE(NEW.payment_date, now());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for invoice status changes
CREATE TRIGGER track_invoice_status_changes
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION track_invoice_status_changes();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoice_updated_at_column();

CREATE TRIGGER update_invoice_line_items_updated_at
BEFORE UPDATE ON invoice_line_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_updated_at_column();

CREATE TRIGGER update_invoice_payments_updated_at
BEFORE UPDATE ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_booking_id ON invoice_line_items(booking_id);
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_status_history_invoice_id ON invoice_status_history(invoice_id);

-- Create function to check for overdue invoices
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update status to 'overdue' for unpaid invoices past their due date
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE;
END;
$$;

-- Create function to generate invoice from booking
CREATE OR REPLACE FUNCTION generate_invoice_from_booking(booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking record;
  v_invoice_id uuid;
  v_invoice_number text;
  v_due_date date;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking FROM bookings WHERE id = booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Set due date to 14 days from now
  v_due_date := CURRENT_DATE + INTERVAL '14 days';
  
  -- Generate invoice number
  v_invoice_number := generate_invoice_number();
  
  -- Create invoice
  INSERT INTO invoices (
    invoice_number,
    client_id,
    issue_date,
    due_date,
    status,
    notes
  ) VALUES (
    v_invoice_number,
    v_booking.customer_id,
    CURRENT_DATE,
    v_due_date,
    'draft',
    'Automatically generated from booking #' || booking_id
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
  )
  SELECT
    v_invoice_id,
    v_booking.id,
    s.name || ' on ' || v_booking.booking_date,
    COALESCE(v_booking.duration_hours, 1),
    CASE
      WHEN v_booking.final_price IS NOT NULL THEN v_booking.final_price / COALESCE(v_booking.duration_hours, 1)
      ELSE COALESCE(v_booking.estimated_price, 0) / COALESCE(v_booking.duration_hours, 1)
    END,
    21, -- Default VAT rate
    CASE
      WHEN v_booking.final_price IS NOT NULL THEN v_booking.final_price
      ELSE COALESCE(v_booking.estimated_price, 0)
    END
  FROM services s
  WHERE s.id = v_booking.service_id;
  
  RETURN v_invoice_id;
END;
$$;
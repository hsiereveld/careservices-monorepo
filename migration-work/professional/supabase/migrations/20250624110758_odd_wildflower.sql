-- Create payment_transactions table to track Worldline payments
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  installment_id uuid REFERENCES invoice_installments(id) ON DELETE SET NULL,
  payment_provider text NOT NULL DEFAULT 'worldline',
  payment_id text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'initiated',
  payment_method text,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all payment transactions"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "BackOffice can manage all payment transactions"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
  ));

CREATE POLICY "Clients can view their own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = payment_transactions.invoice_id AND invoices.client_id = auth.uid()
  ));

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_installment_id ON payment_transactions(installment_id);
CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Create function to record payment transaction
CREATE OR REPLACE FUNCTION record_payment_transaction(
  p_invoice_id uuid,
  p_installment_id uuid,
  p_payment_id text,
  p_amount numeric,
  p_currency text,
  p_status text,
  p_payment_method text,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id uuid;
BEGIN
  INSERT INTO payment_transactions (
    invoice_id,
    installment_id,
    payment_id,
    amount,
    currency,
    status,
    payment_method,
    error_message,
    metadata
  ) VALUES (
    p_invoice_id,
    p_installment_id,
    p_payment_id,
    p_amount,
    p_currency,
    p_status,
    p_payment_method,
    p_error_message,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Create function to update payment transaction status
CREATE OR REPLACE FUNCTION update_payment_transaction_status(
  p_payment_id text,
  p_status text,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id uuid;
  v_invoice_id uuid;
  v_installment_id uuid;
BEGIN
  -- Get transaction details
  SELECT id, invoice_id, installment_id 
  INTO v_transaction_id, v_invoice_id, v_installment_id
  FROM payment_transactions
  WHERE payment_id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update transaction status
  UPDATE payment_transactions
  SET 
    status = p_status,
    error_message = p_error_message,
    metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb),
    updated_at = now()
  WHERE id = v_transaction_id;
  
  -- If payment is successful, update invoice or installment status
  IF p_status = 'completed' THEN
    IF v_installment_id IS NOT NULL THEN
      -- Mark installment as paid
      PERFORM mark_installment_as_paid(
        v_installment_id,
        'worldline',
        p_payment_id,
        'Paid via Worldline'
      );
    ELSIF v_invoice_id IS NOT NULL THEN
      -- Mark invoice as paid
      UPDATE invoices
      SET 
        status = 'paid',
        payment_date = now()
      WHERE id = v_invoice_id;
      
      -- Create payment record
      INSERT INTO invoice_payments (
        invoice_id,
        amount,
        payment_method,
        transaction_id,
        notes
      ) SELECT
        v_invoice_id,
        amount,
        'worldline',
        payment_id,
        'Paid via Worldline'
      FROM payment_transactions
      WHERE id = v_transaction_id;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;
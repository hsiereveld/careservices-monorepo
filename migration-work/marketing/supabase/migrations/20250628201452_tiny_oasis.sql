/*
  # Payouts Module Implementation

  1. New Tables
    - `payouts`: Stores payout records for professionals
    - `payout_line_items`: Stores individual line items for each payout
  
  2. Security
    - Enable RLS on both tables
    - Add policies for admin and backoffice roles
  
  3. Functions
    - Add function to generate payouts for a specific period
*/

-- Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add constraint to ensure valid status values
  CONSTRAINT payouts_status_check CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled'))
);

-- Create payout_line_items table
CREATE TABLE IF NOT EXISTS public.payout_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  invoice_line_item_id UUID REFERENCES public.invoice_line_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_percentage NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payouts_provider_id ON public.payouts(provider_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_period ON public.payouts(payout_period_start, payout_period_end);
CREATE INDEX IF NOT EXISTS idx_payout_line_items_payout_id ON public.payout_line_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_line_items_booking_id ON public.payout_line_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_payout_line_items_invoice_id ON public.payout_line_items(invoice_id);

-- Enable Row Level Security
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for payouts table
CREATE POLICY "Admins can manage all payouts"
  ON public.payouts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "BackOffice can manage all payouts"
  ON public.payouts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
    )
  );

CREATE POLICY "Professionals can view their own payouts"
  ON public.payouts
  FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM service_providers
      WHERE service_providers.user_id = auth.uid()
    )
  );

-- Create policies for payout_line_items table
CREATE POLICY "Admins can manage all payout line items"
  ON public.payout_line_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "BackOffice can manage all payout line items"
  ON public.payout_line_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
    )
  );

CREATE POLICY "Professionals can view their own payout line items"
  ON public.payout_line_items
  FOR SELECT
  TO authenticated
  USING (
    payout_id IN (
      SELECT id FROM payouts
      WHERE provider_id IN (
        SELECT id FROM service_providers
        WHERE service_providers.user_id = auth.uid()
      )
    )
  );

-- Create trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_payout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_payouts_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION update_payout_updated_at();

CREATE TRIGGER update_payout_line_items_updated_at
BEFORE UPDATE ON public.payout_line_items
FOR EACH ROW
EXECUTE FUNCTION update_payout_updated_at();

-- Create function to generate payouts for a period
CREATE OR REPLACE FUNCTION generate_payouts_for_period(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_id UUID;
  v_payout_id UUID;
  v_total_amount NUMERIC(10,2);
  v_invoice_record RECORD;
  v_line_item_record RECORD;
  v_commission_rate NUMERIC(5,2);
  v_commission_amount NUMERIC(10,2);
  v_provider_amount NUMERIC(10,2);
BEGIN
  -- Loop through each provider that has paid invoices in the period
  FOR v_provider_id IN 
    SELECT DISTINCT sp.id
    FROM service_providers sp
    JOIN bookings b ON b.provider_id = sp.id
    JOIN invoices i ON i.id = (
      SELECT il.invoice_id 
      FROM invoice_line_items il 
      WHERE il.booking_id = b.id 
      LIMIT 1
    )
    WHERE i.status = 'paid'
      AND i.payment_date >= p_start_date
      AND i.payment_date <= p_end_date
  LOOP
    -- Check if a payout already exists for this provider and period
    IF EXISTS (
      SELECT 1 FROM payouts
      WHERE provider_id = v_provider_id
        AND payout_period_start = p_start_date
        AND payout_period_end = p_end_date
    ) THEN
      -- Skip this provider as a payout already exists
      CONTINUE;
    END IF;
    
    -- Create a new payout record
    INSERT INTO payouts (
      provider_id,
      payout_period_start,
      payout_period_end,
      total_amount,
      status,
      notes
    ) VALUES (
      v_provider_id,
      p_start_date,
      p_end_date,
      0, -- Will be updated as we add line items
      'pending',
      'Automatically generated payout for period ' || p_start_date || ' to ' || p_end_date
    ) RETURNING id INTO v_payout_id;
    
    v_total_amount := 0;
    
    -- Find all paid invoices for this provider in the period
    FOR v_invoice_record IN
      SELECT i.id, i.invoice_number, i.payment_date
      FROM invoices i
      JOIN bookings b ON b.id = (
        SELECT booking_id FROM invoice_line_items WHERE invoice_id = i.id LIMIT 1
      )
      WHERE b.provider_id = v_provider_id
        AND i.status = 'paid'
        AND i.payment_date >= p_start_date
        AND i.payment_date <= p_end_date
    LOOP
      -- Process each line item in the invoice
      FOR v_line_item_record IN
        SELECT 
          il.id,
          il.description,
          il.quantity,
          il.unit_price,
          il.line_total,
          il.booking_id,
          COALESCE(ps.commission_rate_override, sc.commission_rate, 15.0) as commission_rate
        FROM invoice_line_items il
        LEFT JOIN bookings b ON b.id = il.booking_id
        LEFT JOIN provider_services ps ON ps.service_id = b.service_id AND ps.provider_id = v_provider_id
        LEFT JOIN services s ON s.id = b.service_id
        LEFT JOIN service_categories sc ON sc.id = s.category_id
        WHERE il.invoice_id = v_invoice_record.id
      LOOP
        -- Calculate commission amount and provider amount
        v_commission_rate := COALESCE(v_line_item_record.commission_rate, 15.0);
        v_commission_amount := (v_line_item_record.line_total * v_commission_rate / 100);
        v_provider_amount := v_line_item_record.line_total - v_commission_amount;
        
        -- Add to total amount
        v_total_amount := v_total_amount + v_provider_amount;
        
        -- Create a payout line item
        INSERT INTO payout_line_items (
          payout_id,
          booking_id,
          invoice_id,
          invoice_line_item_id,
          description,
          amount,
          commission_amount,
          commission_percentage
        ) VALUES (
          v_payout_id,
          v_line_item_record.booking_id,
          v_invoice_record.id,
          v_line_item_record.id,
          'Earnings from Invoice #' || v_invoice_record.invoice_number || ': ' || v_line_item_record.description,
          v_provider_amount,
          v_commission_amount,
          v_commission_rate
        );
      END LOOP;
    END LOOP;
    
    -- Update the total amount in the payout record
    UPDATE payouts
    SET total_amount = v_total_amount
    WHERE id = v_payout_id;
    
    -- Return the payout ID
    RETURN NEXT v_payout_id;
  END LOOP;
  
  RETURN;
END;
$$;

-- Create function to get global admin percentage
CREATE OR REPLACE FUNCTION get_global_admin_percentage()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_percentage NUMERIC(5,2);
BEGIN
  SELECT admin_percentage_default INTO v_percentage
  FROM app_settings
  LIMIT 1;
  
  RETURN COALESCE(v_percentage, 15.0);
END;
$$;

-- Create function to update global admin percentage
CREATE OR REPLACE FUNCTION update_global_admin_percentage(new_percentage NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_settings
  SET admin_percentage_default = new_percentage
  WHERE id IS NOT NULL;
  
  RETURN FOUND;
END;
$$;
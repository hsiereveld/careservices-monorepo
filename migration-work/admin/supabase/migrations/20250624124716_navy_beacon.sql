/*
  # Fix invoice generation function

  1. New Functions
    - `generate_invoice_from_booking(booking_id)` - Creates an invoice from a booking with proper column references
    - `generate_booking_confirmation_installments(invoice_id, booking_date)` - Creates 50/50 payment installments

  2. Security
    - Functions are created with proper security context
    - Only authorized users can call these functions

  3. Changes
    - Fixes ambiguous column reference for invoice_number
    - Ensures proper table aliases are used throughout
    - Creates installment generation function for payment terms
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_invoice_from_booking(uuid);
DROP FUNCTION IF EXISTS generate_booking_confirmation_installments(uuid, timestamptz);
DROP FUNCTION IF EXISTS mark_installment_as_paid(uuid, text, text, text);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    current_year text;
    invoice_count integer;
    new_invoice_number text;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Get count of invoices for current year
    SELECT COUNT(*) + 1 
    INTO invoice_count
    FROM invoices i
    WHERE EXTRACT(YEAR FROM i.issue_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Generate invoice number: YYYY-NNNN
    new_invoice_number := current_year || '-' || LPAD(invoice_count::text, 4, '0');
    
    RETURN new_invoice_number;
END;
$$;

-- Function to generate invoice from booking
CREATE OR REPLACE FUNCTION generate_invoice_from_booking(p_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id uuid;
    v_booking_record record;
    v_service_record record;
    v_pricing_record record;
    v_invoice_number text;
    v_due_date date;
    v_line_total numeric(10,2);
    v_vat_amount numeric(10,2);
    v_net_amount numeric(10,2);
BEGIN
    -- Get booking details
    SELECT b.*, u.email as customer_email
    INTO v_booking_record
    FROM bookings b
    JOIN users u ON u.id = b.customer_id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found: %', p_booking_id;
    END IF;
    
    -- Get service details
    SELECT s.*
    INTO v_service_record
    FROM services s
    WHERE s.id = v_booking_record.service_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found: %', v_booking_record.service_id;
    END IF;
    
    -- Get pricing details (use estimated_price from booking if available)
    IF v_booking_record.estimated_price IS NOT NULL THEN
        v_line_total := v_booking_record.estimated_price;
    ELSE
        -- Fallback to default pricing
        SELECT pt.price, pt.vat_rate
        INTO v_pricing_record
        FROM pricing_tiers pt
        WHERE pt.service_id = v_booking_record.service_id
        AND pt.is_active = true
        ORDER BY pt.price ASC
        LIMIT 1;
        
        IF FOUND THEN
            v_line_total := v_pricing_record.price * COALESCE(v_booking_record.duration_hours, 1);
        ELSE
            v_line_total := 50.00; -- Default fallback price
        END IF;
    END IF;
    
    -- Calculate VAT (21% default)
    v_vat_amount := v_line_total * 0.21;
    v_net_amount := v_line_total - v_vat_amount;
    
    -- Generate invoice number
    v_invoice_number := generate_invoice_number();
    
    -- Set due date (30 days from now)
    v_due_date := CURRENT_DATE + INTERVAL '30 days';
    
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
$$;

-- Function to generate booking confirmation installments (50% now, 50% later)
CREATE OR REPLACE FUNCTION generate_booking_confirmation_installments(
    p_invoice_id uuid,
    p_booking_date timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_record record;
    v_first_installment_amount numeric(10,2);
    v_second_installment_amount numeric(10,2);
    v_second_due_date timestamptz;
BEGIN
    -- Get invoice details
    SELECT inv.*
    INTO v_invoice_record
    FROM invoices inv
    WHERE inv.id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found: %', p_invoice_id;
    END IF;
    
    -- Calculate installment amounts (50/50 split)
    v_first_installment_amount := ROUND(v_invoice_record.total_amount * 0.5, 2);
    v_second_installment_amount := v_invoice_record.total_amount - v_first_installment_amount;
    
    -- Second installment due 7 days before booking date
    v_second_due_date := p_booking_date - INTERVAL '7 days';
    
    -- Create first installment (due immediately)
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
        50.00,
        v_first_installment_amount,
        NOW(),
        'pending'
    );
    
    -- Create second installment (due 7 days before booking)
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
        50.00,
        v_second_installment_amount,
        v_second_due_date,
        'pending'
    );
    
    -- Update invoice payment type
    UPDATE invoices 
    SET payment_type = 'installment'
    WHERE id = p_invoice_id;
END;
$$;

-- Function to mark installment as paid
CREATE OR REPLACE FUNCTION mark_installment_as_paid(
    p_installment_id uuid,
    p_payment_method text DEFAULT 'worldline',
    p_transaction_id text DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_installment_record record;
    v_invoice_id uuid;
    v_all_paid boolean;
BEGIN
    -- Get installment details
    SELECT inst.*
    INTO v_installment_record
    FROM invoice_installments inst
    WHERE inst.id = p_installment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Installment not found: %', p_installment_id;
    END IF;
    
    v_invoice_id := v_installment_record.invoice_id;
    
    -- Mark installment as paid
    UPDATE invoice_installments
    SET 
        status = 'paid',
        payment_date = NOW(),
        updated_at = NOW()
    WHERE id = p_installment_id;
    
    -- Record payment
    INSERT INTO invoice_payments (
        invoice_id,
        amount,
        payment_method,
        transaction_id,
        notes
    ) VALUES (
        v_invoice_id,
        v_installment_record.amount_due,
        p_payment_method,
        p_transaction_id,
        p_notes
    );
    
    -- Check if all installments are paid
    SELECT NOT EXISTS (
        SELECT 1 
        FROM invoice_installments inst2
        WHERE inst2.invoice_id = v_invoice_id 
        AND inst2.status != 'paid'
    ) INTO v_all_paid;
    
    -- If all installments are paid, mark invoice as paid
    IF v_all_paid THEN
        UPDATE invoices
        SET 
            status = 'paid',
            payment_date = NOW(),
            updated_at = NOW()
        WHERE id = v_invoice_id;
    END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_invoice_from_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_booking_confirmation_installments(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_installment_as_paid(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;
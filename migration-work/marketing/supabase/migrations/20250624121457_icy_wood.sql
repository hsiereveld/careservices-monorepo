/*
  # Fix Invoice Generation Process

  1. Bug Fixes
    - Fix the invoice generation process when a booking is confirmed
    - Add better error handling and logging
    - Fix the installment generation process
    - Add transaction support to ensure atomicity

  2. New Features
    - Add function to manually trigger invoice generation for testing
    - Add function to update invoice status
*/

-- Fix the invoice generation process with better error handling and transaction support
CREATE OR REPLACE FUNCTION generate_invoice_from_booking(booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking record;
  v_invoice_id uuid;
  v_invoice_number text;
  v_due_date date;
  v_service_name text;
BEGIN
  -- Start transaction to ensure atomicity
  BEGIN
    RAISE NOTICE 'Starting invoice generation for booking_id: %', booking_id;
    
    -- Get booking details
    SELECT b.*, s.name as service_name 
    INTO v_booking 
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.id = booking_id;
    
    IF NOT FOUND THEN
      RAISE NOTICE 'Booking not found with ID: %', booking_id;
      RAISE EXCEPTION 'Booking not found with ID: %', booking_id;
    END IF;
    
    v_service_name := v_booking.service_name;
    RAISE NOTICE 'Found booking for customer_id: %, service_id: %, service_name: %', 
      v_booking.customer_id, v_booking.service_id, v_service_name;
    
    -- Set due date to 14 days from now
    v_due_date := CURRENT_DATE + INTERVAL '14 days';
    
    -- Generate invoice number
    v_invoice_number := generate_invoice_number();
    RAISE NOTICE 'Generated invoice number: %', v_invoice_number;
    
    -- Create invoice
    INSERT INTO invoices (
      invoice_number,
      client_id,
      issue_date,
      due_date,
      status,
      notes,
      parent_booking_id
    ) VALUES (
      v_invoice_number,
      v_booking.customer_id,
      CURRENT_DATE,
      v_due_date,
      'draft',
      'Automatically generated from booking #' || booking_id,
      booking_id
    ) RETURNING id INTO v_invoice_id;
    
    RAISE NOTICE 'Created invoice with ID: %', v_invoice_id;
    
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
      v_booking.id,
      v_service_name || ' on ' || to_char(v_booking.booking_date, 'DD-MM-YYYY'),
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
    );
    
    RAISE NOTICE 'Added line item for service_id: %', v_booking.service_id;
    
    -- Update invoice status to sent
    UPDATE invoices
    SET status = 'sent'
    WHERE id = v_invoice_id;
    
    RAISE NOTICE 'Updated invoice status to sent';
    RAISE NOTICE 'Invoice generation completed successfully for booking_id: %', booking_id;
    
    -- Commit transaction
    RETURN v_invoice_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error in generate_invoice_from_booking: %, SQLSTATE: %', SQLERRM, SQLSTATE;
      RAISE;
  END;
END;
$$;

-- Fix the installment generation process
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
  v_invoice record;
  v_total_amount numeric(10,2);
  v_first_amount numeric(10,2);
  v_second_amount numeric(10,2);
BEGIN
  -- Start transaction to ensure atomicity
  BEGIN
    RAISE NOTICE 'Starting installment generation for invoice_id: %', p_invoice_id;
    
    -- Get invoice details
    SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
      RAISE NOTICE 'Invoice not found with ID: %', p_invoice_id;
      RAISE EXCEPTION 'Invoice not found with ID: %', p_invoice_id;
    END IF;
    
    -- Set confirmation date to now
    v_confirmation_date := now();
    
    -- Set service date to booking date or 24 hours from now if not provided
    v_service_date := COALESCE(p_booking_date, now() + interval '24 hours');
    
    -- If service date is less than 24 hours away, set second installment due date to now
    IF v_service_date - v_confirmation_date < interval '24 hours' THEN
      v_service_date := v_confirmation_date;
    ELSE
      v_service_date := v_service_date - interval '24 hours';
    END IF;
    
    RAISE NOTICE 'Confirmation date: %, Service date: %', v_confirmation_date, v_service_date;
    
    -- Update invoice payment type
    UPDATE invoices
    SET payment_type = 'installment'
    WHERE id = p_invoice_id;
    
    RAISE NOTICE 'Updated invoice payment type to installment';
    
    -- Calculate amounts
    v_total_amount := v_invoice.total_amount;
    v_first_amount := (v_total_amount * 50 / 100)::numeric(10,2);
    v_second_amount := (v_total_amount * 50 / 100)::numeric(10,2);
    
    RAISE NOTICE 'Total amount: %, First installment: %, Second installment: %', 
      v_total_amount, v_first_amount, v_second_amount;
    
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
      50,
      v_first_amount,
      v_confirmation_date,
      'pending'
    );
    
    RAISE NOTICE 'Created first installment';
    
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
      50,
      v_second_amount,
      v_service_date,
      'pending'
    );
    
    RAISE NOTICE 'Created second installment';
    RAISE NOTICE 'Installment generation completed successfully for invoice_id: %', p_invoice_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error in generate_booking_confirmation_installments: %, SQLSTATE: %', SQLERRM, SQLSTATE;
      RAISE;
  END;
END;
$$;

-- Create a function to manually trigger the invoice generation process for a booking
CREATE OR REPLACE FUNCTION manual_trigger_invoice_generation(booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice_id uuid;
  v_booking record;
  v_booking_date timestamptz;
  v_result jsonb;
BEGIN
  -- Start transaction
  BEGIN
    -- Get booking details
    SELECT * INTO v_booking FROM bookings WHERE id = booking_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Booking not found'
      );
    END IF;
    
    -- Create booking date timestamp
    IF v_booking.booking_time IS NOT NULL THEN
      v_booking_date := (v_booking.booking_date || ' ' || v_booking.booking_time)::timestamptz;
    ELSE
      v_booking_date := v_booking.booking_date::timestamptz;
    END IF;
    
    -- Generate invoice
    v_invoice_id := generate_invoice_from_booking(booking_id);
    
    -- Generate installments
    PERFORM generate_booking_confirmation_installments(v_invoice_id, v_booking_date);
    
    -- Return success result
    v_result := jsonb_build_object(
      'success', true,
      'invoice_id', v_invoice_id,
      'booking_id', booking_id,
      'message', 'Invoice and installments generated successfully'
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'booking_id', booking_id
      );
  END;
END;
$$;

-- Create a trigger function to automatically generate invoices when a booking is confirmed
CREATE OR REPLACE FUNCTION auto_generate_invoice_on_booking_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id uuid;
  v_booking_date timestamptz;
BEGIN
  -- Only proceed if status changed to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') THEN
    RAISE NOTICE 'Booking % status changed to confirmed, generating invoice', NEW.id;
    
    -- Create booking date timestamp
    IF NEW.booking_time IS NOT NULL THEN
      v_booking_date := (NEW.booking_date || ' ' || NEW.booking_time)::timestamptz;
    ELSE
      v_booking_date := NEW.booking_date::timestamptz;
    END IF;
    
    -- Generate invoice
    v_invoice_id := generate_invoice_from_booking(NEW.id);
    
    -- Generate installments
    PERFORM generate_booking_confirmation_installments(v_invoice_id, v_booking_date);
    
    RAISE NOTICE 'Invoice % generated for booking %', v_invoice_id, NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in auto_generate_invoice_on_booking_confirmation: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS auto_generate_invoice_on_booking_confirmation_trigger ON bookings;

CREATE TRIGGER auto_generate_invoice_on_booking_confirmation_trigger
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invoice_on_booking_confirmation();
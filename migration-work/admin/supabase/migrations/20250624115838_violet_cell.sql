/*
  # Debug Invoice Generation Process

  1. Changes
     - Add detailed logging to the generate_invoice_from_booking function
     - Improve error handling with EXCEPTION block
     - Add more RAISE NOTICE statements to track execution flow

  2. Purpose
     - Identify why invoices aren't being generated when bookings are confirmed
     - Provide visibility into the function execution process
     - Capture any errors that might be occurring silently
*/

-- Enhanced version of generate_invoice_from_booking with better logging
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
  RAISE NOTICE 'Starting invoice generation for booking_id: %', booking_id;
  
  -- Get booking details
  SELECT * INTO v_booking FROM bookings WHERE id = booking_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Booking not found with ID: %', booking_id;
    RAISE EXCEPTION 'Booking not found with ID: %', booking_id;
  END IF;
  
  RAISE NOTICE 'Found booking for customer_id: %, service_id: %', v_booking.customer_id, v_booking.service_id;
  
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
    notes
  ) VALUES (
    v_invoice_number,
    v_booking.customer_id,
    CURRENT_DATE,
    v_due_date,
    'draft',
    'Automatically generated from booking #' || booking_id
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
  
  RAISE NOTICE 'Added line item for service_id: %', v_booking.service_id;
  RAISE NOTICE 'Invoice generation completed successfully for booking_id: %', booking_id;
  
  RETURN v_invoice_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in generate_invoice_from_booking: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;
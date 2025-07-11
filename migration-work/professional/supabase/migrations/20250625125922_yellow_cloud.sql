/*
  # Update Auto Generate Invoice Function

  1. Changes
    - Updates the auto_generate_invoice_on_booking_confirmation function to use the get_effective_commission_rate function
    - This ensures that the correct commission rate is applied when generating invoices
  
  2. Security
    - No changes to security, function remains as SECURITY DEFINER
*/

-- Update the function to use get_effective_commission_rate
CREATE OR REPLACE FUNCTION public.auto_generate_invoice_on_booking_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_due_date DATE;
  v_service_name TEXT;
  v_provider_id UUID;
  v_provider_service_id UUID;
  v_effective_commission_rate NUMERIC(5,2);
BEGIN
  -- Only proceed if status changed to 'confirmed'
  IF (NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed')) THEN
    -- Get the service name
    SELECT name INTO v_service_name
    FROM services
    WHERE id = NEW.service_id;
    
    -- Get the provider_service_id for this booking
    SELECT id INTO v_provider_service_id
    FROM provider_services
    WHERE provider_id = NEW.provider_id AND service_id = NEW.service_id
    LIMIT 1;
    
    -- Get the effective commission rate for this provider service
    IF v_provider_service_id IS NOT NULL THEN
      SELECT get_effective_commission_rate(v_provider_service_id) INTO v_effective_commission_rate;
    ELSE
      -- Fallback to default if no provider_service found
      SELECT admin_percentage_default INTO v_effective_commission_rate
      FROM app_settings
      LIMIT 1;
      
      -- If still null, use 15.0 as default
      IF v_effective_commission_rate IS NULL THEN
        v_effective_commission_rate := 15.0;
      END IF;
    END IF;
    
    -- Generate invoice number (simple format: INV-YYYYMMDD-XXXX)
    v_invoice_number := 'INV-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                        substring(replace(NEW.id::text, '-', ''), 1, 4);
    
    -- Set due date (30 days from now)
    v_due_date := CURRENT_DATE + INTERVAL '30 days';
    
    -- Create invoice
    INSERT INTO invoices (
      invoice_number,
      client_id,
      issue_date,
      due_date,
      status,
      parent_booking_id
    ) VALUES (
      v_invoice_number,
      NEW.customer_id,
      CURRENT_DATE,
      v_due_date,
      'draft',
      NEW.id
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
      NEW.id,
      COALESCE(v_service_name, 'Service') || ' - ' || to_char(NEW.booking_date, 'DD-MM-YYYY'),
      COALESCE(NEW.duration_hours, 1),
      COALESCE(NEW.estimated_price, 0) / NULLIF(COALESCE(NEW.duration_hours, 1), 0),
      21, -- Default VAT rate
      COALESCE(NEW.estimated_price, 0)
    );
    
    -- Update invoice status to sent
    UPDATE invoices
    SET status = 'sent'
    WHERE id = v_invoice_id;
    
    -- Add status history entry
    INSERT INTO invoice_status_history (
      invoice_id,
      old_status,
      new_status,
      change_reason
    ) VALUES (
      v_invoice_id,
      'draft',
      'sent',
      'Auto-generated on booking confirmation'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add comment to explain the function
COMMENT ON FUNCTION public.auto_generate_invoice_on_booking_confirmation() IS 'Automatically generates an invoice when a booking status is changed to confirmed. Uses the effective commission rate based on the provider service.';
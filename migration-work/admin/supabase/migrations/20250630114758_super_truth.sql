/*
  # Fix Invoice Unit Price Calculation

  1. Changes
     - Fix the auto_generate_invoice_on_booking_confirmation function to correctly set the unit_price
     - Ensure unit_price is properly calculated from the booking's pricing information
     - Add support for different price units (per_hour, per_service, etc.)
*/

-- Fix the auto_generate_invoice_on_booking_confirmation function to correctly set the unit_price
CREATE OR REPLACE FUNCTION public.auto_generate_invoice_on_booking_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_due_date DATE;
  v_booking_date DATE;
  v_service_name TEXT;
  v_provider_id UUID;
  v_provider_service_id UUID;
  v_commission_rate NUMERIC(5,2);
  v_unit_price NUMERIC(10,2);
  v_quantity NUMERIC(10,2);
  v_line_total NUMERIC(10,2);
  v_vat_rate NUMERIC(5,2) := 21.0; -- Default VAT rate
  v_price_unit TEXT;
  v_custom_price NUMERIC(10,2);
BEGIN
  -- Only proceed if status is changing to 'confirmed'
  IF (NEW.status = 'confirmed' AND OLD.status != 'confirmed') THEN
    -- Get the booking date
    v_booking_date := COALESCE(NEW.booking_start_date, NEW.booking_date);
    
    -- Set due date to 14 days from booking date
    v_due_date := v_booking_date + INTERVAL '14 days';
    
    -- Generate invoice number (format: INV-YYYYMMDD-XXXX)
    v_invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                        LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
    
    -- Get service name
    SELECT name INTO v_service_name FROM services WHERE id = NEW.service_id;
    
    -- Get provider service record if available
    SELECT id INTO v_provider_service_id 
    FROM provider_services 
    WHERE provider_id = NEW.provider_id AND service_id = NEW.service_id;
    
    -- Determine commission rate (use override if available, otherwise use category rate)
    IF v_provider_service_id IS NOT NULL THEN
      SELECT 
        commission_rate_override,
        custom_price,
        custom_price_unit
      INTO 
        v_commission_rate,
        v_custom_price,
        v_price_unit
      FROM provider_services 
      WHERE id = v_provider_service_id;
      
      -- If no override, get category commission rate
      IF v_commission_rate IS NULL THEN
        SELECT sc.commission_rate INTO v_commission_rate
        FROM services s
        JOIN service_categories sc ON s.category_id = sc.id
        WHERE s.id = NEW.service_id;
      END IF;
    ELSE
      -- Get category commission rate directly
      SELECT sc.commission_rate INTO v_commission_rate
      FROM services s
      JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.id = NEW.service_id;
    END IF;
    
    -- Default commission rate if still null
    v_commission_rate := COALESCE(v_commission_rate, 15.0);
    
    -- Determine unit price and quantity based on price unit
    IF v_provider_service_id IS NOT NULL AND v_custom_price IS NOT NULL THEN
      -- Use provider's custom price
      v_unit_price := v_custom_price;
      
      -- Determine quantity based on price unit
      IF v_price_unit = 'per_hour' THEN
        v_quantity := COALESCE(NEW.duration_hours, 1);
      ELSIF v_price_unit = 'per_day' THEN
        v_quantity := COALESCE(NEW.duration_days, 1);
      ELSE
        -- For per_service, per_item, etc.
        v_quantity := 1;
      END IF;
    ELSE
      -- Get price from pricing tier
      SELECT 
        pt.price,
        pt.price_unit
      INTO 
        v_unit_price,
        v_price_unit
      FROM pricing_tiers pt
      WHERE pt.service_id = NEW.service_id
      ORDER BY pt.price ASC
      LIMIT 1;
      
      -- Default values if no pricing tier found
      v_unit_price := COALESCE(v_unit_price, NEW.estimated_price);
      v_price_unit := COALESCE(v_price_unit, 'per_hour');
      
      -- Determine quantity based on price unit
      IF v_price_unit = 'per_hour' THEN
        v_quantity := COALESCE(NEW.duration_hours, 1);
      ELSIF v_price_unit = 'per_day' THEN
        v_quantity := COALESCE(NEW.duration_days, 1);
      ELSE
        -- For per_service, per_item, etc.
        v_quantity := 1;
      END IF;
    END IF;
    
    -- Calculate line total
    v_line_total := v_unit_price * v_quantity;
    
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
      NEW.customer_id,
      CURRENT_DATE,
      v_due_date,
      0, -- Will be calculated by trigger
      0, -- Will be calculated by trigger
      0, -- Will be calculated by trigger
      'draft',
      'full',
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
      COALESCE(v_service_name, 'Service') || ' on ' || TO_CHAR(v_booking_date, 'DD-MM-YYYY'),
      v_quantity,
      v_unit_price,
      v_vat_rate,
      v_line_total
    );
    
    -- Update invoice status to sent
    UPDATE invoices SET status = 'sent' WHERE id = v_invoice_id;
    
    -- Add status history entry
    INSERT INTO invoice_status_history (
      invoice_id,
      old_status,
      new_status,
      changed_by,
      change_reason
    ) VALUES (
      v_invoice_id,
      'draft',
      'sent',
      NEW.provider_id,
      'Automatically sent upon booking confirmation'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
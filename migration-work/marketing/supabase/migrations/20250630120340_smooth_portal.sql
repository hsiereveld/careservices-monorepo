/*
  # Fix Invoice Unit Price Calculation

  1. Changes
     - Updates the auto_generate_invoice_on_booking_confirmation function to correctly handle different price units
     - Ensures the invoice line item shows the actual price per unit (day, hour, service, etc.) that the customer expects to see
     - Improves the description to clearly show the quantity and unit type
     - Fixes the calculation of professional earnings based on commission rate

  2. Security
     - No changes to RLS policies
*/

-- Fix the auto_generate_invoice_on_booking_confirmation function to correctly set the unit price
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
  v_vat_rate NUMERIC(5,2) := 21.0; -- Default VAT rate
  v_price_unit TEXT;
  v_custom_price NUMERIC(10,2);
  v_quantity NUMERIC(10,2);
  v_unit_price NUMERIC(10,2);
  v_line_total NUMERIC(10,2);
  v_unit_label TEXT;
  v_selling_price NUMERIC(10,2);
  v_net_price NUMERIC(10,2);
  v_vat_amount NUMERIC(10,2);
  v_admin_fee NUMERIC(10,2);
  v_professional_price NUMERIC(10,2);
  v_description TEXT;
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
    
    -- Determine price unit and base price
    IF v_provider_service_id IS NOT NULL AND v_custom_price IS NOT NULL THEN
      -- Use provider's custom price and unit
      v_professional_price := v_custom_price;
      v_price_unit := COALESCE(v_price_unit, 'per_hour');
    ELSE
      -- Get price from pricing tier
      SELECT 
        pt.price,
        pt.price_unit
      INTO 
        v_professional_price,
        v_price_unit
      FROM pricing_tiers pt
      WHERE pt.service_id = NEW.service_id
      ORDER BY pt.price ASC
      LIMIT 1;
      
      -- Default values if no pricing tier found
      v_professional_price := COALESCE(v_professional_price, 0);
      v_price_unit := COALESCE(v_price_unit, 'per_hour');
    END IF;
    
    -- Determine quantity and unit label based on price unit
    IF v_price_unit = 'per_hour' THEN
      v_quantity := COALESCE(NEW.duration_hours, 1);
      v_unit_label := 'uur';
    ELSIF v_price_unit = 'per_day' THEN
      v_quantity := COALESCE(NEW.duration_days, 1);
      v_unit_label := 'dag(en)';
    ELSIF v_price_unit = 'per_km' THEN
      v_quantity := COALESCE(NEW.duration_hours, 1); -- Use duration_hours as a proxy for distance
      v_unit_label := 'km';
    ELSIF v_price_unit = 'per_item' THEN
      v_quantity := 1; -- Default to 1 item
      v_unit_label := 'stuk';
    ELSIF v_price_unit = 'per_month' THEN
      v_quantity := 1; -- Default to 1 month
      v_unit_label := 'maand';
    ELSIF v_price_unit = 'per_week' THEN
      v_quantity := 1; -- Default to 1 week
      v_unit_label := 'week';
    ELSE
      -- For per_service or any other unit
      v_quantity := 1;
      v_unit_label := 'service';
    END IF;
    
    -- Set unit price to the professional's price
    v_unit_price := v_professional_price;
    
    -- Calculate line total (professional's total earning)
    v_line_total := v_professional_price * v_quantity;
    
    -- Calculate admin fee
    v_admin_fee := v_line_total * (v_commission_rate / 100.0);
    
    -- Calculate net price (line total + admin fee)
    v_net_price := v_line_total + v_admin_fee;
    
    -- Calculate VAT amount
    v_vat_amount := v_net_price * (v_vat_rate / 100.0);
    
    -- Calculate selling price (what the customer pays)
    v_selling_price := v_net_price + v_vat_amount;
    
    -- Create a descriptive line item description
    v_description := COALESCE(v_service_name, 'Service') || ' op ' || TO_CHAR(v_booking_date, 'DD-MM-YYYY');
    IF v_quantity > 1 THEN
      v_description := v_description || ' (' || v_quantity || ' ' || v_unit_label || ')';
    ELSE
      v_description := v_description || ' (' || v_unit_label || ')';
    END IF;
    
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
      v_selling_price, -- Set the calculated selling price
      v_vat_amount,    -- Set the calculated VAT amount
      v_net_price,     -- Set the calculated net price
      'draft',
      'full',
      NEW.id
    ) RETURNING id INTO v_invoice_id;
    
    -- Create invoice line item with improved description
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
      v_description,
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
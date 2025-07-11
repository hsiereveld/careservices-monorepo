-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS auto_generate_invoice_on_booking_confirmation_trigger ON bookings;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS auto_generate_invoice_on_booking_confirmation();

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION auto_generate_invoice_on_booking_confirmation()
RETURNS TRIGGER
SECURITY DEFINER -- This allows the function to execute with elevated privileges
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    invoice_number_val text;
    commission_rate_val numeric(5,2);
    service_name_val text;
    provider_name_val text;
    booking_price numeric(10,2);
    net_amount_val numeric(10,2);
    vat_amount_val numeric(10,2);
    total_amount_val numeric(10,2);
    vat_rate_val numeric(5,2) := 21.0; -- Default VAT rate
BEGIN
    -- Only proceed if status changed to 'confirmed' and we don't already have an invoice
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        -- Check if invoice already exists for this booking
        IF EXISTS (
            SELECT 1 FROM invoices 
            WHERE parent_booking_id = NEW.id
        ) THEN
            RETURN NEW;
        END IF;

        -- Get service name
        SELECT s.name INTO service_name_val
        FROM services s
        WHERE s.id = NEW.service_id;

        -- Get provider business name
        SELECT COALESCE(sp.business_name, p.first_name || ' ' || p.last_name, 'Unknown Provider')
        INTO provider_name_val
        FROM service_providers sp
        LEFT JOIN profiles p ON sp.user_id = p.id
        WHERE sp.id = NEW.provider_id;

        -- Get the effective commission rate
        SELECT COALESCE(
            ps.commission_rate_override,
            sc.commission_rate,
            15.0 -- Default fallback
        ) INTO commission_rate_val
        FROM provider_services ps
        LEFT JOIN services s ON ps.service_id = s.id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        WHERE ps.provider_id = NEW.provider_id 
        AND ps.service_id = NEW.service_id;

        -- Use final_price if available, otherwise estimated_price
        booking_price := COALESCE(NEW.final_price, NEW.estimated_price, 0);

        -- Calculate amounts
        total_amount_val := booking_price;
        vat_amount_val := total_amount_val * (vat_rate_val / 100);
        net_amount_val := total_amount_val - vat_amount_val;

        -- Generate unique invoice number
        invoice_number_val := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                             LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || '-' || 
                             LPAD(EXTRACT(HOUR FROM NOW())::text, 2, '0') || 
                             LPAD(EXTRACT(MINUTE FROM NOW())::text, 2, '0') || 
                             LPAD(EXTRACT(SECOND FROM NOW())::text, 2, '0');

        -- Ensure invoice number is unique
        WHILE EXISTS (SELECT 1 FROM invoices WHERE invoice_number = invoice_number_val) LOOP
            invoice_number_val := invoice_number_val || '-' || FLOOR(RANDOM() * 1000)::text;
        END LOOP;

        -- Insert invoice with proper error handling
        BEGIN
            INSERT INTO invoices (
                invoice_number,
                client_id,
                issue_date,
                due_date,
                total_amount,
                vat_amount,
                net_amount,
                status,
                parent_booking_id
            ) VALUES (
                invoice_number_val,
                NEW.customer_id,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '30 days',
                total_amount_val,
                vat_amount_val,
                net_amount_val,
                'draft',
                NEW.id
            );

            -- Insert invoice line item
            INSERT INTO invoice_line_items (
                invoice_id,
                booking_id,
                description,
                quantity,
                unit_price,
                vat_rate,
                line_total
            ) VALUES (
                (SELECT id FROM invoices WHERE invoice_number = invoice_number_val),
                NEW.id,
                COALESCE(service_name_val, 'Service') || ' - ' || COALESCE(provider_name_val, 'Provider'),
                NEW.duration_hours,
                booking_price / GREATEST(NEW.duration_hours, 1),
                vat_rate_val,
                booking_price
            );

        EXCEPTION
            WHEN OTHERS THEN
                -- Log the error but don't fail the booking update
                RAISE WARNING 'Failed to create invoice for booking %: %', NEW.id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER auto_generate_invoice_on_booking_confirmation_trigger
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_invoice_on_booking_confirmation();
/*
  # Update Booking Duration Calculation Function

  1. Changes
    - Improves the booking duration calculation to properly handle start and end dates/times
    - Adds support for calculating duration_hours and duration_days
    - Handles cases where end date/time is missing by using default values
    - Adds validation to prevent end time from being before start time

  2. Security
    - No security changes
*/

-- Drop the existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS calculate_booking_duration_trigger ON public.bookings;

-- Update the function with improved logic
CREATE OR REPLACE FUNCTION public.calculate_booking_duration()
RETURNS TRIGGER AS $$
DECLARE
    start_datetime TIMESTAMP;
    end_datetime TIMESTAMP;
    duration_interval INTERVAL;
    total_seconds NUMERIC;
BEGIN
    -- Combine start date and time into a TIMESTAMP
    IF NEW.booking_start_date IS NOT NULL AND NEW.booking_start_time IS NOT NULL THEN
        start_datetime := NEW.booking_start_date::TIMESTAMP + NEW.booking_start_time::INTERVAL;
    ELSIF NEW.booking_date IS NOT NULL AND NEW.booking_time IS NOT NULL THEN
        -- Fallback to booking_date and booking_time if start fields are not set
        start_datetime := NEW.booking_date::TIMESTAMP + NEW.booking_time::INTERVAL;
    ELSE
        -- If no valid start date/time, use current values and don't change anything
        RETURN NEW;
    END IF;

    -- Check if end date and time are provided
    IF NEW.booking_end_date IS NOT NULL AND NEW.booking_end_time IS NOT NULL THEN
        -- Combine end date and time into a TIMESTAMP
        end_datetime := NEW.booking_end_date::TIMESTAMP + NEW.booking_end_time::INTERVAL;
        
        -- Ensure end time is not before start time
        IF end_datetime < start_datetime THEN
            RAISE EXCEPTION 'End date/time (%) cannot be before start date/time (%)', end_datetime, start_datetime;
        END IF;

        -- Calculate the time interval
        duration_interval := end_datetime - start_datetime;
        total_seconds := EXTRACT(EPOCH FROM duration_interval);

        -- Calculate duration in hours (rounded to 2 decimal places)
        NEW.duration_hours := ROUND(total_seconds / 3600.0, 2);

        -- Calculate duration in days (floor to get whole days)
        NEW.duration_days := FLOOR(total_seconds / (3600.0 * 24));
    ELSE
        -- If end date/time is missing, use default duration of 1 hour
        NEW.duration_hours := COALESCE(NEW.duration_hours, 1.0);
        NEW.duration_days := COALESCE(NEW.duration_days, 0);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger
CREATE TRIGGER calculate_booking_duration_trigger
BEFORE INSERT OR UPDATE OF booking_start_date, booking_start_time, booking_end_date, booking_end_time, booking_date, booking_time, duration_hours ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_booking_duration();

-- Add a comment to the function
COMMENT ON FUNCTION public.calculate_booking_duration() IS 'Calculates booking duration in hours and days based on start and end dates/times';
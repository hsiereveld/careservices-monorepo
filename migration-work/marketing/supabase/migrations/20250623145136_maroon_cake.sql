/*
  # Alter duration_hours column type

  1. Changes
    - Modify `duration_hours` column in `bookings` table from numeric(4,2) to numeric(6,2)
    - This allows storing larger duration values (up to 9999.99 hours)
    - Maintains 2 decimal places precision
  
  2. Implementation Details
    - Drop the trigger that depends on the column first
    - Alter the column type
    - Recreate the trigger
*/

-- First, drop the trigger that depends on the duration_hours column
DROP TRIGGER IF EXISTS calculate_booking_duration_trigger ON public.bookings;

-- Now alter the duration_hours column to use numeric(6,2) type
ALTER TABLE public.bookings
ALTER COLUMN duration_hours TYPE numeric(6,2);

-- Add a comment explaining the column
COMMENT ON COLUMN public.bookings.duration_hours IS 'Duration of the booking in hours, with 2 decimal places. Can store values up to 9999.99 hours.';

-- Recreate the trigger
CREATE TRIGGER calculate_booking_duration_trigger
BEFORE INSERT OR UPDATE OF booking_start_date, booking_start_time, booking_end_date, booking_end_time, booking_date, booking_time, duration_hours
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_booking_duration();
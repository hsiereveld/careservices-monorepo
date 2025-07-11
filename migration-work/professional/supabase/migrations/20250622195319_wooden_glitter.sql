/*
  # Alter bookings and pricing_tiers tables

  1. Changes to bookings table:
    - Add `booking_start_date` (date)
    - Add `booking_start_time` (time)
    - Add `booking_end_date` (date)
    - Add `booking_end_time` (time)
    - Add `duration_days` (integer)
    - Add `subscription_id` (uuid, foreign key to user_subscriptions)
    - Add `discount_id` (uuid, foreign key to discounts)
    - Add `bundle_id` (uuid, foreign key to service_bundles)
    - Add `discount_amount` (numeric)
    - Add `subscription_hours_used` (numeric)
    - Add `is_recurring` (boolean)
    - Add `recurrence_pattern` (text)
    - Add `recurrence_end_date` (date)
    - Add `parent_booking_id` (uuid, self-reference)
  
  2. Changes to pricing_tiers table:
    - Add `cost_price` (numeric)
    - Add `admin_percentage` (numeric)
    - Add `vat_rate` (numeric)
    - Add `margin_percentage` (numeric)
*/

-- Alter bookings table to add new fields
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_start_date date,
ADD COLUMN IF NOT EXISTS booking_start_time time,
ADD COLUMN IF NOT EXISTS booking_end_date date,
ADD COLUMN IF NOT EXISTS booking_end_time time,
ADD COLUMN IF NOT EXISTS duration_days integer,
ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_id uuid REFERENCES discounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS bundle_id uuid REFERENCES service_bundles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS subscription_hours_used numeric(10,2),
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_end_date date,
ADD COLUMN IF NOT EXISTS parent_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_bookings_booking_start_date ON bookings(booking_start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_subscription_id ON bookings(subscription_id);
CREATE INDEX IF NOT EXISTS idx_bookings_discount_id ON bookings(discount_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bundle_id ON bookings(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parent_booking_id ON bookings(parent_booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_is_recurring ON bookings(is_recurring);

-- Migrate existing data to new fields
UPDATE bookings
SET 
  booking_start_date = booking_date,
  booking_start_time = booking_time::time,
  booking_end_date = booking_date,
  booking_end_time = (booking_time::time + (duration_hours * interval '1 hour'))::time,
  duration_days = CASE 
    WHEN duration_hours >= 8 THEN CEIL(duration_hours / 8)::integer
    ELSE 0
  END
WHERE booking_start_date IS NULL;

-- Alter pricing_tiers table to add new fields
ALTER TABLE pricing_tiers
ADD COLUMN IF NOT EXISTS cost_price numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_percentage numeric(5,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) DEFAULT 21.0,
ADD COLUMN IF NOT EXISTS margin_percentage numeric(5,2);

-- Create function to calculate booking duration in days and hours
CREATE OR REPLACE FUNCTION calculate_booking_duration()
RETURNS TRIGGER AS $$
DECLARE
  start_timestamp timestamp;
  end_timestamp timestamp;
  duration_hours_calc numeric;
  max_hours_per_day constant integer := 8;
BEGIN
  -- Create timestamps from date and time
  start_timestamp := (NEW.booking_start_date || ' ' || NEW.booking_start_time)::timestamp;
  
  -- If end date/time are provided, use them
  IF NEW.booking_end_date IS NOT NULL AND NEW.booking_end_time IS NOT NULL THEN
    end_timestamp := (NEW.booking_end_date || ' ' || NEW.booking_end_time)::timestamp;
  -- Otherwise, use the duration_hours to calculate end time
  ELSIF NEW.duration_hours IS NOT NULL THEN
    end_timestamp := start_timestamp + (NEW.duration_hours * interval '1 hour');
    -- Set the end date and time
    NEW.booking_end_date := end_timestamp::date;
    NEW.booking_end_time := end_timestamp::time;
  ELSE
    -- Default to 1 hour if no duration or end time is specified
    end_timestamp := start_timestamp + interval '1 hour';
    NEW.booking_end_date := end_timestamp::date;
    NEW.booking_end_time := end_timestamp::time;
    NEW.duration_hours := 1;
  END IF;
  
  -- Calculate duration in hours
  duration_hours_calc := EXTRACT(EPOCH FROM (end_timestamp - start_timestamp)) / 3600;
  
  -- If duration_hours wasn't explicitly set, set it now
  IF NEW.duration_hours IS NULL THEN
    NEW.duration_hours := duration_hours_calc;
  END IF;
  
  -- Calculate duration in days, capping at max_hours_per_day per day
  IF duration_hours_calc > max_hours_per_day THEN
    NEW.duration_days := CEIL(duration_hours_calc / max_hours_per_day)::integer;
  ELSE
    NEW.duration_days := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calculating booking duration
CREATE TRIGGER calculate_booking_duration_trigger
BEFORE INSERT OR UPDATE OF booking_start_date, booking_start_time, booking_end_date, booking_end_time, duration_hours
ON bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_booking_duration();

-- Create function to calculate margin percentage for pricing tiers
CREATE OR REPLACE FUNCTION calculate_pricing_tier_margin()
RETURNS TRIGGER AS $$
DECLARE
  net_price numeric;
  admin_fee numeric;
  profit numeric;
BEGIN
  -- Only calculate if we have price and cost_price
  IF NEW.price IS NOT NULL AND NEW.cost_price IS NOT NULL AND NEW.cost_price > 0 THEN
    -- Calculate net price (price without VAT)
    net_price := NEW.price / (1 + (NEW.vat_rate / 100));
    
    -- Calculate admin fee
    admin_fee := net_price * (NEW.admin_percentage / 100);
    
    -- Calculate profit
    profit := net_price - admin_fee - NEW.cost_price;
    
    -- Calculate margin percentage
    NEW.margin_percentage := (profit / NEW.cost_price) * 100;
  ELSE
    NEW.margin_percentage := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calculating margin percentage
CREATE TRIGGER calculate_pricing_tier_margin_trigger
BEFORE INSERT OR UPDATE OF price, cost_price, vat_rate, admin_percentage
ON pricing_tiers
FOR EACH ROW
EXECUTE FUNCTION calculate_pricing_tier_margin();
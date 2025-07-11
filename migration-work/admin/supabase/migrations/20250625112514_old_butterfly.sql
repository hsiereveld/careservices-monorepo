/*
  # Availability System Refinements

  1. New Tables
    - `provider_availability_slots` - Stores specific time slots for providers
    - `provider_blocked_dates` - Stores dates when providers are unavailable
  
  2. Changes
    - Enhance `provider_availability` table with more granular time slots
    - Add new columns to support different availability types
  
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for providers to manage their availability
*/

-- Enhance provider_availability table with more granular time slots
ALTER TABLE public.provider_availability 
ADD COLUMN IF NOT EXISTS start_time TIME WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIME WITHOUT TIME ZONE;

-- Add availability type column to distinguish between different types of availability
ALTER TABLE public.provider_availability 
ADD COLUMN IF NOT EXISTS availability_type TEXT DEFAULT 'general' CHECK (availability_type IN ('general', 'specific', 'blocked'));

-- Create a new table for specific date-based availability slots
CREATE TABLE IF NOT EXISTS public.provider_availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  slot_type TEXT NOT NULL DEFAULT 'regular' CHECK (slot_type IN ('regular', 'custom', 'holiday')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a new table for blocked dates (vacations, holidays, etc.)
CREATE TABLE IF NOT EXISTS public.provider_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('yearly', 'monthly', 'weekly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_provider_availability_slots_provider_id ON public.provider_availability_slots(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_slots_date ON public.provider_availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_provider_blocked_dates_provider_id ON public.provider_blocked_dates(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_blocked_dates_date_range ON public.provider_blocked_dates(start_date, end_date);

-- Enable RLS on new tables
ALTER TABLE public.provider_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_availability_slots
CREATE POLICY "Providers can manage own availability slots" 
ON public.provider_availability_slots
FOR ALL
TO authenticated
USING (provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
))
WITH CHECK (provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all availability slots" 
ON public.provider_availability_slots
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

CREATE POLICY "BackOffice can manage all availability slots" 
ON public.provider_availability_slots
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
));

CREATE POLICY "Anyone can read available slots" 
ON public.provider_availability_slots
FOR SELECT
TO authenticated
USING (is_available = true);

-- Create policies for provider_blocked_dates
CREATE POLICY "Providers can manage own blocked dates" 
ON public.provider_blocked_dates
FOR ALL
TO authenticated
USING (provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
))
WITH CHECK (provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all blocked dates" 
ON public.provider_blocked_dates
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

CREATE POLICY "BackOffice can manage all blocked dates" 
ON public.provider_blocked_dates
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
));

-- Create function to check provider availability
CREATE OR REPLACE FUNCTION public.check_provider_availability(
  p_provider_id UUID,
  p_start_datetime TIMESTAMP WITH TIME ZONE,
  p_end_datetime TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_date DATE;
  v_is_available BOOLEAN := FALSE;
  v_has_booking BOOLEAN := FALSE;
BEGIN
  -- Extract day of week, time and date from start datetime
  v_day_of_week := EXTRACT(DOW FROM p_start_datetime);
  v_start_time := p_start_datetime::TIME;
  v_end_time := p_end_datetime::TIME;
  v_date := p_start_datetime::DATE;
  
  -- Check if provider is generally available on this day and time
  SELECT EXISTS (
    SELECT 1 FROM public.provider_availability
    WHERE provider_id = p_provider_id
      AND day_of_week = v_day_of_week
      AND is_active = TRUE
      AND (
        -- Check if time slot matches
        (time_slot = 'morning' AND v_start_time >= '08:00:00' AND v_end_time <= '12:00:00') OR
        (time_slot = 'afternoon' AND v_start_time >= '12:00:00' AND v_end_time <= '17:00:00') OR
        (time_slot = 'evening' AND v_start_time >= '17:00:00' AND v_end_time <= '21:00:00') OR
        -- Or check if specific time range matches
        (start_time IS NOT NULL AND end_time IS NOT NULL AND 
         v_start_time >= start_time AND v_end_time <= end_time)
      )
  ) INTO v_is_available;
  
  -- If not generally available, check for specific availability slots
  IF NOT v_is_available THEN
    SELECT EXISTS (
      SELECT 1 FROM public.provider_availability_slots
      WHERE provider_id = p_provider_id
        AND date = v_date
        AND is_available = TRUE
        AND v_start_time >= start_time
        AND v_end_time <= end_time
    ) INTO v_is_available;
  END IF;
  
  -- If available, check if there are any blocked dates
  IF v_is_available THEN
    SELECT EXISTS (
      SELECT 1 FROM public.provider_blocked_dates
      WHERE provider_id = p_provider_id
        AND v_date BETWEEN start_date AND end_date
    ) INTO v_has_booking;
    
    -- If blocked date exists, provider is not available
    IF v_has_booking THEN
      v_is_available := FALSE;
    END IF;
  END IF;
  
  -- If available, check if there are any existing bookings
  IF v_is_available THEN
    SELECT EXISTS (
      SELECT 1 FROM public.bookings
      WHERE provider_id = p_provider_id
        AND status IN ('confirmed', 'in_progress')
        AND (
          -- Check if booking overlaps with requested time
          (booking_start_date IS NOT NULL AND booking_start_time IS NOT NULL AND
           booking_end_date IS NOT NULL AND booking_end_time IS NOT NULL AND
           (p_start_datetime, p_end_datetime) OVERLAPS (
             booking_start_date + booking_start_time,
             booking_end_date + booking_end_time
           )
          ) OR
          -- For backward compatibility with old booking format
          (booking_date = v_date AND
           (booking_time::TIME, booking_time::TIME + (duration_hours * INTERVAL '1 hour')) OVERLAPS
           (v_start_time, v_end_time)
          )
        )
    ) INTO v_has_booking;
    
    -- If booking exists, provider is not available
    IF v_has_booking THEN
      v_is_available := FALSE;
    END IF;
  END IF;
  
  RETURN v_is_available;
END;
$$;

-- Create function to create a booking with availability check
CREATE OR REPLACE FUNCTION public.create_booking_with_availability_check(
  p_customer_id UUID,
  p_provider_id UUID,
  p_service_id UUID,
  p_start_datetime TIMESTAMP WITH TIME ZONE,
  p_end_datetime TIMESTAMP WITH TIME ZONE,
  p_customer_notes TEXT DEFAULT NULL,
  p_customer_address TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_urgency TEXT DEFAULT 'normal'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_available BOOLEAN;
  v_booking_id UUID;
  v_duration_hours NUMERIC;
BEGIN
  -- Check if provider is available
  SELECT public.check_provider_availability(
    p_provider_id, 
    p_start_datetime, 
    p_end_datetime
  ) INTO v_is_available;
  
  -- If not available, raise exception
  IF NOT v_is_available THEN
    RAISE EXCEPTION 'Provider is not available at the requested time';
  END IF;
  
  -- Calculate duration in hours
  v_duration_hours := EXTRACT(EPOCH FROM (p_end_datetime - p_start_datetime)) / 3600;
  
  -- Create booking
  INSERT INTO public.bookings (
    customer_id,
    provider_id,
    service_id,
    booking_date,
    booking_time,
    booking_start_date,
    booking_start_time,
    booking_end_date,
    booking_end_time,
    duration_hours,
    status,
    urgency,
    customer_notes,
    customer_address,
    customer_phone
  ) VALUES (
    p_customer_id,
    p_provider_id,
    p_service_id,
    p_start_datetime::DATE,
    p_start_datetime::TIME::TEXT,
    p_start_datetime::DATE,
    p_start_datetime::TIME::TEXT,
    p_end_datetime::DATE,
    p_end_datetime::TIME::TEXT,
    v_duration_hours,
    'pending',
    p_urgency,
    p_customer_notes,
    p_customer_address,
    p_customer_phone
  ) RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$$;

-- Create trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_provider_availability_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_availability_slots_updated_at
BEFORE UPDATE ON public.provider_availability_slots
FOR EACH ROW
EXECUTE FUNCTION update_provider_availability_slots_updated_at();

-- Create trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_provider_blocked_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_blocked_dates_updated_at
BEFORE UPDATE ON public.provider_blocked_dates
FOR EACH ROW
EXECUTE FUNCTION update_provider_blocked_dates_updated_at();
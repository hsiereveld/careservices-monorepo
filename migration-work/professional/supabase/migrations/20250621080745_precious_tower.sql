/*
  # Complete Booking System Implementation

  1. New Tables
    - `service_providers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `business_name` (text, optional)
      - `description` (text)
      - `phone` (text)
      - `email` (text)
      - `address` (text)
      - `city` (text, default 'Pinoso')
      - `postal_code` (text)
      - `service_radius_km` (integer, default 15)
      - `hourly_rate` (numeric)
      - `is_active` (boolean, default true)
      - `is_verified` (boolean, default false)
      - `rating_average` (numeric, default 0)
      - `total_reviews` (integer, default 0)
      - `total_bookings` (integer, default 0)
      - `joined_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `provider_services`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to service_providers)
      - `service_id` (uuid, foreign key to services)
      - `custom_price` (numeric, optional)
      - `is_available` (boolean, default true)
      - `created_at` (timestamptz)

    - `bookings`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to auth.users)
      - `provider_id` (uuid, foreign key to service_providers)
      - `service_id` (uuid, foreign key to services)
      - `booking_date` (date)
      - `booking_time` (time)
      - `duration_hours` (numeric, default 1.0)
      - `estimated_price` (numeric)
      - `final_price` (numeric)
      - `status` (booking_status enum, default 'pending')
      - `urgency` (urgency_level enum, default 'normal')
      - `customer_notes` (text)
      - `special_requirements` (text)
      - `customer_address` (text)
      - `customer_phone` (text)
      - `provider_notes` (text)
      - `provider_arrival_time` (timestamptz)
      - `provider_completion_time` (timestamptz)
      - `requested_at` (timestamptz)
      - `confirmed_at` (timestamptz)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `cancelled_at` (timestamptz)
      - `cancellation_reason` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `booking_status_history`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key to bookings)
      - `old_status` (booking_status enum)
      - `new_status` (booking_status enum)
      - `changed_by` (uuid, foreign key to auth.users)
      - `change_reason` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `booking_reviews`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key to bookings)
      - `customer_id` (uuid, foreign key to auth.users)
      - `provider_id` (uuid, foreign key to service_providers)
      - `rating` (integer, 1-5)
      - `review_text` (text)
      - `would_recommend` (boolean, default true)
      - `punctuality_rating` (integer, 1-5)
      - `quality_rating` (integer, 1-5)
      - `communication_rating` (integer, 1-5)
      - `is_public` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for customers, providers, and admins
    - Proper access control for booking workflow

  3. Functions & Triggers
    - Automatic status history tracking
    - Provider statistics updates
    - Updated_at timestamp triggers
*/

-- Create booking statuses enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM (
      'pending',
      'confirmed', 
      'in_progress',
      'completed',
      'cancelled',
      'rescheduled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create urgency levels enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM (
      'normal',
      'urgent',
      'flexible'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Service Providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  description text DEFAULT '',
  phone text,
  email text,
  address text,
  city text DEFAULT 'Pinoso',
  postal_code text,
  service_radius_km integer DEFAULT 15,
  hourly_rate numeric(10,2),
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  rating_average numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Provider Services junction table
CREATE TABLE IF NOT EXISTS provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  custom_price numeric(10,2),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, service_id)
);

-- Main Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES service_providers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  
  -- Booking details
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  duration_hours numeric(4,2) DEFAULT 1.0,
  estimated_price numeric(10,2),
  final_price numeric(10,2),
  
  -- Status and workflow
  status booking_status DEFAULT 'pending',
  urgency urgency_level DEFAULT 'normal',
  
  -- Customer information
  customer_notes text DEFAULT '',
  special_requirements text DEFAULT '',
  customer_address text,
  customer_phone text,
  
  -- Provider information
  provider_notes text DEFAULT '',
  provider_arrival_time timestamptz,
  provider_completion_time timestamptz,
  
  -- Timestamps
  requested_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Booking Status History table
CREATE TABLE IF NOT EXISTS booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  old_status booking_status,
  new_status booking_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  change_reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Booking Reviews table
CREATE TABLE IF NOT EXISTS booking_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  would_recommend boolean DEFAULT true,
  
  -- Review categories
  punctuality_rating integer CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(booking_id, customer_id)
);

-- Enable RLS on all tables
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist before creating new ones

-- Service Providers Policies
DROP POLICY IF EXISTS "Providers can manage own profile" ON service_providers;
DROP POLICY IF EXISTS "Anyone can read active providers" ON service_providers;
DROP POLICY IF EXISTS "Admins can manage all providers" ON service_providers;

CREATE POLICY "Providers can manage own profile"
  ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read active providers"
  ON service_providers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all providers"
  ON service_providers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Provider Services Policies
DROP POLICY IF EXISTS "Providers can manage own services" ON provider_services;
DROP POLICY IF EXISTS "Anyone can read available provider services" ON provider_services;

CREATE POLICY "Providers can manage own services"
  ON provider_services
  FOR ALL
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read available provider services"
  ON provider_services
  FOR SELECT
  TO authenticated
  USING (is_available = true);

-- Bookings Policies
DROP POLICY IF EXISTS "Customers can manage own bookings" ON bookings;
DROP POLICY IF EXISTS "Providers can read assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Providers can update assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

CREATE POLICY "Customers can manage own bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Providers can read assigned bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update assigned bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Booking Status History Policies
DROP POLICY IF EXISTS "Users can read booking status history" ON booking_status_history;
DROP POLICY IF EXISTS "System can insert status history" ON booking_status_history;

CREATE POLICY "Users can read booking status history"
  ON booking_status_history
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE customer_id = auth.uid() 
      OR provider_id IN (
        SELECT id FROM service_providers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert status history"
  ON booking_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Booking Reviews Policies
DROP POLICY IF EXISTS "Customers can manage own reviews" ON booking_reviews;
DROP POLICY IF EXISTS "Anyone can read public reviews" ON booking_reviews;
DROP POLICY IF EXISTS "Providers can read reviews about them" ON booking_reviews;

CREATE POLICY "Customers can manage own reviews"
  ON booking_reviews
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Anyone can read public reviews"
  ON booking_reviews
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Providers can read reviews about them"
  ON booking_reviews
  FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_active ON service_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_service_providers_city ON service_providers(city);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider_id ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_service_id ON provider_services(service_id);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id ON booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reviews_booking_id ON booking_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reviews_provider_id ON booking_reviews(provider_id);

-- Triggers for updated_at (only create if function doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist and recreate them
DROP TRIGGER IF EXISTS update_service_providers_updated_at ON service_providers;
CREATE TRIGGER update_service_providers_updated_at
    BEFORE UPDATE ON service_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_reviews_updated_at ON booking_reviews;
CREATE TRIGGER update_booking_reviews_updated_at
    BEFORE UPDATE ON booking_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create status history when booking status changes
CREATE OR REPLACE FUNCTION track_booking_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by,
      change_reason,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'Booking confirmed by provider'
        WHEN NEW.status = 'in_progress' THEN 'Service started'
        WHEN NEW.status = 'completed' THEN 'Service completed'
        WHEN NEW.status = 'cancelled' THEN 'Booking cancelled'
        WHEN NEW.status = 'rescheduled' THEN 'Booking rescheduled'
        ELSE 'Status updated'
      END,
      NEW.provider_notes
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS track_booking_status_changes_trigger ON bookings;
CREATE TRIGGER track_booking_status_changes_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION track_booking_status_changes();

-- Function to update provider statistics when reviews are added
CREATE OR REPLACE FUNCTION update_provider_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update provider rating and review count
  UPDATE service_providers 
  SET 
    rating_average = (
      SELECT AVG(rating)::numeric(3,2) 
      FROM booking_reviews 
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM booking_reviews 
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = now()
  WHERE id = NEW.provider_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_provider_stats_trigger ON booking_reviews;
CREATE TRIGGER update_provider_stats_trigger
    AFTER INSERT OR UPDATE ON booking_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_stats();
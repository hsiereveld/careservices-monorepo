# 🗄️ Database Schema - Care & Service Platform

> **Complete database architecture for the multi-tenant Care & Service marketplace platform**

## 📋 **Overview**

Het Care & Service platform gebruikt een geavanceerde multi-tenant database architectuur die franchise operaties ondersteunt met een modulaire app-gebaseerde structuur. De database is ontworpen voor schaalbaarheid, veiligheid en prestaties.

---

## 🏗️ **DATABASE ARCHITECTURE**

### **Platform Type**
- **Service Marketplace** voor zorg- en dienstverlening in Spanje
- **Multi-tenant franchise** model met regionale isolatie
- **Multi-app ecosystem** (`careservice.es`, `my.`, `book.`, `pro.`, `admin.`)
- **Commission-based** revenue model
- **Role-based access** (Customer, Professional, Admin, Franchise Owner)

### **Technology Stack**
- **Database**: Supabase PostgreSQL 15+
- **Authentication**: Supabase Auth (JWT, MFA, Social Login)
- **Real-time**: Supabase Subscriptions
- **Payment**: Mollie API integration
- **Location**: Europe (Madrid timezone)
- **Currency**: EUR (European Euro)

---

## 📊 **CORE DATABASE SCHEMA**

### **🔐 Authentication & Identity**
```sql
-- Supabase Auth Schema (Built-in)
auth.users                    -- Core user authentication
auth.sessions                 -- Session management  
auth.mfa_factors             -- Multi-factor authentication
auth.identities              -- Social login providers
auth.refresh_tokens          -- JWT refresh tokens

-- Application User Extensions
public.profiles              -- Extended user profiles
public.user_roles           -- Role-based access control
public.service_providers    -- Professional provider details
```

#### **Profiles Table Structure**
```sql
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  franchise_id uuid REFERENCES franchises(id),
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  phone varchar(20),
  date_of_birth date,
  address text,
  city varchar(100),
  postal_code varchar(10),
  country varchar(2) DEFAULT 'ES',
  user_type varchar(20) CHECK (user_type IN ('customer', 'professional')),
  preferred_language varchar(2) DEFAULT 'nl',
  profile_image_url text,
  is_active boolean DEFAULT true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### **User Roles & Permissions**
```sql
CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role varchar(20) NOT NULL CHECK (role IN (
    'customer', 'professional', 'admin', 'backoffice', 
    'franchise_owner', 'franchise_manager'
  )),
  is_primary_role boolean DEFAULT false,
  assigned_by uuid REFERENCES profiles(id),
  assigned_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  UNIQUE(user_id, role)
);
```

### **🏢 Multi-Tenant Franchise System**
```sql
CREATE TABLE public.franchises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain varchar(50) UNIQUE NOT NULL, -- pinoso, costablanca, valencia
  name varchar(200) NOT NULL,
  region varchar(100) NOT NULL,
  country varchar(2) DEFAULT 'ES',
  commission_rate decimal(5,2) DEFAULT 15.00,
  platform_fee decimal(5,2) DEFAULT 5.00,
  service_radius_km integer DEFAULT 25,
  timezone varchar(50) DEFAULT 'Europe/Madrid',
  currency varchar(3) DEFAULT 'EUR',
  domain_config jsonb, -- Custom domain settings per app
  contact_email varchar(255),
  contact_phone varchar(20),
  address text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Regional service customization
CREATE TABLE public.franchise_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id uuid REFERENCES franchises(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  is_available boolean DEFAULT true,
  custom_name varchar(200),
  custom_description text,
  local_commission_rate decimal(5,2),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(franchise_id, service_id)
);
```

### **🛍️ Service Management**
```sql
CREATE TABLE public.service_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(200) NOT NULL,
  description text,
  icon varchar(50),
  color_scheme varchar(7), -- Hex color code
  image_url text,
  sort_order integer DEFAULT 0,
  commission_rate decimal(5,2) DEFAULT 15.00,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES service_categories(id),
  name varchar(200) NOT NULL,
  description text,
  base_price decimal(10,2),
  price_unit varchar(20) DEFAULT 'per_hour' CHECK (price_unit IN (
    'per_hour', 'per_service', 'per_day', 'per_project', 'per_km'
  )),
  default_duration_minutes integer DEFAULT 60,
  commission_rate decimal(5,2),
  minimum_advance_hours integer DEFAULT 24,
  maximum_advance_days integer DEFAULT 90,
  requires_approval boolean DEFAULT false,
  service_image_url text,
  tags text[], -- Array of service tags
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Advanced pricing tiers per service
CREATE TABLE public.pricing_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  tier_name varchar(100) NOT NULL, -- "Basic", "Premium", "Enterprise"
  description text,
  price decimal(10,2) NOT NULL,
  price_unit varchar(20) DEFAULT 'per_hour',
  duration_minutes integer,
  included_features text[],
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
```

### **👨‍💼 Professional Service Providers**
```sql
CREATE TABLE public.service_providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  franchise_id uuid REFERENCES franchises(id),
  business_name varchar(200),
  business_registration varchar(100), -- KvK number, CIF, etc.
  vat_number varchar(50),
  hourly_rate decimal(10,2),
  service_radius_km integer DEFAULT 15,
  average_rating decimal(3,2) DEFAULT 0.00,
  total_reviews integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  years_experience integer,
  description text,
  specializations text[],
  certifications text[],
  languages varchar(10)[] DEFAULT ARRAY['nl'],
  availability_schedule jsonb, -- Weekly schedule
  emergency_available boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Junction table: Provider ↔ Services
CREATE TABLE public.provider_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  custom_price decimal(10,2),
  custom_price_unit varchar(20),
  commission_rate_override decimal(5,2),
  is_available boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(provider_id, service_id)
);
```

### **📅 Booking & Scheduling System**
```sql
CREATE TABLE public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id uuid REFERENCES franchises(id),
  customer_id uuid REFERENCES profiles(id),
  provider_id uuid REFERENCES service_providers(id),
  service_id uuid REFERENCES services(id),
  
  -- Booking details
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  duration_minutes integer,
  
  -- Location
  service_address text NOT NULL,
  service_city varchar(100),
  service_postal_code varchar(10),
  service_coordinates point, -- PostGIS coordinates
  
  -- Pricing
  base_price decimal(10,2) NOT NULL,
  additional_fees decimal(10,2) DEFAULT 0.00,
  discount_amount decimal(10,2) DEFAULT 0.00,
  total_price decimal(10,2) NOT NULL,
  commission_amount decimal(10,2),
  platform_fee decimal(10,2),
  
  -- Status & metadata
  status varchar(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'in_progress', 'completed', 
    'cancelled', 'no_show', 'refunded'
  )),
  special_requirements text,
  internal_notes text,
  app_source varchar(50), -- book.careservice.es, my.careservice.es
  
  -- Timestamps
  confirmed_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Booking status history for audit trail
CREATE TABLE public.booking_status_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  from_status varchar(20),
  to_status varchar(20) NOT NULL,
  changed_by uuid REFERENCES profiles(id),
  reason text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

### **⭐ Reviews & Rating System**
```sql
CREATE TABLE public.booking_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  customer_id uuid REFERENCES profiles(id),
  provider_id uuid REFERENCES service_providers(id),
  
  -- Ratings (1-5 scale)
  overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
  punctuality_rating integer CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Review content
  review_text text,
  would_recommend boolean,
  is_public boolean DEFAULT true,
  
  -- Provider response
  provider_response text,
  provider_responded_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- General reviews (not tied to specific booking)
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid REFERENCES service_providers(id),
  customer_id uuid REFERENCES profiles(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_verified boolean DEFAULT false,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
```

### **💰 Financial System**

#### **Payments & Transactions**
```sql
CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id),
  customer_id uuid REFERENCES profiles(id),
  
  -- Payment details
  amount decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'EUR',
  payment_method varchar(50), -- ideal, bancontact, creditcard
  
  -- External payment provider
  external_payment_id varchar(255), -- Mollie payment ID
  external_transaction_id varchar(255),
  payment_url text, -- Mollie checkout URL
  
  -- Status tracking
  status varchar(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'failed', 
    'cancelled', 'refunded', 'expired'
  )),
  
  -- Timestamps
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Detailed payment tracking
CREATE TABLE public.payment_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  transaction_type varchar(20) CHECK (transaction_type IN (
    'charge', 'refund', 'chargeback', 'fee'
  )),
  amount decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'EUR',
  external_transaction_id varchar(255),
  gateway_response jsonb,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

#### **Provider Payouts**
```sql
CREATE TABLE public.payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid REFERENCES service_providers(id),
  franchise_id uuid REFERENCES franchises(id),
  
  -- Payout period
  payout_period_start date NOT NULL,
  payout_period_end date NOT NULL,
  
  -- Financial details
  total_amount decimal(10,2) NOT NULL,
  commission_deducted decimal(10,2) NOT NULL,
  platform_fee_deducted decimal(10,2) NOT NULL,
  net_amount decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'EUR',
  
  -- Payment details
  payment_method varchar(50), -- bank_transfer, paypal
  bank_account_iban varchar(34),
  bank_account_name varchar(200),
  
  -- Status
  status varchar(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'failed', 'cancelled'
  )),
  
  -- External reference
  external_payout_id varchar(255),
  
  -- Timestamps
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payout_line_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id uuid REFERENCES payouts(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id),
  service_amount decimal(10,2) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  platform_fee_amount decimal(10,2) NOT NULL,
  net_amount decimal(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

### **📊 Availability Management**
```sql
CREATE TABLE public.provider_availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(provider_id, day_of_week, start_time)
);

CREATE TABLE public.provider_blocked_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  start_time time,
  end_time time,
  reason varchar(200),
  is_recurring boolean DEFAULT false,
  recurrence_pattern varchar(50), -- weekly, monthly, yearly
  created_at timestamp with time zone DEFAULT now()
);

-- Specific time slots for booking
CREATE TABLE public.provider_availability_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  available_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_booked boolean DEFAULT false,
  booking_id uuid REFERENCES bookings(id),
  created_at timestamp with time zone DEFAULT now()
);
```

### **⚙️ Platform Configuration**
```sql
CREATE TABLE public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key varchar(100) UNIQUE NOT NULL,
  value text,
  value_type varchar(20) DEFAULT 'string' CHECK (value_type IN (
    'string', 'number', 'boolean', 'json'
  )),
  description text,
  is_public boolean DEFAULT false, -- Can be accessed by frontend
  category varchar(50),
  updated_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Platform content management
CREATE TABLE public.content_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug varchar(100) UNIQUE NOT NULL,
  title varchar(200) NOT NULL,
  content text,
  meta_description varchar(160),
  meta_keywords text,
  is_published boolean DEFAULT false,
  language varchar(2) DEFAULT 'nl',
  app_context varchar(20), -- marketing, my, book, pro, admin
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

---

## 🔗 **CRITICAL RELATIONSHIPS & DATA FLOW**

### **User Identity Chain**
```
auth.users (id) 
  ↓ 1:1 EXTENDS
profiles (id = auth.users.id, franchise_id)
  ↓ 1:many
user_roles (user_id, role)
  ↓ 0:1 IF professional
service_providers (user_id, franchise_id)
  ↓ many:many VIA
provider_services (provider_id, service_id)
```

### **Service Discovery Chain**
```
franchises (id, subdomain)
  ↓ 1:many
service_categories (id, commission_rate)
  ↓ 1:many
services (category_id, base_price)
  ↓ many:many VIA
provider_services (service_id, provider_id, custom_price)
  ↓ many:1
service_providers (id, franchise_id, hourly_rate)
```

### **Booking Lifecycle Flow**
```
Customer Request
  ↓
bookings (customer_id, provider_id, service_id, status='pending')
  ↓ TRIGGERS
booking_status_history (booking_id, to_status='pending')
  ↓ PAYMENT
payments (booking_id, amount, status='pending')
  ↓ ON SUCCESS
bookings.status = 'confirmed'
  ↓ AFTER COMPLETION
booking_reviews (booking_id, rating, review_text)
  ↓ PAYOUT CALCULATION
payout_line_items (payout_id, booking_id, net_amount)
```

### **Financial Flow**
```
Booking → Payment → Commission Split
   ↓         ↓           ↓
Total    Customer    Platform (5%)
Price      Pays      Franchise (15%)
   ↓         ↓        Professional (80%)
   ↓    payment_      payout_line_
   ↓   transactions      items
   ↓         ↓           ↓
Booking   Payment    Provider
Status   Tracking    Payouts
```

---

## 🔐 **SECURITY & ACCESS CONTROL**

### **Row Level Security (RLS) Policies**

#### **Multi-App Context Security**
```sql
-- Set app context for RLS
CREATE OR REPLACE FUNCTION set_app_context(app_name text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_app', app_name, true);
END;
$$ LANGUAGE plpgsql;

-- Customer app access (my.careservice.es)
CREATE POLICY "customer_app_bookings" ON bookings
  FOR ALL USING (
    customer_id = auth.uid() AND 
    current_setting('app.current_app', true) = 'my.careservice.es'
  );

-- Professional app access (pro.careservice.es)
CREATE POLICY "professional_app_bookings" ON bookings
  FOR ALL USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    ) AND current_setting('app.current_app', true) = 'pro.careservice.es'
  );

-- Admin app access (admin.careservice.es)
CREATE POLICY "admin_app_full_access" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'backoffice', 'franchise_owner')
    ) AND current_setting('app.current_app', true) = 'admin.careservice.es'
  );
```

#### **Franchise Data Isolation**
```sql
-- Get user's franchise
CREATE OR REPLACE FUNCTION get_user_franchise_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT franchise_id 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Franchise isolation for all franchise-aware tables
CREATE POLICY "franchise_isolation_profiles" ON profiles
  FOR ALL USING (
    franchise_id = get_user_franchise_id() OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'backoffice')
    )
  );

CREATE POLICY "franchise_isolation_bookings" ON bookings
  FOR ALL USING (
    franchise_id = get_user_franchise_id() OR
    customer_id = auth.uid() OR
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );
```

#### **Role-Based Access Policies**
```sql
-- Professional data access
CREATE POLICY "professional_own_data" ON service_providers
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'franchise_owner')
    )
  );

-- Customer payment access
CREATE POLICY "customer_own_payments" ON payments
  FOR ALL USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'backoffice')
    )
  );
```

### **Data Validation & Constraints**
```sql
-- Spanish phone number validation
ALTER TABLE profiles ADD CONSTRAINT valid_spanish_phone 
  CHECK (phone ~ '^(\+34|0034|34)?[6-9][0-9]{8}$' OR phone IS NULL);

-- Email validation
ALTER TABLE profiles ADD CONSTRAINT valid_email 
  CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Service radius constraints
ALTER TABLE service_providers ADD CONSTRAINT valid_service_radius 
  CHECK (service_radius_km >= 1 AND service_radius_km <= 100);

-- Rating constraints
ALTER TABLE booking_reviews ADD CONSTRAINT valid_ratings 
  CHECK (
    overall_rating >= 1 AND overall_rating <= 5 AND
    punctuality_rating >= 1 AND punctuality_rating <= 5 AND
    quality_rating >= 1 AND quality_rating <= 5 AND
    communication_rating >= 1 AND communication_rating <= 5
  );

-- Price validation
ALTER TABLE bookings ADD CONSTRAINT valid_pricing 
  CHECK (
    base_price >= 0 AND 
    total_price >= 0 AND 
    total_price >= base_price
  );
```

---

## 🚀 **PERFORMANCE OPTIMIZATION**

### **Essential Database Indexes**
```sql
-- User & Authentication
CREATE INDEX idx_profiles_franchise_user_type ON profiles(franchise_id, user_type);
CREATE INDEX idx_user_roles_user_role ON user_roles(user_id, role) WHERE is_primary_role = true;
CREATE INDEX idx_service_providers_franchise_active ON service_providers(franchise_id, is_active);

-- Service Discovery
CREATE INDEX idx_services_category_active ON services(category_id, is_active);
CREATE INDEX idx_provider_services_provider_available ON provider_services(provider_id, is_available);
CREATE INDEX idx_provider_services_service_available ON provider_services(service_id, is_available);

-- Booking Queries
CREATE INDEX idx_bookings_customer_date ON bookings(customer_id, booking_date DESC);
CREATE INDEX idx_bookings_provider_date ON bookings(provider_id, booking_date DESC);
CREATE INDEX idx_bookings_franchise_status ON bookings(franchise_id, status, booking_date);
CREATE INDEX idx_bookings_app_source ON bookings(app_source, created_at);

-- Financial Queries
CREATE INDEX idx_payments_booking_status ON payments(booking_id, status);
CREATE INDEX idx_payments_customer_date ON payments(customer_id, created_at DESC);
CREATE INDEX idx_payouts_provider_period ON payouts(provider_id, payout_period_start, payout_period_end);

-- Review Lookups
CREATE INDEX idx_booking_reviews_provider_rating ON booking_reviews(provider_id, overall_rating) WHERE is_public = true;
CREATE INDEX idx_reviews_provider_public ON reviews(provider_id, created_at DESC) WHERE is_public = true;

-- Geographic Queries (if using PostGIS)
CREATE INDEX idx_bookings_service_location ON bookings USING GIST(service_coordinates);

-- Full-text Search
CREATE INDEX idx_services_search ON services USING GIN(to_tsvector('dutch', name || ' ' || description));
CREATE INDEX idx_providers_search ON service_providers USING GIN(to_tsvector('dutch', business_name || ' ' || description));
```

### **Database Functions for Business Logic**

#### **Price Calculation Function**
```sql
CREATE OR REPLACE FUNCTION calculate_booking_price(
  p_service_id uuid,
  p_provider_id uuid,
  p_duration_hours decimal DEFAULT 1.0,
  p_tier_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  base_price decimal(10,2);
  commission_rate decimal(5,2);
  platform_fee decimal(5,2);
  franchise_rate decimal(5,2);
  result jsonb;
BEGIN
  -- Get effective price (priority: custom > tier > base)
  SELECT 
    COALESCE(ps.custom_price, pt.price, s.base_price, sc.commission_rate * 20) as price,
    COALESCE(ps.commission_rate_override, s.commission_rate, sc.commission_rate) as comm_rate,
    f.platform_fee,
    f.commission_rate as franch_rate
  INTO base_price, commission_rate, platform_fee, franchise_rate
  FROM services s
  JOIN service_categories sc ON s.category_id = sc.id
  JOIN service_providers sp ON sp.id = p_provider_id
  JOIN franchises f ON sp.franchise_id = f.id
  LEFT JOIN provider_services ps ON ps.service_id = s.id AND ps.provider_id = p_provider_id
  LEFT JOIN pricing_tiers pt ON pt.id = p_tier_id
  WHERE s.id = p_service_id;
  
  -- Calculate final amounts
  base_price := base_price * p_duration_hours;
  
  result := jsonb_build_object(
    'base_amount', base_price,
    'commission_amount', base_price * commission_rate / 100,
    'platform_fee', base_price * platform_fee / 100,
    'franchise_fee', base_price * franchise_rate / 100,
    'total_customer_price', base_price,
    'provider_payout', base_price * (100 - commission_rate - platform_fee) / 100
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### **Provider Rating Update Function**
```sql
CREATE OR REPLACE FUNCTION update_provider_rating(p_provider_id uuid)
RETURNS void AS $$
DECLARE
  avg_rating decimal(3,2);
  review_count integer;
BEGIN
  -- Calculate new averages
  SELECT 
    ROUND(AVG(overall_rating), 2),
    COUNT(*)
  INTO avg_rating, review_count
  FROM booking_reviews 
  WHERE provider_id = p_provider_id AND is_public = true;
  
  -- Update provider record
  UPDATE service_providers 
  SET 
    average_rating = COALESCE(avg_rating, 0.00),
    total_reviews = review_count,
    updated_at = now()
  WHERE id = p_provider_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating after review
CREATE OR REPLACE FUNCTION trigger_update_provider_rating()
RETURNS trigger AS $$
BEGIN
  PERFORM update_provider_rating(NEW.provider_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
  AFTER INSERT OR UPDATE ON booking_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_provider_rating();
```

---

## 📝 **DEVELOPMENT PATTERNS**

### **Common Query Patterns**

#### **Service Discovery for Booking App**
```sql
-- Get available services in franchise with providers
SELECT 
  s.id,
  s.name,
  s.description,
  s.base_price,
  sc.name as category_name,
  COUNT(ps.provider_id) as available_providers,
  AVG(sp.average_rating) as avg_provider_rating,
  MIN(COALESCE(ps.custom_price, s.base_price)) as min_price,
  MAX(COALESCE(ps.custom_price, s.base_price)) as max_price
FROM services s
JOIN service_categories sc ON s.category_id = sc.id
JOIN provider_services ps ON s.id = ps.service_id AND ps.is_available = true
JOIN service_providers sp ON ps.provider_id = sp.id AND sp.is_active = true
WHERE sp.franchise_id = $franchise_id
  AND s.is_active = true
GROUP BY s.id, s.name, s.description, s.base_price, sc.name
HAVING COUNT(ps.provider_id) > 0
ORDER BY available_providers DESC, avg_provider_rating DESC;
```

#### **Customer Dashboard Data**
```sql
-- Get customer overview for my.careservice.es
SELECT 
  -- Statistics
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
  COUNT(*) FILTER (WHERE booking_date > CURRENT_DATE) as upcoming_bookings,
  SUM(total_price) FILTER (WHERE status = 'completed') as total_spent,
  
  -- Recent bookings
  jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'service_name', s.name,
      'provider_name', sp.business_name,
      'booking_date', b.booking_date,
      'status', b.status,
      'total_price', b.total_price
    ) ORDER BY b.booking_date DESC
  ) FILTER (WHERE b.booking_date >= CURRENT_DATE - INTERVAL '30 days') as recent_bookings

FROM bookings b
JOIN services s ON b.service_id = s.id
JOIN service_providers sp ON b.provider_id = sp.id
WHERE b.customer_id = $user_id;
```

#### **Professional Dashboard Analytics**
```sql
-- Get professional performance metrics for pro.careservice.es
SELECT 
  sp.id,
  sp.business_name,
  sp.average_rating,
  sp.total_reviews,
  
  -- This month stats
  COUNT(b.id) FILTER (WHERE b.booking_date >= date_trunc('month', CURRENT_DATE)) as bookings_this_month,
  SUM(b.total_price - b.commission_amount - b.platform_fee) 
    FILTER (WHERE b.status = 'completed' AND b.booking_date >= date_trunc('month', CURRENT_DATE)) as earnings_this_month,
  
  -- Upcoming bookings
  COUNT(b.id) FILTER (WHERE b.booking_date > CURRENT_DATE AND b.status = 'confirmed') as upcoming_bookings,
  
  -- Service performance
  jsonb_agg(DISTINCT jsonb_build_object(
    'service_name', s.name,
    'bookings_count', COUNT(b.id) FILTER (WHERE s.id = b.service_id),
    'avg_rating', AVG(br.overall_rating) FILTER (WHERE s.id = b.service_id)
  )) as service_performance

FROM service_providers sp
LEFT JOIN bookings b ON sp.id = b.provider_id
LEFT JOIN services s ON b.service_id = s.id
LEFT JOIN booking_reviews br ON b.id = br.booking_id
WHERE sp.user_id = $user_id
GROUP BY sp.id, sp.business_name, sp.average_rating, sp.total_reviews;
```

### **Data Migration & Seeding Patterns**
```sql
-- Initial platform setup
INSERT INTO franchises (subdomain, name, region, commission_rate) VALUES
('pinoso', 'Care & Service Pinoso', 'Valencia', 15.00),
('costablanca', 'Care & Service Costa Blanca', 'Alicante', 15.00),
('valencia', 'Care & Service Valencia', 'Valencia', 12.00);

-- Essential app settings
INSERT INTO app_settings (key, value, value_type, description, is_public) VALUES
('platform_name', 'Care & Service', 'string', 'Platform display name', true),
('default_commission_rate', '15.00', 'number', 'Default commission percentage', false),
('default_language', 'nl', 'string', 'Default platform language', true),
('contact_email', 'info@careservice.es', 'string', 'Platform contact email', true),
('mollie_test_mode', 'true', 'boolean', 'Enable Mollie test mode', false);

-- Service categories
INSERT INTO service_categories (name, description, icon, commission_rate) VALUES
('Huishoudelijke hulp', 'Schoonmaak, wassen, strijken en andere huishoudelijke taken', 'home', 15.00),
('Technische hulp', 'Klusjesman, elektricien, loodgieter en reparaties', 'wrench', 15.00),
('Ouderenzorg', 'Gezelschap, basiszorg en ondersteuning voor senioren', 'heart', 18.00),
('Vervoer & begeleiding', 'Vervoer naar afspraken, boodschappen en sociale activiteiten', 'car', 12.00);
```

---

## 🔧 **DATABASE MAINTENANCE**

### **Regular Maintenance Tasks**
```sql
-- Update provider ratings (run daily)
SELECT update_provider_rating(id) FROM service_providers WHERE is_active = true;

-- Clean up expired payment sessions (run hourly)
UPDATE payments 
SET status = 'expired' 
WHERE status = 'pending' 
  AND expires_at < now() 
  AND expires_at IS NOT NULL;

-- Generate monthly payout records (run monthly)
INSERT INTO payouts (provider_id, franchise_id, payout_period_start, payout_period_end, total_amount, net_amount)
SELECT 
  sp.id,
  sp.franchise_id,
  date_trunc('month', CURRENT_DATE - INTERVAL '1 month'),
  date_trunc('month', CURRENT_DATE) - INTERVAL '1 day',
  SUM(b.total_price - b.commission_amount - b.platform_fee),
  SUM(b.total_price - b.commission_amount - b.platform_fee)
FROM service_providers sp
JOIN bookings b ON sp.id = b.provider_id
WHERE b.status = 'completed'
  AND b.booking_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
  AND b.booking_date < date_trunc('month', CURRENT_DATE)
GROUP BY sp.id, sp.franchise_id;
```

### **Backup & Recovery Strategy**
```sql
-- Create database backup (scheduled daily)
pg_dump --host=db.hsqdzdxxpqzcbnfdzwes.supabase.co \
        --port=5432 \
        --username=postgres \
        --dbname=postgres \
        --schema=public \
        --format=custom \
        --file=careservice_backup_$(date +%Y%m%d).dump

-- Point-in-time recovery setup
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /backup/archive/%f';
```

---

## 📊 **MONITORING & ANALYTICS**

### **Performance Monitoring Queries**
```sql
-- Slow query identification
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 -- Queries slower than 1 second
ORDER BY mean_exec_time DESC;

-- Table size monitoring
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Connection monitoring
SELECT 
  datname,
  state,
  COUNT(*)
FROM pg_stat_activity 
WHERE datname = 'postgres'
GROUP BY datname, state;
```

### **Business Intelligence Views**
```sql
-- Revenue analytics per franchise
CREATE VIEW v_franchise_revenue AS
SELECT 
  f.name as franchise_name,
  DATE_TRUNC('month', b.booking_date) as month,
  COUNT(b.id) as total_bookings,
  SUM(b.total_price) as gross_revenue,
  SUM(b.commission_amount) as commission_revenue,
  SUM(b.platform_fee) as platform_revenue,
  AVG(br.overall_rating) as avg_rating
FROM franchises f
LEFT JOIN bookings b ON f.id = b.franchise_id AND b.status = 'completed'
LEFT JOIN booking_reviews br ON b.id = br.booking_id
GROUP BY f.id, f.name, DATE_TRUNC('month', b.booking_date);

-- Provider performance dashboard
CREATE VIEW v_provider_performance AS
SELECT 
  sp.id,
  sp.business_name,
  sp.average_rating,
  COUNT(b.id) as total_bookings,
  COUNT(b.id) FILTER (WHERE b.booking_date >= CURRENT_DATE - INTERVAL '30 days') as bookings_last_30_days,
  SUM(b.total_price - b.commission_amount - b.platform_fee) as total_earnings,
  AVG(b.total_price) as avg_booking_value
FROM service_providers sp
LEFT JOIN bookings b ON sp.id = b.provider_id AND b.status = 'completed'
GROUP BY sp.id, sp.business_name, sp.average_rating;
```

---

## Live Data & Analytics Status (2025-07)

- The Supabase database is fully populated with real, live data, including users, professionals, bookings, services, and categories.
- The `/api/admin/database-analytics` endpoint returns accurate, non-empty analytics reflecting this data.
- The admin dashboard displays these live statistics, including user counts, bookings, services, and more.
- User and professional/provider lists are also populated and reflect the current state of the database.
- When working with analytics, user lists, or professional/provider lists, assume the database is populated unless otherwise noted.

*Deze database schema documentatie vormt de technische basis voor alle ontwikkeling op het Care & Service platform en wordt regelmatig bijgewerkt om wijzigingen in de architectuur te reflecteren.* 
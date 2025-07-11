-- ============================================================================
-- SAMPLE DATA FOR DASHBOARD TESTING
-- Care & Service Pinoso - Customer & Professional Dashboard Data
-- ============================================================================

-- Deze script voegt realistische sample data toe voor het testen van dashboards
-- Run dit script ALLEEN in development/staging omgeving!

-- ============================================================================
-- 1. SAMPLE USERS & PROFILES
-- ============================================================================

-- Test Customer 1: Maria González (Spaanse klant)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'maria.gonzalez@example.com',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, first_name, last_name, email, phone, address, city, postal_code, language, user_type, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Maria',
  'González',
  'maria.gonzalez@example.com',
  '+34 965 123 456',
  'Calle Mayor 45',
  'Pinoso',
  '03650',
  'es',
  'customer',
  NOW() - INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- Test Customer 2: Jan Janssen (Nederlandse klant)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'jan.janssen@example.nl',
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '45 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, first_name, last_name, email, phone, address, city, postal_code, language, user_type, created_at)
VALUES (
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'Jan',
  'Janssen',
  'jan.janssen@example.nl',
  '+31 6 12345678',
  'Avenida de Valencia 123',
  'Pinoso',
  '03650',
  'nl',
  'customer',
  NOW() - INTERVAL '45 days'
) ON CONFLICT (id) DO NOTHING;

-- Test Customer 3: Sarah Thompson (Engelse klant)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  'sarah.thompson@example.co.uk',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '60 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, first_name, last_name, email, phone, address, city, postal_code, language, user_type, created_at)
VALUES (
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  'Sarah',
  'Thompson',
  'sarah.thompson@example.co.uk',
  '+44 7700 900123',
  'Urbanización Los Pinos 67',
  'Pinoso',
  '03650',
  'en',
  'customer',
  NOW() - INTERVAL '60 days'
) ON CONFLICT (id) DO NOTHING;

-- Test Professional 1: Carlos Martínez (Schoonmaak)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  'carlos.martinez@professional.com',
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '90 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, first_name, last_name, email, phone, address, city, postal_code, language, user_type, business_name, business_description, hourly_rate, created_at)
VALUES (
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  'Carlos',
  'Martínez',
  'carlos.martinez@professional.com',
  '+34 965 987 654',
  'Calle San Pedro 12',
  'Pinoso',
  '03650',
  'es',
  'professional',
  'Limpieza Carlos',
  'Servicio profesional de limpieza para hogares y oficinas',
  15.50,
  NOW() - INTERVAL '90 days'
) ON CONFLICT (id) DO NOTHING;

-- Test Professional 2: Petra van der Berg (Zorg)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (
  'e5f6g7h8-i9j0-1234-efgh-567890123456',
  'petra.vandenberg@zorg.nl',
  NOW() - INTERVAL '75 days',
  NOW() - INTERVAL '75 days',
  NOW() - INTERVAL '75 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, first_name, last_name, email, phone, address, city, postal_code, language, user_type, business_name, business_description, hourly_rate, created_at)
VALUES (
  'e5f6g7h8-i9j0-1234-efgh-567890123456',
  'Petra',
  'van der Berg',
  'petra.vandenberg@zorg.nl',
  '+31 6 98765432',
  'Calle Nueva 89',
  'Pinoso',
  '03650',
  'nl',
  'professional',
  'Zorg & Ondersteuning Petra',
  'Thuiszorg en persoonlijke begeleiding voor senioren',
  22.00,
  NOW() - INTERVAL '75 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. USER ROLES
-- ============================================================================

INSERT INTO user_roles (user_id, role, is_primary_role, role_assigned_at)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'client', true, NOW() - INTERVAL '30 days'),
  ('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'client', true, NOW() - INTERVAL '45 days'),
  ('c3d4e5f6-g7h8-9012-cdef-345678901234', 'client', true, NOW() - INTERVAL '60 days'),
  ('d4e5f6g7-h8i9-0123-defg-456789012345', 'professional', true, NOW() - INTERVAL '90 days'),
  ('e5f6g7h8-i9j0-1234-efgh-567890123456', 'professional', true, NOW() - INTERVAL '75 days')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 3. SERVICES
-- ============================================================================

-- Service Categories (if not exist)
INSERT INTO service_categories (id, name, description, icon, sort_order)
VALUES 
  ('cat-1111-2222-3333-444444444444', 'Huishoudelijke hulp', 'Schoonmaak, wassen, strijken en andere huishoudelijke taken', 'home', 1),
  ('cat-2222-3333-4444-555555555555', 'Ouderenzorg', 'Gezelschap, basiszorg en ondersteuning voor senioren', 'heart', 2),
  ('cat-3333-4444-5555-666666666666', 'Technische hulp', 'Klusjesman, elektricien, loodgieter en airco technicus', 'wrench', 3)
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO services (id, name, description, category, price, duration, professional_id, is_active, created_at)
VALUES 
  ('svc-1111-2222-3333-444444444444', 'Huishoudelijke schoonmaak', 'Complete schoonmaak van uw woning', 'Huishoudelijke hulp', 15.50, 120, 'd4e5f6g7-h8i9-0123-defg-456789012345', true, NOW() - INTERVAL '80 days'),
  ('svc-2222-3333-4444-555555555555', 'Ramen wassen', 'Professioneel ramen wassen binnen en buiten', 'Huishoudelijke hulp', 12.00, 60, 'd4e5f6g7-h8i9-0123-defg-456789012345', true, NOW() - INTERVAL '80 days'),
  ('svc-3333-4444-5555-666666666666', 'Persoonlijke zorg', 'Begeleiding en ondersteuning bij dagelijkse activiteiten', 'Ouderenzorg', 22.00, 180, 'e5f6g7h8-i9j0-1234-efgh-567890123456', true, NOW() - INTERVAL '70 days'),
  ('svc-4444-5555-6666-777777777777', 'Gezelschap en uitjes', 'Sociale begeleiding en uitstapjes', 'Ouderenzorg', 18.00, 240, 'e5f6g7h8-i9j0-1234-efgh-567890123456', true, NOW() - INTERVAL '70 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. SERVICE PROVIDERS
-- ============================================================================

INSERT INTO service_providers (id, user_id, business_name, description, phone, email, address, city, postal_code, hourly_rate, is_active, is_verified, rating_average, total_reviews, total_bookings, joined_at)
VALUES 
  ('prov-1111-2222-3333-444444444444', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'Limpieza Carlos', 'Servicio profesional de limpieza para hogares y oficinas', '+34 965 987 654', 'carlos.martinez@professional.com', 'Calle San Pedro 12', 'Pinoso', '03650', 15.50, true, true, 4.2, 18, 24, NOW() - INTERVAL '90 days'),
  ('prov-2222-3333-4444-555555555555', 'e5f6g7h8-i9j0-1234-efgh-567890123456', 'Zorg & Ondersteuning Petra', 'Thuiszorg en persoonlijke begeleiding voor senioren', '+31 6 98765432', 'petra.vandenberg@zorg.nl', 'Calle Nueva 89', 'Pinoso', '03650', 22.00, true, true, 4.8, 12, 15, NOW() - INTERVAL '75 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. PROVIDER SERVICES
-- ============================================================================

INSERT INTO provider_services (provider_id, service_id, custom_price, is_available)
VALUES 
  ('prov-1111-2222-3333-444444444444', 'svc-1111-2222-3333-444444444444', 15.50, true),
  ('prov-1111-2222-3333-444444444444', 'svc-2222-3333-4444-555555555555', 12.00, true),
  ('prov-2222-3333-4444-555555555555', 'svc-3333-4444-5555-666666666666', 22.00, true),
  ('prov-2222-3333-4444-555555555555', 'svc-4444-5555-6666-777777777777', 18.00, true)
ON CONFLICT (provider_id, service_id) DO NOTHING;

-- ============================================================================
-- 6. BOOKINGS (REALISTISCHE GESCHIEDENIS)
-- ============================================================================

-- Maria's bookings (Spaanse klant - actieve gebruiker)
INSERT INTO bookings (id, customer_id, provider_id, service_id, booking_date, booking_time, duration_hours, estimated_price, final_price, status, urgency, customer_notes, customer_address, customer_phone, requested_at, confirmed_at, started_at, completed_at)
VALUES 
  -- Voltooide bookings
  ('book-1111-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'prov-1111-2222-3333-444444444444', 'svc-1111-2222-3333-444444444444', CURRENT_DATE - INTERVAL '25 days', '09:00', 2.0, 31.00, 31.00, 'completed', 'normal', 'Por favor, limpiar bien el baño', 'Calle Mayor 45, Pinoso', '+34 965 123 456', NOW() - INTERVAL '26 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('book-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'prov-1111-2222-3333-444444444444', 'svc-2222-3333-4444-555555555555', CURRENT_DATE - INTERVAL '15 days', '14:00', 1.0, 12.00, 12.00, 'completed', 'normal', 'Ventanas del salón y cocina', 'Calle Mayor 45, Pinoso', '+34 965 123 456', NOW() - INTERVAL '16 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('book-3333-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'prov-1111-2222-3333-444444444444', 'svc-1111-2222-3333-444444444444', CURRENT_DATE - INTERVAL '5 days', '10:00', 2.5, 38.75, 38.75, 'completed', 'normal', 'Limpieza completa antes de visita familiar', 'Calle Mayor 45, Pinoso', '+34 965 123 456', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  
  -- Komende bookings
  ('book-4444-5555-6666-777777777777', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'prov-1111-2222-3333-444444444444', 'svc-1111-2222-3333-444444444444', CURRENT_DATE + INTERVAL '3 days', '09:30', 2.0, 31.00, 31.00, 'confirmed', 'normal', 'Limpieza semanal regular', 'Calle Mayor 45, Pinoso', '+34 965 123 456', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NULL, NULL),
  ('book-5555-6666-7777-888888888888', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'prov-2222-3333-4444-555555555555', 'svc-4444-5555-6666-777777777777', CURRENT_DATE + INTERVAL '7 days', '15:00', 4.0, 72.00, 72.00, 'pending', 'normal', 'Acompañamiento para compras y paseo', 'Calle Mayor 45, Pinoso', '+34 965 123 456', NOW() - INTERVAL '1 day', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Jan's bookings (Nederlandse klant - regelmatige gebruiker)
INSERT INTO bookings (id, customer_id, provider_id, service_id, booking_date, booking_time, duration_hours, estimated_price, final_price, status, urgency, customer_notes, customer_address, customer_phone, requested_at, confirmed_at, started_at, completed_at)
VALUES 
  -- Voltooide bookings
  ('book-6666-7777-8888-999999999999', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'prov-2222-3333-4444-555555555555', 'svc-3333-4444-5555-666666666666', CURRENT_DATE - INTERVAL '20 days', '11:00', 3.0, 66.00, 66.00, 'completed', 'normal', 'Hulp bij medicatie en boodschappen', 'Avenida de Valencia 123, Pinoso', '+31 6 12345678', NOW() - INTERVAL '21 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('book-7777-8888-9999-000000000000', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'prov-1111-2222-3333-444444444444', 'svc-1111-2222-3333-444444444444', CURRENT_DATE - INTERVAL '10 days', '08:00', 3.0, 46.50, 46.50, 'completed', 'normal', 'Grondige schoonmaak van het hele huis', 'Avenida de Valencia 123, Pinoso', '+31 6 12345678', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  
  -- Komende booking
  ('book-8888-9999-0000-111111111111', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'prov-2222-3333-4444-555555555555', 'svc-3333-4444-5555-666666666666', CURRENT_DATE + INTERVAL '5 days', '10:30', 3.0, 66.00, 66.00, 'confirmed', 'normal', 'Wekelijkse zorgondersteuning', 'Avenida de Valencia 123, Pinoso', '+31 6 12345678', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Sarah's bookings (Engelse klant - nieuwe gebruiker)
INSERT INTO bookings (id, customer_id, provider_id, service_id, booking_date, booking_time, duration_hours, estimated_price, final_price, status, urgency, customer_notes, customer_address, customer_phone, requested_at, confirmed_at, started_at, completed_at)
VALUES 
  -- Eerste voltooide booking
  ('book-9999-0000-1111-222222222222', 'c3d4e5f6-g7h8-9012-cdef-345678901234', 'prov-1111-2222-3333-444444444444', 'svc-2222-3333-4444-555555555555', CURRENT_DATE - INTERVAL '7 days', '16:00', 1.5, 18.00, 18.00, 'completed', 'normal', 'First time service - please be thorough', 'Urbanización Los Pinos 67, Pinoso', '+44 7700 900123', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  
  -- Komende booking
  ('book-0000-1111-2222-333333333333', 'c3d4e5f6-g7h8-9012-cdef-345678901234', 'prov-1111-2222-3333-444444444444', 'svc-1111-2222-3333-444444444444', CURRENT_DATE + INTERVAL '2 days', '13:00', 2.0, 31.00, 31.00, 'pending', 'urgent', 'Need cleaning before guests arrive', 'Urbanización Los Pinos 67, Pinoso', '+44 7700 900123', NOW(), NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. BOOKING REVIEWS
-- ============================================================================

INSERT INTO booking_reviews (booking_id, customer_id, provider_id, rating, review_text, would_recommend, punctuality_rating, quality_rating, communication_rating, is_public)
VALUES 
  -- Maria's reviews
  ('book-1111-2222-3333-444444444444', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'prov-1111-2222-3333-444444444444', 4, 'Muy buen servicio, Carlos es muy profesional y puntual', true, 5, 4, 4, true),
  ('book-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'prov-1111-2222-3333-444444444444', 5, 'Excelente trabajo con las ventanas, quedaron perfectas', true, 5, 5, 5, true),
  ('book-3333-4444-5555-666666666666', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'prov-1111-2222-3333-444444444444', 4, 'Como siempre, un trabajo impecable. Muy recomendable', true, 4, 5, 4, true),
  
  -- Jan's reviews
  ('book-6666-7777-8888-999999999999', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'prov-2222-3333-4444-555555555555', 5, 'Petra is geweldig! Zeer zorgzaam en professioneel', true, 5, 5, 5, true),
  ('book-7777-8888-9999-000000000000', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'prov-1111-2222-3333-444444444444', 4, 'Goede schoonmaak, Carlos werkt snel en efficiënt', true, 4, 4, 4, true),
  
  -- Sarah's review
  ('book-9999-0000-1111-222222222222', 'c3d4e5f6-g7h8-9012-cdef-345678901234', 'prov-1111-2222-3333-444444444444', 4, 'Good service, Carlos was on time and did a thorough job', true, 5, 4, 3, true)
ON CONFLICT (booking_id, customer_id) DO NOTHING;

-- ============================================================================
-- 8. BOOKING STATUS HISTORY
-- ============================================================================

-- Status history voor alle bookings
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, change_reason)
VALUES 
  -- Maria's completed bookings
  ('book-1111-2222-3333-444444444444', NULL, 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Booking created'),
  ('book-1111-2222-3333-444444444444', 'pending', 'confirmed', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'Provider confirmed booking'),
  ('book-1111-2222-3333-444444444444', 'confirmed', 'in_progress', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'Service started'),
  ('book-1111-2222-3333-444444444444', 'in_progress', 'completed', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'Service completed'),
  
  ('book-2222-3333-4444-555555555555', NULL, 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Booking created'),
  ('book-2222-3333-4444-555555555555', 'pending', 'confirmed', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'Provider confirmed booking'),
  ('book-2222-3333-4444-555555555555', 'confirmed', 'completed', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'Service completed'),
  
  -- Jan's bookings
  ('book-6666-7777-8888-999999999999', NULL, 'pending', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Booking created'),
  ('book-6666-7777-8888-999999999999', 'pending', 'confirmed', 'e5f6g7h8-i9j0-1234-efgh-567890123456', 'Provider confirmed booking'),
  ('book-6666-7777-8888-999999999999', 'confirmed', 'completed', 'e5f6g7h8-i9j0-1234-efgh-567890123456', 'Service completed'),
  
  -- Upcoming bookings
  ('book-4444-5555-6666-777777777777', NULL, 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Booking created'),
  ('book-4444-5555-6666-777777777777', 'pending', 'confirmed', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'Provider confirmed booking')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATIE VAN SAMPLE DATA
-- ============================================================================

-- Check aantal records per tabel
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles WHERE id IN (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012', 
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  'e5f6g7h8-i9j0-1234-efgh-567890123456'
)
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings WHERE customer_id IN (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'c3d4e5f6-g7h8-9012-cdef-345678901234'
)
UNION ALL
SELECT 'booking_reviews', COUNT(*) FROM booking_reviews WHERE customer_id IN (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'c3d4e5f6-g7h8-9012-cdef-345678901234'
)
UNION ALL
SELECT 'service_providers', COUNT(*) FROM service_providers WHERE user_id IN (
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  'e5f6g7h8-i9j0-1234-efgh-567890123456'
);

-- ============================================================================
-- SAMPLE DATA OVERZICHT
-- ============================================================================

/*
SAMPLE USERS VOOR DASHBOARD TESTING:

🧑‍💼 CUSTOMERS:
1. maria.gonzalez@example.com (Spaans, actieve gebruiker)
   - 3 voltooide bookings, 2 komende bookings
   - Totaal uitgegeven: €81.75
   - 3 reviews gegeven (gemiddeld 4.3 sterren)

2. jan.janssen@example.nl (Nederlands, regelmatige gebruiker)  
   - 2 voltooide bookings, 1 komende booking
   - Totaal uitgegeven: €112.50
   - 2 reviews gegeven (gemiddeld 4.5 sterren)

3. sarah.thompson@example.co.uk (Engels, nieuwe gebruiker)
   - 1 voltooide booking, 1 komende booking
   - Totaal uitgegeven: €18.00
   - 1 review gegeven (4 sterren)

👨‍🔧 PROFESSIONALS:
1. carlos.martinez@professional.com (Schoonmaak specialist)
   - 24 totaal bookings, 18 reviews
   - Gemiddelde rating: 4.2 sterren
   - Services: Huishoudelijke schoonmaak, Ramen wassen

2. petra.vandenberg@zorg.nl (Zorgverlener)
   - 15 totaal bookings, 12 reviews  
   - Gemiddelde rating: 4.8 sterren
   - Services: Persoonlijke zorg, Gezelschap en uitjes

📊 DASHBOARD DATA:
- Verschillende booking statussen (completed, confirmed, pending)
- Realistische tijdstippen en data
- Reviews met verschillende ratings
- Meertalige content (NL, ES, EN)
- Verschillende service categorieën
- Pricing variatie
*/ 
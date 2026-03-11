-- DirectKey - Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor

-- ============================================
-- ADMIN USER
-- Password: Admin123# (bcrypt hashed)
-- ============================================
INSERT INTO admins (email, password_hash, full_name) VALUES
  ('directkey0@gmail.com', '$2b$10$Q3s5nxE5AHMFV0R9BiVOt.UTi/tjps/7z3nkysTT5d3H2.sltgLV.', 'DirectKey Admin')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name;

-- ============================================
-- DEFAULT SETTINGS
-- ============================================
INSERT INTO settings (setting_key, setting_value) VALUES
  ('connection_fee', '15000'),
  ('platform_name', 'DirectKey'),
  ('platform_email', 'info@directkey.com'),
  ('platform_phone', '+2349012345678');

-- ============================================
-- NOTE: Users are created via Supabase Auth
-- The following UUIDs are placeholders.
-- In production, create users through auth.signUp
-- then their IDs will populate the users table.
-- ============================================

-- Landlord users (placeholder UUIDs)
-- landlord1@test.com / Test123!
-- landlord2@test.com / Test123!
-- landlord3@test.com / Test123!
-- landlord4@test.com / Test123!
-- landlord5@test.com / Test123!

-- For development, insert directly:
INSERT INTO users (id, email, full_name, phone_number, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'landlord1@test.com', 'Chief Adebayo Ogundimu', '+2348034521890', 'landlord'),
  ('22222222-2222-2222-2222-222222222222', 'landlord2@test.com', 'Alhaji Musa Ibrahim', '+2348091234567', 'landlord'),
  ('33333333-3333-3333-3333-333333333333', 'landlord3@test.com', 'Mrs. Folake Adeyemi', '+2348055678901', 'landlord'),
  ('44444444-4444-4444-4444-444444444444', 'landlord4@test.com', 'Dr. Olumide Fashola', '+2348023456789', 'landlord'),
  ('55555555-5555-5555-5555-555555555555', 'landlord5@test.com', 'Engr. Chukwuemeka Obi', '+2348067890123', 'landlord');

-- Tenant users
INSERT INTO users (id, email, full_name, phone_number, role) VALUES
  ('66666666-6666-6666-6666-666666666666', 'adaeze@gmail.com', 'Adaeze Nwosu', '+2348012345678', 'tenant'),
  ('77777777-7777-7777-7777-777777777777', 'baba.salami@yahoo.com', 'Babatunde Salami', '+2348098765432', 'tenant'),
  ('88888888-8888-8888-8888-888888888888', 'grace.okoro@gmail.com', 'Grace Okoro', '+2348076543210', 'tenant'),
  ('99999999-9999-9999-9999-999999999999', 'ibrahim.a@gmail.com', 'Ibrahim Abdullahi', '+2348034567890', 'tenant'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'chioma.eze@outlook.com', 'Chioma Eze', '+2348023456789', 'tenant');

-- ============================================
-- PROPERTIES (15 properties)
-- ============================================

-- Property 1: Approved, Featured
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, featured, views_count, created_at, approved_at)
VALUES ('p0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
  'Luxury 3-Bedroom Apartment in Lekki Phase 1',
  'Beautifully finished 3-bedroom apartment with modern fixtures, spacious living area, and 24-hour security. Located in a serene estate with easy access to major roads and shopping centers. Features marble floors, a fitted kitchen with granite countertops, and large windows providing natural light.',
  'Apartment', 3, 3, 4500000, 'Lagos', 'Eti-Osa', 'Lekki Phase 1',
  ARRAY['24hr Security', 'Parking Space', 'Water Supply', 'Electricity', 'Fitted Kitchen', 'Swimming Pool'],
  'approved', TRUE, 142, '2025-12-15T10:30:00Z', '2025-12-16T09:00:00Z');

-- Property 2: Approved
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, featured, views_count, created_at, approved_at)
VALUES ('p0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
  'Modern 2-Bedroom Flat in Ikeja GRA',
  'Well-maintained 2-bedroom flat in a quiet neighborhood within GRA Ikeja. Features include tiled floors, ample storage, and a dedicated parking spot. Close to the airport and Ikeja City Mall.',
  'Apartment', 2, 2, 2400000, 'Lagos', 'Ikeja', 'GRA Ikeja',
  ARRAY['Parking Space', 'Water Supply', 'Electricity', 'Security Gate'],
  'approved', FALSE, 89, '2025-11-20T14:00:00Z', '2025-11-21T10:00:00Z');

-- Property 3: Pending
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at)
VALUES ('p0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
  'Spacious 4-Bedroom Duplex in Magodo',
  'Impressive 4-bedroom semi-detached duplex in the prestigious Magodo GRA Phase 2 estate. Features a modern kitchen, large compound, BQ, and round-the-clock security.',
  'Duplex', 4, 4, 6000000, 'Lagos', 'Kosofe', 'Magodo GRA',
  ARRAY['24hr Security', 'Parking Space', 'Water Supply', 'Electricity', 'BQ', 'Fitted Kitchen', 'Garden'],
  'pending', 0, '2026-01-28T09:15:00Z');

-- Property 4: Approved, Featured
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, featured, views_count, created_at, approved_at)
VALUES ('p0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
  'Executive Studio Apartment in Victoria Island',
  'Compact yet stylish studio apartment perfect for young professionals. Fully furnished with high-speed internet, gym access, and a rooftop lounge. Premium finishes throughout.',
  'Studio', 1, 1, 3600000, 'Lagos', 'Eti-Osa', 'Victoria Island',
  ARRAY['24hr Security', 'Gym', 'Internet', 'Furnished', 'Elevator', 'Water Supply', 'Electricity'],
  'approved', TRUE, 215, '2025-10-05T16:45:00Z', '2025-10-06T11:00:00Z');

-- Property 5: Rejected
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, rejection_reason, views_count, created_at)
VALUES ('p0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
  'Cozy 2-Bedroom Bungalow in Surulere',
  'Affordable 2-bedroom bungalow in the heart of Surulere. Easy access to National Stadium, Adeniran Ogunsanya Shopping Mall, and major bus routes.',
  'Bungalow', 2, 1, 1200000, 'Lagos', 'Surulere', 'Adeniran Ogunsanya',
  ARRAY['Water Supply', 'Security Gate', 'Parking Space'],
  'rejected', 'Incomplete property images. Please upload at least 3 clear photos showing all rooms.', 0, '2026-01-10T11:20:00Z');

-- Property 6: Pending
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at)
VALUES ('p0000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111',
  'Premium 5-Bedroom Penthouse in Ikoyi',
  'Ultra-luxury 5-bedroom penthouse with breathtaking views of the Lagos Lagoon. Features a private terrace, smart home technology, and concierge services.',
  'Penthouse', 5, 5, 25000000, 'Lagos', 'Eti-Osa', 'Ikoyi',
  ARRAY['24hr Security', 'Swimming Pool', 'Gym', 'Elevator', 'Concierge', 'Smart Home', 'Water Supply', 'Electricity', 'Parking Space'],
  'pending', 0, '2026-02-01T08:00:00Z');

-- Property 7: Approved
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at, approved_at)
VALUES ('p0000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111',
  '3-Bedroom Semi-Detached in Ajah',
  'Brand new 3-bedroom semi-detached house with modern finishes. Part of a gated community with dedicated security and well-paved roads.',
  'Semi-Detached', 3, 3, 3000000, 'Lagos', 'Eti-Osa', 'Ajah',
  ARRAY['24hr Security', 'Parking Space', 'Water Supply', 'Electricity', 'Gated Community'],
  'approved', 67, '2025-12-01T12:00:00Z', '2025-12-02T08:00:00Z');

-- Property 8: Approved (Landlord 2)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, featured, views_count, created_at, approved_at)
VALUES ('p0000008-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222',
  'Modern 3-Bedroom Flat in Wuse 2',
  'Tastefully finished 3-bedroom apartment in the heart of Wuse 2, Abuja. Walking distance to banks, restaurants, and shopping plazas. Fully serviced with standby generator.',
  'Apartment', 3, 2, 5000000, 'Abuja', 'Abuja Municipal', 'Wuse 2',
  ARRAY['24hr Security', 'Parking Space', 'Water Supply', 'Electricity', 'Generator', 'Fitted Kitchen'],
  'approved', TRUE, 98, '2025-11-10T09:00:00Z', '2025-11-11T10:00:00Z');

-- Property 9: Approved (Landlord 2)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, featured, views_count, created_at, approved_at)
VALUES ('p0000009-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222',
  'Elegant 4-Bedroom Duplex in Maitama',
  'Exquisite 4-bedroom duplex in the exclusive Maitama district. Diplomatic zone location with top-notch infrastructure. Large garden, BQ, and ample parking.',
  'Duplex', 4, 4, 12000000, 'Abuja', 'Abuja Municipal', 'Maitama',
  ARRAY['24hr Security', 'Parking Space', 'Water Supply', 'Electricity', 'BQ', 'Garden', 'CCTV', 'Generator'],
  'approved', TRUE, 156, '2025-10-20T11:30:00Z', '2025-10-21T09:00:00Z');

-- Property 10: Approved (Landlord 3)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at, approved_at)
VALUES ('p0000010-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333',
  '2-Bedroom Apartment in Port Harcourt GRA',
  'Clean and spacious 2-bedroom apartment in the serene GRA Phase 2 of Port Harcourt. Close to shopping centers and major business districts.',
  'Apartment', 2, 2, 1800000, 'Rivers', 'Port Harcourt', 'GRA Phase 2',
  ARRAY['Parking Space', 'Water Supply', 'Electricity', 'Security Gate'],
  'approved', 45, '2025-12-20T13:00:00Z', '2025-12-21T10:00:00Z');

-- Property 11: Approved (Landlord 4)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at, approved_at)
VALUES ('p0000011-0000-0000-0000-000000000011', '44444444-4444-4444-4444-444444444444',
  'Luxury Penthouse in Banana Island',
  'Ultra-premium penthouse in Banana Island with panoramic lagoon views. 5 en-suite bedrooms, private cinema, infinity pool, and dedicated concierge. The pinnacle of Lagos luxury living.',
  'Penthouse', 5, 6, 60000000, 'Lagos', 'Eti-Osa', 'Banana Island',
  ARRAY['24hr Security', 'Swimming Pool', 'Gym', 'Elevator', 'Concierge', 'Smart Home', 'Cinema', 'Water Supply', 'Electricity', 'Parking Space'],
  'approved', 320, '2025-09-15T10:00:00Z', '2025-09-16T08:00:00Z');

-- Property 12: Approved (Landlord 5)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at, approved_at)
VALUES ('p0000012-0000-0000-0000-000000000012', '55555555-5555-5555-5555-555555555555',
  'Affordable Studio in Yaba',
  'Budget-friendly studio apartment ideal for students and young professionals in the vibrant Yaba tech hub area. Close to universities and co-working spaces.',
  'Studio', 1, 1, 800000, 'Lagos', 'Lagos Mainland', 'Yaba',
  ARRAY['Water Supply', 'Electricity', 'Internet', 'Security Gate'],
  'approved', 78, '2025-11-05T15:00:00Z', '2025-11-06T10:00:00Z');

-- Property 13: Pending (Landlord 3)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at)
VALUES ('p0000013-0000-0000-0000-000000000013', '33333333-3333-3333-3333-333333333333',
  '3-Bedroom Bungalow in Bodija, Ibadan',
  'Charming 3-bedroom bungalow in the quiet Bodija area of Ibadan. Large compound with fruit trees, boys quarters, and a separate guest house.',
  'Bungalow', 3, 2, 600000, 'Oyo', 'Ibadan North', 'Bodija',
  ARRAY['Parking Space', 'Water Supply', 'BQ', 'Garden'],
  'pending', 0, '2026-02-03T10:00:00Z');

-- Property 14: Approved (Landlord 4)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at, approved_at)
VALUES ('p0000014-0000-0000-0000-000000000014', '44444444-4444-4444-4444-444444444444',
  'Serviced 2-Bedroom Apartment in Garki',
  'Fully serviced 2-bedroom apartment in Garki Area 11. Comes with 24/7 power, water, and cleaning services. Perfect for expatriates and business travelers.',
  'Apartment', 2, 2, 4000000, 'Abuja', 'Abuja Municipal', 'Garki',
  ARRAY['24hr Security', 'Parking Space', 'Water Supply', 'Electricity', 'Generator', 'Furnished', 'Internet'],
  'approved', 112, '2025-10-25T14:00:00Z', '2025-10-26T09:00:00Z');

-- Property 15: Approved (Landlord 5)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, state, local_government, area, amenities, status, views_count, created_at, approved_at)
VALUES ('p0000015-0000-0000-0000-000000000015', '55555555-5555-5555-5555-555555555555',
  'Detached 4-Bedroom Duplex in GRA Benin',
  'Spacious 4-bedroom detached duplex in the Government Reservation Area of Benin City. Large compound, modern finishes, and a quiet residential environment.',
  'Duplex', 4, 3, 2500000, 'Edo', 'Oredo', 'GRA Benin City',
  ARRAY['Parking Space', 'Water Supply', 'Electricity', 'Security Gate', 'Garden'],
  'approved', 34, '2025-12-10T09:30:00Z', '2025-12-11T10:00:00Z');

-- Backfill monthly_rent for all existing properties
UPDATE properties SET monthly_rent = ROUND(price_per_year / 12, 2) WHERE price_per_year > 0;

-- ============================================
-- LAND & SHORTLET PROPERTIES (admin-added)
-- ============================================

-- Land 1: Prime plot in Lekki (admin added)
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, monthly_rent, price_per_night, min_nights, state, local_government, area, amenities, added_by, status, featured, views_count, created_at, approved_at)
VALUES ('p0000016-0000-0000-0000-000000000016', NULL,
  'Prime 800sqm Plot in Lekki Phase 2',
  'A rare opportunity to acquire a properly documented 800sqm dry land in the fast-developing Lekki Phase 2. C of O available. Fenced on three sides. Perfect for residential development.',
  'Land', 0, 0, 45000000, 0, 0, 0, 'Lagos', 'Eti-Osa', 'Lekki Phase 2',
  ARRAY[]::TEXT[], 'admin', 'approved', TRUE, 88, '2026-01-15T09:00:00Z', '2026-01-15T09:00:00Z');

-- Land 2: Abuja plot
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, monthly_rent, price_per_night, min_nights, state, local_government, area, amenities, added_by, status, featured, views_count, created_at, approved_at)
VALUES ('p0000017-0000-0000-0000-000000000017', NULL,
  '600sqm Residential Land in Gwarimpa, Abuja',
  'Well-located 600 square metre residential plot in Gwarimpa Estate, Abuja. Gazette and Survey Plan available. Located in a peaceful estate close to schools, churches, and shops.',
  'Land', 0, 0, 18000000, 0, 0, 0, 'Abuja', 'Abuja Municipal', 'Gwarimpa',
  ARRAY[]::TEXT[], 'admin', 'approved', FALSE, 43, '2026-01-20T11:00:00Z', '2026-01-20T11:00:00Z');

-- Shortlet 1: Lagos Island
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, monthly_rent, price_per_night, min_nights, state, local_government, area, amenities, added_by, status, featured, views_count, created_at, approved_at)
VALUES ('p0000018-0000-0000-0000-000000000018', NULL,
  'Luxury 2-Bedroom Shortlet in Victoria Island',
  'Fully furnished 2-bedroom shortlet apartment on Victoria Island, perfect for business trips, vacations, and weekend getaways. Features high-speed WiFi, Smart TV, air conditioning in all rooms, a fully equipped kitchen, and a stunning city view. Daily cleaning and 24/7 concierge available.',
  'Shortlet', 2, 2, 0, 0, 65000, 2, 'Lagos', 'Eti-Osa', 'Victoria Island',
  ARRAY['Furnished', 'Internet', '24hr Security', 'Electricity', 'Water Supply', 'Parking Space', 'Smart Home', 'CCTV'],
  'admin', 'approved', TRUE, 174, '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z');

-- Shortlet 2: Abuja shortlet
INSERT INTO properties (id, landlord_id, property_name, description, property_type, bedrooms, bathrooms, price_per_year, monthly_rent, price_per_night, min_nights, state, local_government, area, amenities, added_by, status, featured, views_count, created_at, approved_at)
VALUES ('p0000019-0000-0000-0000-000000000019', NULL,
  'Executive 1-Bedroom Shortlet in Wuse 2, Abuja',
  'Elegant 1-bedroom executive shortlet apartment in the heart of Wuse 2. Ideally located for business travellers. Features Netflix, high-speed internet, modern kitchen, and fully air-conditioned rooms. Minimum 2-night stay.',
  'Shortlet', 1, 1, 0, 0, 35000, 2, 'Abuja', 'Abuja Municipal', 'Wuse 2',
  ARRAY['Furnished', 'Internet', 'Electricity', 'Water Supply', '24hr Security', 'Parking Space'],
  'admin', 'approved', FALSE, 92, '2026-02-05T10:00:00Z', '2026-02-05T10:00:00Z');

-- ============================================
-- PROPERTY IMAGES (2-4 per property)
-- ============================================
INSERT INTO property_images (property_id, image_url, image_order) VALUES
  ('p0000001-0000-0000-0000-000000000001', 'https://picsum.photos/seed/dk1a/800/600', 0),
  ('p0000001-0000-0000-0000-000000000001', 'https://picsum.photos/seed/dk1b/800/600', 1),
  ('p0000001-0000-0000-0000-000000000001', 'https://picsum.photos/seed/dk1c/800/600', 2),
  ('p0000002-0000-0000-0000-000000000002', 'https://picsum.photos/seed/dk2a/800/600', 0),
  ('p0000002-0000-0000-0000-000000000002', 'https://picsum.photos/seed/dk2b/800/600', 1),
  ('p0000003-0000-0000-0000-000000000003', 'https://picsum.photos/seed/dk3a/800/600', 0),
  ('p0000003-0000-0000-0000-000000000003', 'https://picsum.photos/seed/dk3b/800/600', 1),
  ('p0000003-0000-0000-0000-000000000003', 'https://picsum.photos/seed/dk3c/800/600', 2),
  ('p0000004-0000-0000-0000-000000000004', 'https://picsum.photos/seed/dk4a/800/600', 0),
  ('p0000004-0000-0000-0000-000000000004', 'https://picsum.photos/seed/dk4b/800/600', 1),
  ('p0000005-0000-0000-0000-000000000005', 'https://picsum.photos/seed/dk5a/800/600', 0),
  ('p0000005-0000-0000-0000-000000000005', 'https://picsum.photos/seed/dk5b/800/600', 1),
  ('p0000006-0000-0000-0000-000000000006', 'https://picsum.photos/seed/dk6a/800/600', 0),
  ('p0000006-0000-0000-0000-000000000006', 'https://picsum.photos/seed/dk6b/800/600', 1),
  ('p0000006-0000-0000-0000-000000000006', 'https://picsum.photos/seed/dk6c/800/600', 2),
  ('p0000006-0000-0000-0000-000000000006', 'https://picsum.photos/seed/dk6d/800/600', 3),
  ('p0000007-0000-0000-0000-000000000007', 'https://picsum.photos/seed/dk7a/800/600', 0),
  ('p0000007-0000-0000-0000-000000000007', 'https://picsum.photos/seed/dk7b/800/600', 1),
  ('p0000008-0000-0000-0000-000000000008', 'https://picsum.photos/seed/dk8a/800/600', 0),
  ('p0000008-0000-0000-0000-000000000008', 'https://picsum.photos/seed/dk8b/800/600', 1),
  ('p0000008-0000-0000-0000-000000000008', 'https://picsum.photos/seed/dk8c/800/600', 2),
  ('p0000009-0000-0000-0000-000000000009', 'https://picsum.photos/seed/dk9a/800/600', 0),
  ('p0000009-0000-0000-0000-000000000009', 'https://picsum.photos/seed/dk9b/800/600', 1),
  ('p0000009-0000-0000-0000-000000000009', 'https://picsum.photos/seed/dk9c/800/600', 2),
  ('p0000010-0000-0000-0000-000000000010', 'https://picsum.photos/seed/dk10a/800/600', 0),
  ('p0000010-0000-0000-0000-000000000010', 'https://picsum.photos/seed/dk10b/800/600', 1),
  ('p0000011-0000-0000-0000-000000000011', 'https://picsum.photos/seed/dk11a/800/600', 0),
  ('p0000011-0000-0000-0000-000000000011', 'https://picsum.photos/seed/dk11b/800/600', 1),
  ('p0000011-0000-0000-0000-000000000011', 'https://picsum.photos/seed/dk11c/800/600', 2),
  ('p0000011-0000-0000-0000-000000000011', 'https://picsum.photos/seed/dk11d/800/600', 3),
  ('p0000012-0000-0000-0000-000000000012', 'https://picsum.photos/seed/dk12a/800/600', 0),
  ('p0000012-0000-0000-0000-000000000012', 'https://picsum.photos/seed/dk12b/800/600', 1),
  ('p0000013-0000-0000-0000-000000000013', 'https://picsum.photos/seed/dk13a/800/600', 0),
  ('p0000013-0000-0000-0000-000000000013', 'https://picsum.photos/seed/dk13b/800/600', 1),
  ('p0000014-0000-0000-0000-000000000014', 'https://picsum.photos/seed/dk14a/800/600', 0),
  ('p0000014-0000-0000-0000-000000000014', 'https://picsum.photos/seed/dk14b/800/600', 1),
  ('p0000014-0000-0000-0000-000000000014', 'https://picsum.photos/seed/dk14c/800/600', 2),
  ('p0000015-0000-0000-0000-000000000015', 'https://picsum.photos/seed/dk15a/800/600', 0),
  ('p0000015-0000-0000-0000-000000000015', 'https://picsum.photos/seed/dk15b/800/600', 1),
  ('p0000016-0000-0000-0000-000000000016', 'https://picsum.photos/seed/dk16a/800/600', 0),
  ('p0000016-0000-0000-0000-000000000016', 'https://picsum.photos/seed/dk16b/800/600', 1),
  ('p0000017-0000-0000-0000-000000000017', 'https://picsum.photos/seed/dk17a/800/600', 0),
  ('p0000017-0000-0000-0000-000000000017', 'https://picsum.photos/seed/dk17b/800/600', 1),
  ('p0000018-0000-0000-0000-000000000018', 'https://picsum.photos/seed/dk18a/800/600', 0),
  ('p0000018-0000-0000-0000-000000000018', 'https://picsum.photos/seed/dk18b/800/600', 1),
  ('p0000018-0000-0000-0000-000000000018', 'https://picsum.photos/seed/dk18c/800/600', 2),
  ('p0000019-0000-0000-0000-000000000019', 'https://picsum.photos/seed/dk19a/800/600', 0),
  ('p0000019-0000-0000-0000-000000000019', 'https://picsum.photos/seed/dk19b/800/600', 1);

-- ============================================
-- CONNECTIONS (8 successful payments)
-- ============================================
INSERT INTO connections (property_id, tenant_email, tenant_name, tenant_phone, payment_reference, payment_amount, payment_status, payment_date) VALUES
  ('p0000001-0000-0000-0000-000000000001', 'adaeze@gmail.com', 'Adaeze Nwosu', '+2348012345678', 'DK-20260120-001', 15000, 'successful', '2026-01-20T14:30:00Z'),
  ('p0000001-0000-0000-0000-000000000001', 'baba.salami@yahoo.com', 'Babatunde Salami', '+2348098765432', 'DK-20260118-002', 15000, 'successful', '2026-01-18T10:15:00Z'),
  ('p0000004-0000-0000-0000-000000000004', 'grace.okoro@gmail.com', 'Grace Okoro', '+2348076543210', 'DK-20260115-003', 15000, 'successful', '2026-01-15T09:00:00Z'),
  ('p0000002-0000-0000-0000-000000000002', 'ibrahim.a@gmail.com', 'Ibrahim Abdullahi', '+2348034567890', 'DK-20260112-004', 15000, 'successful', '2026-01-12T16:45:00Z'),
  ('p0000004-0000-0000-0000-000000000004', 'chioma.eze@outlook.com', 'Chioma Eze', '+2348023456789', 'DK-20260110-005', 15000, 'successful', '2026-01-10T11:30:00Z'),
  ('p0000007-0000-0000-0000-000000000007', 'seun.dada@gmail.com', 'Oluwaseun Dada', '+2348045678901', 'DK-20260108-006', 15000, 'successful', '2026-01-08T13:20:00Z'),
  ('p0000001-0000-0000-0000-000000000001', 'fatima.b@gmail.com', 'Fatima Bello', '+2348056789012', 'DK-20260105-007', 15000, 'successful', '2026-01-05T10:00:00Z'),
  ('p0000002-0000-0000-0000-000000000002', 'david.o@yahoo.com', 'David Okonkwo', '+2348067890123', 'DK-20251228-008', 15000, 'successful', '2025-12-28T15:10:00Z');

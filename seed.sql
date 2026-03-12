-- DirectKey - Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor

-- ============================================
-- ADMIN USER
-- Email: directkey0@gmail.com
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
  ('platform_phone', '+2349012345678')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- ADMIN-ADDED PROPERTIES (no landlord_id needed)
-- Landlords create their own via the landlord portal
-- ============================================

-- Land 1: Prime plot in Lekki
INSERT INTO properties (
  id, landlord_id, property_name, description,
  property_category, bedrooms, bathrooms,
  price_per_year, monthly_rent, price_per_night, min_nights,
  state, local_government, area,
  land_area, land_unit, amenities,
  added_by, status, featured, views_count, created_at, approved_at
) VALUES (
  '00000000-0000-0000-0000-000000000016', NULL,
  'Prime 800sqm Plot in Lekki Phase 2',
  'A rare opportunity to acquire a properly documented 800sqm dry land in the fast-developing Lekki Phase 2. C of O available. Fenced on three sides. Perfect for residential development.',
  'land', 0, 0,
  45000000, 0, 0, 0,
  'Lagos', 'Eti-Osa', 'Lekki Phase 2',
  800, 'sqm', ARRAY[]::TEXT[],
  'admin', 'approved', TRUE, 88, '2026-01-15T09:00:00Z', '2026-01-15T09:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Land 2: Abuja plot
INSERT INTO properties (
  id, landlord_id, property_name, description,
  property_category, bedrooms, bathrooms,
  price_per_year, monthly_rent, price_per_night, min_nights,
  state, local_government, area,
  land_area, land_unit, amenities,
  added_by, status, featured, views_count, created_at, approved_at
) VALUES (
  '00000000-0000-0000-0000-000000000017', NULL,
  '600sqm Residential Land in Gwarimpa, Abuja',
  'Well-located 600 square metre residential plot in Gwarimpa Estate, Abuja. Gazette and Survey Plan available. Located in a peaceful estate close to schools, churches, and shops.',
  'land', 0, 0,
  18000000, 0, 0, 0,
  'Abuja', 'Abuja Municipal', 'Gwarimpa',
  600, 'sqm', ARRAY[]::TEXT[],
  'admin', 'approved', FALSE, 43, '2026-01-20T11:00:00Z', '2026-01-20T11:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Shortlet 1: Victoria Island
INSERT INTO properties (
  id, landlord_id, property_name, description,
  property_category, bedrooms, bathrooms,
  price_per_year, monthly_rent, price_per_night, min_nights,
  state, local_government, area, amenities,
  added_by, status, featured, views_count, created_at, approved_at
) VALUES (
  '00000000-0000-0000-0000-000000000018', NULL,
  'Luxury 2-Bedroom Shortlet in Victoria Island',
  'Fully furnished 2-bedroom shortlet apartment on Victoria Island, perfect for business trips, vacations, and weekend getaways. Features high-speed WiFi, Smart TV, air conditioning in all rooms, a fully equipped kitchen, and a stunning city view. Daily cleaning and 24/7 concierge available.',
  'shortlet', 2, 2,
  0, 0, 65000, 2,
  'Lagos', 'Eti-Osa', 'Victoria Island',
  ARRAY['Furnished', 'Internet', '24hr Security', 'Electricity', 'Water Supply', 'Parking Space', 'Smart Home', 'CCTV'],
  'admin', 'approved', TRUE, 174, '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Shortlet 2: Wuse 2 Abuja
INSERT INTO properties (
  id, landlord_id, property_name, description,
  property_category, bedrooms, bathrooms,
  price_per_year, monthly_rent, price_per_night, min_nights,
  state, local_government, area, amenities,
  added_by, status, featured, views_count, created_at, approved_at
) VALUES (
  '00000000-0000-0000-0000-000000000019', NULL,
  'Executive 1-Bedroom Shortlet in Wuse 2, Abuja',
  'Elegant 1-bedroom executive shortlet apartment in the heart of Wuse 2. Ideally located for business travellers. Features Netflix, high-speed internet, modern kitchen, and fully air-conditioned rooms. Minimum 2-night stay.',
  'shortlet', 1, 1,
  0, 0, 35000, 2,
  'Abuja', 'Abuja Municipal', 'Wuse 2',
  ARRAY['Furnished', 'Internet', 'Electricity', 'Water Supply', '24hr Security', 'Parking Space'],
  'admin', 'approved', FALSE, 92, '2026-02-05T10:00:00Z', '2026-02-05T10:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PROPERTY IMAGES (admin-added properties only)
-- ============================================
INSERT INTO property_images (property_id, image_url, image_order) VALUES
  ('00000000-0000-0000-0000-000000000016', 'https://picsum.photos/seed/dk16a/800/600', 0),
  ('00000000-0000-0000-0000-000000000016', 'https://picsum.photos/seed/dk16b/800/600', 1),
  ('00000000-0000-0000-0000-000000000017', 'https://picsum.photos/seed/dk17a/800/600', 0),
  ('00000000-0000-0000-0000-000000000017', 'https://picsum.photos/seed/dk17b/800/600', 1),
  ('00000000-0000-0000-0000-000000000018', 'https://picsum.photos/seed/dk18a/800/600', 0),
  ('00000000-0000-0000-0000-000000000018', 'https://picsum.photos/seed/dk18b/800/600', 1),
  ('00000000-0000-0000-0000-000000000018', 'https://picsum.photos/seed/dk18c/800/600', 2),
  ('00000000-0000-0000-0000-000000000019', 'https://picsum.photos/seed/dk19a/800/600', 0),
  ('00000000-0000-0000-0000-000000000019', 'https://picsum.photos/seed/dk19b/800/600', 1)
ON CONFLICT DO NOTHING;

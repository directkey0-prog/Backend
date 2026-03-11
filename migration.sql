-- DirectKey - Database Migration
-- Run this in the Supabase SQL Editor on an EXISTING database
-- to upgrade without dropping and recreating tables.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. Fix the property_type CHECK constraint (add Land, Shortlet)
-- ──────────────────────────────────────────────────────────
ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_property_type_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IN ('Apartment', 'Duplex', 'Bungalow', 'Semi-Detached', 'Penthouse', 'Studio', 'Land', 'Shortlet', 'Event Hall'));

-- ──────────────────────────────────────────────────────────
-- 2. Replace GENERATED monthly_rent with a regular column
--    (GENERATED ALWAYS AS columns cannot be manually inserted into)
-- ──────────────────────────────────────────────────────────
ALTER TABLE properties DROP COLUMN IF EXISTS monthly_rent;
ALTER TABLE properties ADD COLUMN monthly_rent DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Back-fill monthly_rent from price_per_year for existing rows
UPDATE properties SET monthly_rent = ROUND(price_per_year / 12, 2) WHERE price_per_year > 0;

-- ──────────────────────────────────────────────────────────
-- 3. Add new columns for shortlets and admin listings
-- ──────────────────────────────────────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_night DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_nights INTEGER NOT NULL DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS added_by TEXT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_area DECIMAL(12, 2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_unit TEXT DEFAULT NULL;

-- ──────────────────────────────────────────────────────────
-- 4. Make landlord_id nullable (admin listings have no landlord)
-- ──────────────────────────────────────────────────────────
ALTER TABLE properties ALTER COLUMN landlord_id DROP NOT NULL;

-- ──────────────────────────────────────────────────────────
-- 5. Update bedrooms/bathrooms to have DEFAULT 0 (for Land)
-- ──────────────────────────────────────────────────────────
ALTER TABLE properties ALTER COLUMN bedrooms SET DEFAULT 0;
ALTER TABLE properties ALTER COLUMN bathrooms SET DEFAULT 0;

-- ──────────────────────────────────────────────────────────
-- 6. Update the landlord FK to SET NULL instead of CASCADE
--    so admin-added properties don't get deleted if a
--    landlord user account is ever removed.
-- ──────────────────────────────────────────────────────────
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_landlord_id_fkey;
ALTER TABLE properties
  ADD CONSTRAINT properties_landlord_id_fkey
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE SET NULL;

-- ──────────────────────────────────────────────────────────
-- 7. Update RLS policy so admin-added properties are editable
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Landlords manage own properties" ON properties;
CREATE POLICY "Landlords manage own properties" ON properties
  FOR ALL USING (landlord_id = auth.uid() OR added_by = 'admin');

-- ──────────────────────────────────────────────────────────
-- 8. New index for property_type filtering
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_price_night ON properties(price_per_night);

-- ──────────────────────────────────────────────────────────
-- 9. Add property_category and apartment_sub_type columns
-- ──────────────────────────────────────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_category TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS apartment_sub_type TEXT;

-- Back-fill property_category from existing property_type values
UPDATE properties SET property_category = CASE
  WHEN property_type IN ('Apartment', 'Duplex', 'Bungalow', 'Semi-Detached', 'Penthouse', 'Studio') THEN 'apartment_type'
  WHEN property_type = 'Land' THEN 'land'
  WHEN property_type = 'Shortlet' THEN 'shortlet'
  WHEN property_type = 'Event Hall' THEN 'event_hall'
  WHEN property_type = 'Office Space' THEN 'office_space'
  ELSE 'apartment_type'
END WHERE property_category IS NULL;

-- Back-fill apartment_sub_type from existing property_type values
UPDATE properties SET apartment_sub_type = CASE
  WHEN property_type = 'Apartment' THEN 'flat'
  WHEN property_type = 'Duplex' THEN 'duplex'
  WHEN property_type = 'Bungalow' THEN 'bungalow'
  WHEN property_type = 'Semi-Detached' THEN 'semi_detached'
  WHEN property_type = 'Penthouse' THEN 'penthouse'
  WHEN property_type = 'Studio' THEN 'studio'
  ELSE NULL
END WHERE property_category = 'apartment_type' AND apartment_sub_type IS NULL;

-- Add CHECK constraints
ALTER TABLE properties
  ADD CONSTRAINT properties_property_category_check
  CHECK (property_category IS NULL OR property_category IN ('apartment_type', 'land', 'shortlet', 'event_hall', 'office_space'));

ALTER TABLE properties
  ADD CONSTRAINT properties_apartment_sub_type_check
  CHECK (apartment_sub_type IS NULL OR apartment_sub_type IN ('bungalow', 'semi_detached', 'detached', 'duplex', 'penthouse', 'flat', 'terrace', 'mansion', 'villa', 'studio', 'self_contain'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(property_category);
CREATE INDEX IF NOT EXISTS idx_properties_sub_type ON properties(apartment_sub_type);

-- Done!
SELECT 'Migration completed successfully' AS status;

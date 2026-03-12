-- DirectKey - Rental Property Connection Platform
-- Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- DROP EXISTING TABLES (for clean re-creation)
-- ============================================
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT DEFAULT 'landlord' CHECK (role IN ('landlord', 'tenant')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES users(id) ON DELETE SET NULL,
  property_name TEXT NOT NULL,
  description TEXT NOT NULL,
  property_type TEXT,
  property_category TEXT NOT NULL CHECK (property_category IN ('apartment_type', 'land', 'shortlet', 'event_hall', 'office_space', 'shop')),
  apartment_sub_type TEXT CHECK (apartment_sub_type IS NULL OR apartment_sub_type IN ('bungalow', 'semi_detached', 'detached', 'duplex', 'penthouse', 'flat', 'terrace', 'mansion', 'villa', 'studio', 'self_contain')),
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  price_per_year DECIMAL(12, 2) NOT NULL DEFAULT 0,
  price_per_night DECIMAL(12, 2) NOT NULL DEFAULT 0,
  price_per_hour DECIMAL(12, 2) NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 0,
  min_nights INTEGER NOT NULL DEFAULT 0,
  monthly_rent DECIMAL(12, 2) NOT NULL DEFAULT 0,
  state TEXT NOT NULL,
  local_government TEXT NOT NULL,
  area TEXT NOT NULL,
  land_area DECIMAL(12, 2) DEFAULT NULL,
  land_unit TEXT DEFAULT NULL CHECK (land_unit IS NULL OR land_unit IN ('sqm', 'acres', 'hectares', 'plots')),
  amenities TEXT[] DEFAULT '{}',
  added_by TEXT DEFAULT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID
);

-- ============================================
-- PROPERTY IMAGES TABLE
-- ============================================
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONNECTIONS TABLE (payment + contact unlock)
-- ============================================
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  tenant_email TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  payment_reference TEXT UNIQUE NOT NULL,
  payment_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'successful', 'failed')),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paystack_reference TEXT
);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, property_id)
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_title TEXT NOT NULL,
  testimonial_text TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_type TEXT DEFAULT 'guest' CHECK (user_type IN ('tenant', 'landlord', 'guest')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(property_category);
CREATE INDEX IF NOT EXISTS idx_properties_sub_type ON properties(apartment_sub_type);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_connections_property ON connections(property_id);
CREATE INDEX IF NOT EXISTS idx_connections_email ON connections(tenant_email);
CREATE INDEX IF NOT EXISTS idx_favorites_email ON favorites(user_email);
CREATE INDEX IF NOT EXISTS idx_favorites_property ON favorites(property_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Public can read approved properties
DROP POLICY IF EXISTS "Public can view approved properties" ON properties;
CREATE POLICY "Public can view approved properties" ON properties
  FOR SELECT USING (status = 'approved');

-- Landlords can manage their own properties
DROP POLICY IF EXISTS "Landlords manage own properties" ON properties;
CREATE POLICY "Landlords manage own properties" ON properties
  FOR ALL USING (landlord_id = auth.uid() OR added_by = 'admin');

-- Public can view property images
DROP POLICY IF EXISTS "Public can view property images" ON property_images;
CREATE POLICY "Public can view property images" ON property_images
  FOR SELECT USING (TRUE);

-- Anyone can insert connections (payments)
DROP POLICY IF EXISTS "Anyone can create connections" ON connections;
CREATE POLICY "Anyone can create connections" ON connections
  FOR INSERT WITH CHECK (TRUE);

-- Users can manage their favorites
DROP POLICY IF EXISTS "Users manage own favorites" ON favorites;
CREATE POLICY "Users manage own favorites" ON favorites
  FOR ALL USING (TRUE);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Increment property views
CREATE OR REPLACE FUNCTION increment_views(prop_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE properties SET views_count = views_count + 1 WHERE id = prop_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

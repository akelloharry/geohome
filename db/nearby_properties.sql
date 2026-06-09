-- GeoHome DB: PostGIS setup, tables, RPC and sample seed data
-- Run in Supabase SQL editor or psql connected to your DB
--
-- If your Supabase database uses a custom quoted schema name such as "Geo Home",
-- run the SQL with an explicit search_path first, or fully qualify the schema.
-- Example:
--
-- SET search_path = '"Geo Home"', public;
--
-- Then run the rest of this file so tables like profiles and properties are created
-- inside the expected schema instead of public.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  address text,
  price integer,
  deposit integer,
  bedrooms integer,
  bathrooms integer,
  property_type text,
  latitude double precision,
  longitude double precision,
  geom geography(Point,4326),
  photos text[],
  sponsored boolean DEFAULT false,
  available boolean DEFAULT true,
  verification_status text DEFAULT 'verified',
  owner_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Trigger to keep geom in sync
CREATE OR REPLACE FUNCTION properties_set_geom() RETURNS trigger AS $$
BEGIN
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_geom
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION properties_set_geom();

-- Agent submissions table
CREATE TABLE IF NOT EXISTS agent_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type text,
  rent integer,
  deposit integer,
  bedrooms integer,
  bathrooms integer,
  furnished boolean,
  water boolean,
  electricity boolean,
  parking boolean,
  security text[],
  backup_power boolean,
  internet boolean,
  latitude double precision,
  longitude double precision,
  photos text[],
  status text DEFAULT 'pending_review',
  created_at timestamptz DEFAULT now()
);

-- Search passes
CREATE TABLE IF NOT EXISTS search_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  purchased_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- RPC: nearby_properties(lat, lng, radius)
CREATE OR REPLACE FUNCTION nearby_properties(lat double precision, lng double precision, radius integer)
RETURNS TABLE (
  id uuid,
  title text,
  address text,
  price integer,
  deposit integer,
  bedrooms integer,
  bathrooms integer,
  property_type text,
  latitude double precision,
  longitude double precision,
  geom geography(Point,4326),
  photos text[],
  sponsored boolean,
  available boolean,
  verification_status text,
  owner_id uuid,
  created_at timestamptz,
  distance double precision
) AS $$
  SELECT p.*, ST_Distance(p.geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance
  FROM properties p
  WHERE p.verification_status = 'verified'
    AND p.available = true
    AND p.geom IS NOT NULL
    AND ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius)
  ORDER BY distance
  LIMIT 500;
$$ LANGUAGE sql STABLE;

-- Sample seed: properties near Kisumu (lat -0.0917, lng 34.7617)
INSERT INTO properties (title, address, price, deposit, bedrooms, bathrooms, property_type, latitude, longitude, photos, sponsored)
VALUES
('Riverside Apartments', 'Along Kisumu River', 15000, 10000, 2, 1, 'rental', -0.0905, 34.7610, ARRAY['/placeholder.svg'], false),
('Campus View Hostel', 'Near University', 8000, 0, 6, 2, 'hostel', -0.0950, 34.7625, ARRAY['/placeholder.svg'], true),
('Cozy BnB', 'Central Kisumu', 5000, 0, 1, 1, 'bnb', -0.0919, 34.7630, ARRAY['/placeholder.svg'], false);

-- Profiles table and trigger for automatic profile creation from auth metadata
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  role text,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_auth_user_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auth_user_insert ON auth.users;
CREATE TRIGGER auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_auth_user_insert();

-- Inquiries table for viewing requests
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  owner_id uuid,
  user_id uuid,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Transactions / escrow table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  tenant_id uuid,
  owner_id uuid,
  amount integer,
  status text DEFAULT 'held',
  release_date timestamptz,
  created_at timestamptz DEFAULT now()
);

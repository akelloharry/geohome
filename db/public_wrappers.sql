-- Public wrappers to expose geohome schema objects under public
-- Run this in the Supabase SQL editor to create temporary public views
-- and a public RPC wrapper while you redeploy the app.

-- Views mapping public.* to geohome.*
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM geohome.profiles;
CREATE OR REPLACE VIEW public.properties AS SELECT * FROM geohome.properties;
CREATE OR REPLACE VIEW public.inquiries AS SELECT * FROM geohome.inquiries;
CREATE OR REPLACE VIEW public.transactions AS SELECT * FROM geohome.transactions;

-- Public wrapper for nearby_properties RPC (calls geohome.properties)
CREATE OR REPLACE FUNCTION public.nearby_properties(lat double precision, lng double precision, radius integer)
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
  FROM geohome.properties p
  WHERE p.verification_status = 'verified'
    AND p.available = true
    AND p.geom IS NOT NULL
    AND ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius)
  ORDER BY distance
  LIMIT 500;
$$ LANGUAGE sql STABLE;

-- Migration: Add GPS coordinates to interventions
-- Add latitude and longitude columns for geolocation tracking

ALTER TABLE interventions
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS gps_captured_at TIMESTAMPTZ;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_interventions_location ON interventions(latitude, longitude);

-- Add comments
COMMENT ON COLUMN interventions.latitude IS 'GPS latitude coordinate (decimal degrees)';
COMMENT ON COLUMN interventions.longitude IS 'GPS longitude coordinate (decimal degrees)';
COMMENT ON COLUMN interventions.gps_accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN interventions.gps_captured_at IS 'Timestamp when GPS was captured';

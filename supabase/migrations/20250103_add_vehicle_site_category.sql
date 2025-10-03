-- Add work_site and vehicle_category columns to vehicles table
-- Migration: 20250103_add_vehicle_site_category

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS work_site VARCHAR(200),
ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(50);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS vehicles_work_site_idx ON vehicles(work_site);
CREATE INDEX IF NOT EXISTS vehicles_category_idx ON vehicles(vehicle_category);
CREATE INDEX IF NOT EXISTS vehicles_client_site_idx ON vehicles(client_id, work_site);
CREATE INDEX IF NOT EXISTS vehicles_client_site_category_idx ON vehicles(client_id, work_site, vehicle_category);

-- Add comments
COMMENT ON COLUMN vehicles.work_site IS 'Work site location where the vehicle is stationed';
COMMENT ON COLUMN vehicles.vehicle_category IS 'Vehicle category: Tracteur, Porteur, Remorque, Semi-Remorque, etc.';

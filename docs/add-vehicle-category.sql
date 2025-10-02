-- ============================================================================
-- ADD VEHICLE CATEGORY TO VEHICLES TABLE
-- Run this in Supabase SQL Editor to add vehicle categorization
-- ============================================================================

-- Step 1: Create ENUM type for vehicle categories
DO $$
BEGIN
  CREATE TYPE vehicle_category AS ENUM ('tracteur', 'porteur', 'remorque', 'ensemble_complet', 'autre');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Type vehicle_category already exists, skipping...';
END $$;

-- Step 2: Add vehicle_category column to vehicles table
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS vehicle_category vehicle_category;

-- Step 3: Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(vehicle_category);

-- ============================================================================
-- Step 4: UPDATE EXISTING VEHICLES WITH CATEGORIES
-- ============================================================================

-- 🚨 IMPORTANT: You need to identify each vehicle type manually
-- Replace the license plates below with your actual data

-- Example updates based on current vehicles:
-- UPDATE vehicles SET vehicle_category = 'tracteur' WHERE license_plate = 'AB-123-CD';
-- UPDATE vehicles SET vehicle_category = 'porteur' WHERE license_plate = 'IJ-789-KL';
-- UPDATE vehicles SET vehicle_category = 'remorque' WHERE license_plate = 'EF-456-GH';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check all vehicles and their categories
SELECT
  license_plate,
  make,
  model,
  vehicle_category,
  CASE
    WHEN vehicle_category IS NULL THEN '⚠️ NEEDS CATEGORIZATION'
    ELSE '✅ OK'
  END as status
FROM vehicles
ORDER BY license_plate;

-- ============================================================================
-- NOTES:
-- ✅ API endpoint already modified to accept category parameter
-- ✅ Frontend components will be updated to filter by category
-- ⚠️  You MUST manually categorize each vehicle using UPDATE statements
-- ============================================================================

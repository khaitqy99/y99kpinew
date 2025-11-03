-- =====================================================
-- Migration: Allow progress > 100% for over-achievement
-- =====================================================
-- This migration updates the check_progress_range constraint
-- to allow progress values greater than 100% when actual exceeds target

-- Drop the old constraint if it exists
ALTER TABLE kpi_records 
  DROP CONSTRAINT IF EXISTS check_progress_range;

-- Add new constraint allowing progress >= 0 (no upper limit)
ALTER TABLE kpi_records 
  ADD CONSTRAINT check_progress_range CHECK (progress >= 0);

-- Increase progress column precision to support large values
ALTER TABLE kpi_records 
  ALTER COLUMN progress TYPE DECIMAL(10,2);

-- Update the trigger function to allow progress > 100%
CREATE OR REPLACE FUNCTION calculate_kpi_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target > 0 THEN
    -- Calculate progress, allow > 100% for over-achievement
    NEW.progress = ROUND((NEW.actual / NEW.target) * 100, 2);
  ELSE
    NEW.progress = 0;
  END IF;
  
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


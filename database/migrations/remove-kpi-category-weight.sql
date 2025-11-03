-- Migration: Remove category and weight columns from kpis table
-- These fields are no longer needed in the KPI creation process

-- Remove category column
ALTER TABLE IF EXISTS kpis DROP COLUMN IF EXISTS category;

-- Remove weight column
ALTER TABLE IF EXISTS kpis DROP COLUMN IF EXISTS weight;

-- Update comment for documentation
COMMENT ON TABLE kpis IS 'KPI definitions without category and weight fields';


-- =====================================================
-- Migration: Increase progress precision to allow values > 999.99%
-- =====================================================
-- This migration increases the DECIMAL precision for progress column
-- from DECIMAL(5,2) to DECIMAL(10,2) to support over-achievement beyond 999.99%

-- Change progress column to allow larger values (up to 99999999.99%)
ALTER TABLE kpi_records 
  ALTER COLUMN progress TYPE DECIMAL(10,2);


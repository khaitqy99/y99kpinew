-- Migration: Add kpi_id column to bonus_penalty_records table
-- This script safely adds the kpi_id column to existing tables

-- Add kpi_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bonus_penalty_records' 
    AND column_name = 'kpi_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.bonus_penalty_records 
    ADD COLUMN kpi_id UUID REFERENCES public.kpis(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added kpi_id column to bonus_penalty_records table';
  ELSE
    RAISE NOTICE 'kpi_id column already exists in bonus_penalty_records table';
  END IF;
END $$;

-- Add index for kpi_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_records_kpi_id ON public.bonus_penalty_records(kpi_id);

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bonus_penalty_records' 
  AND table_schema = 'public'
  AND column_name = 'kpi_id';

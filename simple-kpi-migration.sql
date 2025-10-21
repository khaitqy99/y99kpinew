-- Simple script to add kpi_id column to bonus_penalty_records
-- Run this in Supabase SQL Editor

-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bonus_penalty_records' 
  AND table_schema = 'public'
  AND column_name = 'kpi_id';

-- Add column if it doesn't exist
ALTER TABLE public.bonus_penalty_records 
ADD COLUMN IF NOT EXISTS kpi_id UUID REFERENCES public.kpis(id) ON DELETE SET NULL;

-- Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_records_kpi_id ON public.bonus_penalty_records(kpi_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bonus_penalty_records' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

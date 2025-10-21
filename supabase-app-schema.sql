-- =====================================================
-- APP DATA SCHEMA - Y99 KPI SYSTEM
-- Tables: kpis, kpi_records, notifications
-- Safe to run multiple times (IF NOT EXISTS / OR REPLACE used)
-- =====================================================

-- Ensure uuid extension exists (safe if already created)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- KPIs
CREATE TABLE IF NOT EXISTS public.kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  target NUMERIC,
  unit TEXT,
  frequency TEXT,
  category TEXT,
  weight NUMERIC,
  status TEXT DEFAULT 'active',
  reward_penalty_config JSONB,
  created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPI Records
CREATE TABLE IF NOT EXISTS public.kpi_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  period TEXT,
  target NUMERIC,
  actual NUMERIC,
  progress NUMERIC,
  status TEXT DEFAULT 'not_started',
  start_date DATE,
  end_date DATE,
  submission_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  approved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  submission_details TEXT,
  feedback JSONB DEFAULT '[]',
  attachment TEXT,
  bonus_amount NUMERIC,
  penalty_amount NUMERIC,
  score NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT,
  priority TEXT,
  category TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bonus Penalty Records
CREATE TABLE IF NOT EXISTS public.bonus_penalty_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bonus', 'penalty')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  period TEXT NOT NULL,
  created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add kpi_id column if it doesn't exist (for existing tables)
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
  END IF;
END $$;

-- Update timestamp trigger function (safe replace)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_kpis_updated_at'
  ) THEN
    CREATE TRIGGER update_kpis_updated_at
      BEFORE UPDATE ON public.kpis
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_kpi_records_updated_at'
  ) THEN
    CREATE TRIGGER update_kpi_records_updated_at
      BEFORE UPDATE ON public.kpi_records
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_notifications_updated_at'
  ) THEN
    CREATE TRIGGER update_notifications_updated_at
      BEFORE UPDATE ON public.notifications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_bonus_penalty_records_updated_at'
  ) THEN
    CREATE TRIGGER update_bonus_penalty_records_updated_at
      BEFORE UPDATE ON public.bonus_penalty_records
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_kpis_active ON public.kpis(is_active);
CREATE INDEX IF NOT EXISTS idx_kpis_created_at ON public.kpis(created_at);
CREATE INDEX IF NOT EXISTS idx_kpi_records_active ON public.kpi_records(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_records_created_at ON public.kpi_records(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_records_active ON public.bonus_penalty_records(is_active);
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_records_created_at ON public.bonus_penalty_records(created_at);
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_records_employee_id ON public.bonus_penalty_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_records_kpi_id ON public.bonus_penalty_records(kpi_id);
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_records_period ON public.bonus_penalty_records(period);

-- Disable RLS for development/demo parity with current code
ALTER TABLE public.kpis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_penalty_records DISABLE ROW LEVEL SECURITY;

-- End of app data schema
-- Run this after your auth/base schema to provision application tables



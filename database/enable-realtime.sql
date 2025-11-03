-- =====================================================
-- ENABLE REALTIME SUBSCRIPTIONS
-- =====================================================
-- This file enables Realtime for all tables
-- Run this SQL in Supabase SQL Editor after running schema.sql
-- Safe to run multiple times - will skip if already enabled

DO $$
BEGIN
    -- Enable Realtime replication for departments
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'departments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE departments;
        RAISE NOTICE 'Added departments to supabase_realtime';
    ELSE
        RAISE NOTICE 'departments already in supabase_realtime';
    END IF;
END $$;

DO $$
BEGIN
    -- Enable Realtime replication for roles
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'roles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE roles;
        RAISE NOTICE 'Added roles to supabase_realtime';
    ELSE
        RAISE NOTICE 'roles already in supabase_realtime';
    END IF;
END $$;

DO $$
BEGIN
    -- Enable Realtime replication for employees
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'employees'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE employees;
        RAISE NOTICE 'Added employees to supabase_realtime';
    ELSE
        RAISE NOTICE 'employees already in supabase_realtime';
    END IF;
END $$;

DO $$
BEGIN
    -- Enable Realtime replication for kpis
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'kpis'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE kpis;
        RAISE NOTICE 'Added kpis to supabase_realtime';
    ELSE
        RAISE NOTICE 'kpis already in supabase_realtime';
    END IF;
END $$;

DO $$
BEGIN
    -- Enable Realtime replication for kpi_records
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'kpi_records'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE kpi_records;
        RAISE NOTICE 'Added kpi_records to supabase_realtime';
    ELSE
        RAISE NOTICE 'kpi_records already in supabase_realtime';
    END IF;
END $$;

DO $$
BEGIN
    -- Enable Realtime replication for daily_kpi_progress
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'daily_kpi_progress'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE daily_kpi_progress;
        RAISE NOTICE 'Added daily_kpi_progress to supabase_realtime';
    ELSE
        RAISE NOTICE 'daily_kpi_progress already in supabase_realtime';
    END IF;
END $$;

DO $$
BEGIN
    -- Enable Realtime replication for bonus_penalty_records
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bonus_penalty_records'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bonus_penalty_records;
        RAISE NOTICE 'Added bonus_penalty_records to supabase_realtime';
    ELSE
        RAISE NOTICE 'bonus_penalty_records already in supabase_realtime';
    END IF;
END $$;

DO $$
BEGIN
    -- Enable Realtime replication for notifications
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        RAISE NOTICE 'Added notifications to supabase_realtime';
    ELSE
        RAISE NOTICE 'notifications already in supabase_realtime';
    END IF;
END $$;

-- Summary query to verify all tables are in supabase_realtime
SELECT 
    tablename,
    '✓ Enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
    AND tablename IN ('departments', 'roles', 'employees', 'kpis', 'kpi_records', 
                      'daily_kpi_progress', 'bonus_penalty_records', 'notifications')
ORDER BY tablename;


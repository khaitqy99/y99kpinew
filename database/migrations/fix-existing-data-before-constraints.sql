-- =====================================================
-- FIX EXISTING DATA BEFORE ADDING CONSTRAINTS
-- Chạy file này TRƯỚC khi chạy add-data-integrity-constraints.sql
-- =====================================================

-- =====================================================
-- 1. FIX KPI_RECORDS
-- =====================================================

-- Fix progress values that are out of range
-- Progress should be between 0 and 100
UPDATE kpi_records 
SET progress = 0 
WHERE progress < 0;

UPDATE kpi_records 
SET progress = 100 
WHERE progress > 100;

-- Fix progress where calculation might be wrong
-- Recalculate progress based on actual and target
UPDATE kpi_records 
SET progress = CASE
    WHEN target > 0 THEN 
        LEAST(100, GREATEST(0, ROUND((actual / target) * 100, 2)))
    ELSE 0
END
WHERE target > 0;

-- Fix negative actual values
UPDATE kpi_records 
SET actual = 0 
WHERE actual < 0;

-- Fix negative target values (should not happen, but fix just in case)
UPDATE kpi_records 
SET target = 1 
WHERE target <= 0;

-- Fix date ranges where end_date < start_date
-- Set end_date = start_date + 1 day if end_date < start_date
UPDATE kpi_records 
SET end_date = start_date + INTERVAL '1 day'
WHERE end_date < start_date;

-- Fix bonus_amount negative values
UPDATE kpi_records 
SET bonus_amount = NULL 
WHERE bonus_amount < 0;

-- Fix penalty_amount negative values
UPDATE kpi_records 
SET penalty_amount = NULL 
WHERE penalty_amount < 0;

-- Fix score values that are out of range (0-100)
UPDATE kpi_records 
SET score = 0 
WHERE score < 0;

UPDATE kpi_records 
SET score = 100 
WHERE score > 100;

-- Fix invalid status values
UPDATE kpi_records 
SET status = 'not_started'
WHERE status NOT IN ('not_started', 'in_progress', 'completed', 'pending_approval', 'approved', 'rejected', 'overdue');

-- =====================================================
-- 2. FIX BONUS_PENALTY_RECORDS
-- =====================================================

-- Fix negative or zero amounts
UPDATE bonus_penalty_records 
SET amount = ABS(amount)
WHERE amount <= 0;

-- If amount is still 0 or negative after ABS, set to 1
UPDATE bonus_penalty_records 
SET amount = 1
WHERE amount <= 0;

-- Fix invalid type values
UPDATE bonus_penalty_records 
SET type = 'bonus'
WHERE type NOT IN ('bonus', 'penalty');

-- =====================================================
-- 3. FIX KPIS
-- =====================================================

-- Fix negative or zero target
UPDATE kpis 
SET target = 1
WHERE target <= 0;

-- Fix negative or zero weight
UPDATE kpis 
SET weight = 1
WHERE weight <= 0;

-- Fix invalid frequency values
UPDATE kpis 
SET frequency = 'monthly'
WHERE frequency NOT IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- Fix invalid category values
UPDATE kpis 
SET category = 'performance'
WHERE category NOT IN ('performance', 'quality', 'efficiency', 'compliance', 'growth');

-- Fix invalid status values
UPDATE kpis 
SET status = 'active'
WHERE status NOT IN ('active', 'inactive', 'paused', 'archived');

-- =====================================================
-- 4. FIX DAILY_KPI_PROGRESS
-- =====================================================

-- Fix negative actual_result
UPDATE daily_kpi_progress 
SET actual_result = 0
WHERE actual_result < 0;

-- =====================================================
-- 5. FIX EMPLOYEES
-- =====================================================

-- Fix invalid status values
UPDATE employees 
SET status = 'active'
WHERE status NOT IN ('active', 'inactive', 'suspended', 'terminated');

-- Fix level out of range (1-4)
UPDATE employees 
SET level = 1
WHERE level < 1 OR level > 4;

-- Fix negative login_attempts
UPDATE employees 
SET login_attempts = 0
WHERE login_attempts < 0;

-- =====================================================
-- 6. FIX NOTIFICATIONS
-- =====================================================

-- Fix invalid user_type values
UPDATE notifications 
SET user_type = 'employee'
WHERE user_type NOT IN ('employee', 'admin', 'all');

-- Fix invalid type values
UPDATE notifications 
SET type = 'system'
WHERE type NOT IN ('assigned', 'submitted', 'approved', 'rejected', 'reminder', 'reward', 'penalty', 'deadline', 'system');

-- Fix invalid priority values
UPDATE notifications 
SET priority = 'medium'
WHERE priority NOT IN ('low', 'medium', 'high', 'urgent');

-- Fix invalid category values
UPDATE notifications 
SET category = 'system'
WHERE category NOT IN ('kpi', 'bonus', 'system', 'reminder', 'approval');

-- =====================================================
-- 7. FIX ROLES
-- =====================================================

-- Fix level out of range (1-4)
UPDATE roles 
SET level = 1
WHERE level < 1 OR level > 4;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check for any remaining invalid data
SELECT 'kpi_records - invalid progress' as issue, COUNT(*) as count
FROM kpi_records 
WHERE progress < 0 OR progress > 100
UNION ALL
SELECT 'kpi_records - invalid dates', COUNT(*)
FROM kpi_records 
WHERE end_date < start_date
UNION ALL
SELECT 'kpi_records - invalid target', COUNT(*)
FROM kpi_records 
WHERE target <= 0
UNION ALL
SELECT 'kpi_records - negative actual', COUNT(*)
FROM kpi_records 
WHERE actual < 0
UNION ALL
SELECT 'bonus_penalty_records - invalid amount', COUNT(*)
FROM bonus_penalty_records 
WHERE amount <= 0
UNION ALL
SELECT 'kpis - invalid target', COUNT(*)
FROM kpis 
WHERE target <= 0
UNION ALL
SELECT 'kpis - invalid weight', COUNT(*)
FROM kpis 
WHERE weight <= 0
UNION ALL
SELECT 'daily_kpi_progress - negative result', COUNT(*)
FROM daily_kpi_progress 
WHERE actual_result < 0
UNION ALL
SELECT 'employees - invalid level', COUNT(*)
FROM employees 
WHERE level < 1 OR level > 4
UNION ALL
SELECT 'roles - invalid level', COUNT(*)
FROM roles 
WHERE level < 1 OR level > 4;

-- =====================================================
-- FIX COMPLETE
-- =====================================================


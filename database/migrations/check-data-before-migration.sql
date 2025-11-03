-- =====================================================
-- CHECK DATA BEFORE MIGRATION
-- Chạy file này để kiểm tra dữ liệu có vấn đề gì không
-- trước khi chạy fix-existing-data-before-constraints.sql
-- =====================================================

-- =====================================================
-- CHECK INVALID DATA
-- =====================================================

SELECT '=== KPI_RECORDS ===' as section;

-- Progress out of range
SELECT 'Progress < 0 hoặc > 100' as issue, COUNT(*) as count
FROM kpi_records 
WHERE progress < 0 OR progress > 100;

-- Date range invalid
SELECT 'End date < Start date' as issue, COUNT(*) as count
FROM kpi_records 
WHERE end_date < start_date;

-- Invalid target
SELECT 'Target <= 0' as issue, COUNT(*) as count
FROM kpi_records 
WHERE target <= 0;

-- Negative actual
SELECT 'Actual < 0' as issue, COUNT(*) as count
FROM kpi_records 
WHERE actual < 0;

-- Invalid status
SELECT 'Invalid status' as issue, COUNT(*) as count
FROM kpi_records 
WHERE status NOT IN ('not_started', 'in_progress', 'completed', 'pending_approval', 'approved', 'rejected', 'overdue');

-- Invalid bonus/penalty amounts
SELECT 'Negative bonus amount' as issue, COUNT(*) as count
FROM kpi_records 
WHERE bonus_amount < 0;

SELECT 'Negative penalty amount' as issue, COUNT(*) as count
FROM kpi_records 
WHERE penalty_amount < 0;

-- Invalid score
SELECT 'Score < 0 hoặc > 100' as issue, COUNT(*) as count
FROM kpi_records 
WHERE (score < 0 OR score > 100) AND score IS NOT NULL;

SELECT '=== BONUS_PENALTY_RECORDS ===' as section;

-- Invalid amount
SELECT 'Amount <= 0' as issue, COUNT(*) as count
FROM bonus_penalty_records 
WHERE amount <= 0;

-- Invalid type
SELECT 'Invalid type' as issue, COUNT(*) as count
FROM bonus_penalty_records 
WHERE type NOT IN ('bonus', 'penalty');

SELECT '=== KPIS ===' as section;

-- Invalid target
SELECT 'Target <= 0' as issue, COUNT(*) as count
FROM kpis 
WHERE target <= 0;

-- Invalid weight
SELECT 'Weight <= 0' as issue, COUNT(*) as count
FROM kpis 
WHERE weight <= 0;

-- Invalid frequency
SELECT 'Invalid frequency' as issue, COUNT(*) as count
FROM kpis 
WHERE frequency NOT IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- Invalid category
SELECT 'Invalid category' as issue, COUNT(*) as count
FROM kpis 
WHERE category NOT IN ('performance', 'quality', 'efficiency', 'compliance', 'growth');

-- Invalid status
SELECT 'Invalid status' as issue, COUNT(*) as count
FROM kpis 
WHERE status NOT IN ('active', 'inactive', 'paused', 'archived');

SELECT '=== DAILY_KPI_PROGRESS ===' as section;

-- Negative actual_result
SELECT 'Actual result < 0' as issue, COUNT(*) as count
FROM daily_kpi_progress 
WHERE actual_result < 0;

SELECT '=== EMPLOYEES ===' as section;

-- Invalid status
SELECT 'Invalid status' as issue, COUNT(*) as count
FROM employees 
WHERE status NOT IN ('active', 'inactive', 'suspended', 'terminated');

-- Invalid level
SELECT 'Level < 1 hoặc > 4' as issue, COUNT(*) as count
FROM employees 
WHERE level < 1 OR level > 4;

-- Negative login_attempts
SELECT 'Login attempts < 0' as issue, COUNT(*) as count
FROM employees 
WHERE login_attempts < 0;

SELECT '=== NOTIFICATIONS ===' as section;

-- Invalid user_type
SELECT 'Invalid user_type' as issue, COUNT(*) as count
FROM notifications 
WHERE user_type NOT IN ('employee', 'admin', 'all');

-- Invalid type
SELECT 'Invalid type' as issue, COUNT(*) as count
FROM notifications 
WHERE type NOT IN ('assigned', 'submitted', 'approved', 'rejected', 'reminder', 'reward', 'penalty', 'deadline', 'system');

-- Invalid priority
SELECT 'Invalid priority' as issue, COUNT(*) as count
FROM notifications 
WHERE priority NOT IN ('low', 'medium', 'high', 'urgent');

-- Invalid category
SELECT 'Invalid category' as issue, COUNT(*) as count
FROM notifications 
WHERE category NOT IN ('kpi', 'bonus', 'system', 'reminder', 'approval');

SELECT '=== ROLES ===' as section;

-- Invalid level
SELECT 'Level < 1 hoặc > 4' as issue, COUNT(*) as count
FROM roles 
WHERE level < 1 OR level > 4;

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT '=== SUMMARY ===' as section;

SELECT 
    'TOTAL ISSUES' as issue_type,
    (
        (SELECT COUNT(*) FROM kpi_records WHERE progress < 0 OR progress > 100) +
        (SELECT COUNT(*) FROM kpi_records WHERE end_date < start_date) +
        (SELECT COUNT(*) FROM kpi_records WHERE target <= 0) +
        (SELECT COUNT(*) FROM kpi_records WHERE actual < 0) +
        (SELECT COUNT(*) FROM bonus_penalty_records WHERE amount <= 0) +
        (SELECT COUNT(*) FROM kpis WHERE target <= 0) +
        (SELECT COUNT(*) FROM daily_kpi_progress WHERE actual_result < 0) +
        (SELECT COUNT(*) FROM employees WHERE level < 1 OR level > 4) +
        (SELECT COUNT(*) FROM roles WHERE level < 1 OR level > 4)
    ) as total_issues;

-- Nếu total_issues > 0, cần chạy fix-existing-data-before-constraints.sql


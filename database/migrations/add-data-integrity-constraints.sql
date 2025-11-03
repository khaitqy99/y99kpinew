-- =====================================================
-- DATA INTEGRITY CONSTRAINTS MIGRATION
-- Thêm các constraints để đảm bảo tính toàn vẹn dữ liệu
-- =====================================================

-- ⚠️ QUAN TRỌNG: Chạy file fix-existing-data-before-constraints.sql TRƯỚC
-- để fix dữ liệu hiện có không hợp lệ!

-- =====================================================
-- 1. KPI_RECORDS CONSTRAINTS
-- =====================================================

-- Date range validation: start_date <= end_date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_date_range' 
        AND conrelid = 'kpi_records'::regclass
    ) THEN
        ALTER TABLE kpi_records 
        ADD CONSTRAINT check_date_range CHECK (start_date <= end_date);
    END IF;
END $$;

-- Target must be positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_target_positive' 
        AND conrelid = 'kpi_records'::regclass
    ) THEN
        ALTER TABLE kpi_records 
        ADD CONSTRAINT check_target_positive CHECK (target > 0);
    END IF;
END $$;

-- Progress must be between 0 and 100
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_progress_range' 
        AND conrelid = 'kpi_records'::regclass
    ) THEN
        ALTER TABLE kpi_records 
        ADD CONSTRAINT check_progress_range CHECK (progress >= 0 AND progress <= 100);
    END IF;
END $$;

-- Actual must be non-negative
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_actual_non_negative' 
        AND conrelid = 'kpi_records'::regclass
    ) THEN
        ALTER TABLE kpi_records 
        ADD CONSTRAINT check_actual_non_negative CHECK (actual >= 0);
    END IF;
END $$;

-- Bonus amount must be non-negative (if not NULL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_bonus_amount_non_negative' 
        AND conrelid = 'kpi_records'::regclass
    ) THEN
        ALTER TABLE kpi_records 
        ADD CONSTRAINT check_bonus_amount_non_negative CHECK (bonus_amount IS NULL OR bonus_amount >= 0);
    END IF;
END $$;

-- Penalty amount must be non-negative (if not NULL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_penalty_amount_non_negative' 
        AND conrelid = 'kpi_records'::regclass
    ) THEN
        ALTER TABLE kpi_records 
        ADD CONSTRAINT check_penalty_amount_non_negative CHECK (penalty_amount IS NULL OR penalty_amount >= 0);
    END IF;
END $$;

-- Score must be between 0 and 100 (if not NULL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_score_range' 
        AND conrelid = 'kpi_records'::regclass
    ) THEN
        ALTER TABLE kpi_records 
        ADD CONSTRAINT check_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100));
    END IF;
END $$;

-- Status must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_status_valid' 
        AND conrelid = 'kpi_records'::regclass
    ) THEN
        ALTER TABLE kpi_records 
        ADD CONSTRAINT check_status_valid CHECK (
            status IN ('not_started', 'in_progress', 'completed', 'pending_approval', 'approved', 'rejected', 'overdue')
        );
    END IF;
END $$;

-- Unique constraint: Prevent duplicate KPI assignments
-- Note: Using partial unique index to allow NULL values properly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'unique_kpi_assignment_employee' 
        AND tablename = 'kpi_records'
    ) THEN
        CREATE UNIQUE INDEX unique_kpi_assignment_employee 
        ON kpi_records (kpi_id, employee_id, period) 
        WHERE employee_id IS NOT NULL AND is_active = true;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'unique_kpi_assignment_department' 
        AND tablename = 'kpi_records'
    ) THEN
        CREATE UNIQUE INDEX unique_kpi_assignment_department 
        ON kpi_records (kpi_id, department_id, period) 
        WHERE department_id IS NOT NULL AND is_active = true;
    END IF;
END $$;

-- =====================================================
-- 2. BONUS_PENALTY_RECORDS CONSTRAINTS
-- =====================================================

-- Amount must be positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_bonus_penalty_amount_positive' 
        AND conrelid = 'bonus_penalty_records'::regclass
    ) THEN
        ALTER TABLE bonus_penalty_records 
        ADD CONSTRAINT check_bonus_penalty_amount_positive CHECK (amount > 0);
    END IF;
END $$;

-- Type must be 'bonus' or 'penalty'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_bonus_penalty_type_valid' 
        AND conrelid = 'bonus_penalty_records'::regclass
    ) THEN
        ALTER TABLE bonus_penalty_records 
        ADD CONSTRAINT check_bonus_penalty_type_valid CHECK (type IN ('bonus', 'penalty'));
    END IF;
END $$;

-- =====================================================
-- 3. KPIS CONSTRAINTS
-- =====================================================

-- Target must be positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_kpi_target_positive' 
        AND conrelid = 'kpis'::regclass
    ) THEN
        ALTER TABLE kpis 
        ADD CONSTRAINT check_kpi_target_positive CHECK (target > 0);
    END IF;
END $$;

-- Weight must be positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_kpi_weight_positive' 
        AND conrelid = 'kpis'::regclass
    ) THEN
        ALTER TABLE kpis 
        ADD CONSTRAINT check_kpi_weight_positive CHECK (weight > 0);
    END IF;
END $$;

-- Frequency must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_kpi_frequency_valid' 
        AND conrelid = 'kpis'::regclass
    ) THEN
        ALTER TABLE kpis 
        ADD CONSTRAINT check_kpi_frequency_valid CHECK (
            frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
        );
    END IF;
END $$;

-- Category must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_kpi_category_valid' 
        AND conrelid = 'kpis'::regclass
    ) THEN
        ALTER TABLE kpis 
        ADD CONSTRAINT check_kpi_category_valid CHECK (
            category IN ('performance', 'quality', 'efficiency', 'compliance', 'growth')
        );
    END IF;
END $$;

-- Status must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_kpi_status_valid' 
        AND conrelid = 'kpis'::regclass
    ) THEN
        ALTER TABLE kpis 
        ADD CONSTRAINT check_kpi_status_valid CHECK (
            status IN ('active', 'inactive', 'paused', 'archived')
        );
    END IF;
END $$;

-- =====================================================
-- 4. DAILY_KPI_PROGRESS CONSTRAINTS
-- =====================================================

-- Actual result must be non-negative
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_daily_progress_result_non_negative' 
        AND conrelid = 'daily_kpi_progress'::regclass
    ) THEN
        ALTER TABLE daily_kpi_progress 
        ADD CONSTRAINT check_daily_progress_result_non_negative CHECK (actual_result >= 0);
    END IF;
END $$;

-- =====================================================
-- 5. EMPLOYEES CONSTRAINTS
-- =====================================================

-- Status must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_employee_status_valid' 
        AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees 
        ADD CONSTRAINT check_employee_status_valid CHECK (
            status IN ('active', 'inactive', 'suspended', 'terminated')
        );
    END IF;
END $$;

-- Level must be between 1 and 4
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_employee_level_range' 
        AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees 
        ADD CONSTRAINT check_employee_level_range CHECK (level >= 1 AND level <= 4);
    END IF;
END $$;

-- Login attempts must be non-negative
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_login_attempts_non_negative' 
        AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees 
        ADD CONSTRAINT check_login_attempts_non_negative CHECK (login_attempts >= 0);
    END IF;
END $$;

-- =====================================================
-- 6. NOTIFICATIONS CONSTRAINTS
-- =====================================================

-- User type must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_notification_user_type_valid' 
        AND conrelid = 'notifications'::regclass
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT check_notification_user_type_valid CHECK (
            user_type IN ('employee', 'admin', 'all')
        );
    END IF;
END $$;

-- Type must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_notification_type_valid' 
        AND conrelid = 'notifications'::regclass
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT check_notification_type_valid CHECK (
            type IN ('assigned', 'submitted', 'approved', 'rejected', 'reminder', 'reward', 'penalty', 'deadline', 'system')
        );
    END IF;
END $$;

-- Priority must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_notification_priority_valid' 
        AND conrelid = 'notifications'::regclass
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT check_notification_priority_valid CHECK (
            priority IN ('low', 'medium', 'high', 'urgent')
        );
    END IF;
END $$;

-- Category must be valid enum value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_notification_category_valid' 
        AND conrelid = 'notifications'::regclass
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT check_notification_category_valid CHECK (
            category IN ('kpi', 'bonus', 'system', 'reminder', 'approval')
        );
    END IF;
END $$;

-- =====================================================
-- 7. ROLES CONSTRAINTS
-- =====================================================

-- Level must be between 1 and 4
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_role_level_range' 
        AND conrelid = 'roles'::regclass
    ) THEN
        ALTER TABLE roles 
        ADD CONSTRAINT check_role_level_range CHECK (level >= 1 AND level <= 4);
    END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify constraints were added
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname LIKE 'check_%' 
   OR conname LIKE 'unique_kpi_assignment%'
ORDER BY table_name, constraint_name;


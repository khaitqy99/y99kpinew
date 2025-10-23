-- =====================================================
-- MIGRATION SCRIPT - COMPLETE SCHEMA SETUP
-- Script migration để tạo toàn bộ schema mới
-- =====================================================

-- Bước 1: Tạo extension cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bước 2: Xóa các bảng cũ nếu tồn tại (cẩn thận với dữ liệu)
-- DROP TABLE IF EXISTS bonus_penalty_records CASCADE;
-- DROP TABLE IF EXISTS feedback CASCADE;
-- DROP TABLE IF EXISTS penalty_configs CASCADE;
-- DROP TABLE IF EXISTS bonus_configs CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS daily_kpi_progress CASCADE;
-- DROP TABLE IF EXISTS kpi_records CASCADE;
-- DROP TABLE IF EXISTS kpis CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;
-- DROP TABLE IF EXISTS departments CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;

-- Bước 3: Tạo các bảng theo thứ tự dependency
-- 3.1. Companies (không có dependency)
\i src/schemas/01-companies.sql

-- 3.2. Departments (dependency: companies)
\i src/schemas/02-departments.sql

-- 3.3. Roles (dependency: companies)
\i src/schemas/03-roles.sql

-- 3.4. Employees (dependency: companies, departments, roles)
\i src/schemas/04-employees.sql

-- 3.5. KPIs (dependency: companies, departments, employees)
\i src/schemas/05-kpis.sql

-- 3.6. KPI Records (dependency: kpis, employees, departments)
\i src/schemas/06-kpi-records.sql

-- 3.7. Daily KPI Progress (dependency: departments, employees, kpis)
\i src/schemas/07-daily-kpi-progress.sql

-- 3.8. Notifications (dependency: employees)
\i src/schemas/08-notifications.sql

-- 3.9. Bonus Configs (dependency: companies, employees)
\i src/schemas/09-bonus-configs.sql

-- 3.10. Penalty Configs (dependency: companies, employees)
\i src/schemas/10-penalty-configs.sql

-- 3.11. Feedback (dependency: kpi_records, employees)
\i src/schemas/11-feedback.sql

-- 3.12. Bonus Penalty Records (dependency: employees, kpi_records, bonus_configs, penalty_configs)
\i src/schemas/12-bonus-penalty-records.sql

-- Bước 4: Tạo các view hữu ích
CREATE VIEW employee_summary AS
SELECT 
    e.id,
    e.employee_code,
    e.name,
    e.email,
    e.position,
    e.level,
    e.salary,
    e.status,
    d.name as department_name,
    r.name as role_name,
    r.level as role_level,
    m.name as manager_name,
    e.hire_date,
    e.created_at
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN roles r ON e.role_id = r.id
LEFT JOIN employees m ON e.manager_id = m.id
WHERE e.is_active = true;

CREATE VIEW kpi_performance_summary AS
SELECT 
    kr.id,
    kr.period,
    kr.target,
    kr.actual,
    kr.progress,
    kr.status,
    k.name as kpi_name,
    k.unit,
    k.category,
    k.weight,
    e.name as employee_name,
    d.name as department_name,
    kr.start_date,
    kr.end_date,
    kr.submission_date,
    kr.approval_date,
    kr.bonus_amount,
    kr.penalty_amount,
    kr.score
FROM kpi_records kr
LEFT JOIN kpis k ON kr.kpi_id = k.id
LEFT JOIN employees e ON kr.employee_id = e.id
LEFT JOIN departments d ON kr.department_id = d.id OR e.department_id = d.id
WHERE kr.is_active = true;

CREATE VIEW notification_summary AS
SELECT 
    n.id,
    n.type,
    n.priority,
    n.category,
    n.title,
    n.message,
    n.read,
    n.read_at,
    n.created_at,
    e.name as recipient_name,
    s.name as sender_name,
    n.action_url
FROM notifications n
LEFT JOIN employees e ON n.user_id = e.id
LEFT JOIN employees s ON n.sender_id = s.id
WHERE n.is_active = true;

-- Bước 5: Tạo các function hữu ích
CREATE OR REPLACE FUNCTION get_employee_kpi_summary(emp_id UUID, period_filter VARCHAR DEFAULT NULL)
RETURNS TABLE (
    kpi_name VARCHAR,
    target DECIMAL,
    actual DECIMAL,
    progress DECIMAL,
    status VARCHAR,
    bonus_amount DECIMAL,
    penalty_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.name,
        kr.target,
        kr.actual,
        kr.progress,
        kr.status,
        kr.bonus_amount,
        kr.penalty_amount
    FROM kpi_records kr
    JOIN kpis k ON kr.kpi_id = k.id
    WHERE kr.employee_id = emp_id
    AND kr.is_active = true
    AND (period_filter IS NULL OR kr.period = period_filter)
    ORDER BY kr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_department_kpi_summary(dept_id UUID, period_filter VARCHAR DEFAULT NULL)
RETURNS TABLE (
    kpi_name VARCHAR,
    target DECIMAL,
    actual DECIMAL,
    progress DECIMAL,
    status VARCHAR,
    employee_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.name,
        kr.target,
        kr.actual,
        kr.progress,
        kr.status,
        e.name
    FROM kpi_records kr
    JOIN kpis k ON kr.kpi_id = k.id
    LEFT JOIN employees e ON kr.employee_id = e.id
    WHERE (kr.department_id = dept_id OR e.department_id = dept_id)
    AND kr.is_active = true
    AND (period_filter IS NULL OR kr.period = period_filter)
    ORDER BY kr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Bước 6: Tạo các trigger để tự động cập nhật thống kê
CREATE OR REPLACE FUNCTION update_kpi_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Có thể thêm logic cập nhật thống kê ở đây
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bước 7: Insert dữ liệu mẫu
INSERT INTO companies (id, name, code, description, email, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Y99 Company', 'Y99', 'Công ty Y99', 'contact@y99.vn', true)
ON CONFLICT (id) DO NOTHING;

-- Bước 8: Tạo các index bổ sung cho performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_records_performance 
ON kpi_records(employee_id, period, status) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_performance 
ON notifications(user_id, read, created_at) 
WHERE is_active = true;

-- Bước 9: Cấp quyền cho các role
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Bước 10: Tạo RLS policies (nếu cần)
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy examples:
-- CREATE POLICY "Users can view own data" ON employees FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can view own kpi records" ON kpi_records FOR SELECT USING (auth.uid() = employee_id);
-- CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

COMMENT ON SCHEMA public IS 'Schema chính cho hệ thống quản lý KPI';

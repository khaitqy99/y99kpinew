-- =====================================================
-- KPI MANAGEMENT SYSTEM - DATABASE SCHEMA
-- PostgreSQL với BIGSERIAL (BIGINT) thay UUID
-- =====================================================

-- Enable UUID extension (nếu cần cho các trường khác)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ROLES
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 1,  -- 1=employee, 2=manager, 3=director, 4=admin
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. DEPARTMENTS (không có manager_id constraint ban đầu)
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  manager_id BIGINT,  -- Sẽ thêm constraint sau khi tạo bảng employees
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. EMPLOYEES
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  role_id BIGINT NOT NULL REFERENCES roles(id),
  department_id BIGINT NOT NULL REFERENCES departments(id),
  position VARCHAR(255) NOT NULL,
  level INTEGER DEFAULT 1,
  currency VARCHAR(10) DEFAULT 'VND',
  hire_date DATE,
  contract_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'inactive', 'suspended', 'terminated'
  is_active BOOLEAN DEFAULT true,
  password_hash VARCHAR(255) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. KPIS
-- =====================================================
CREATE TABLE IF NOT EXISTS kpis (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  target DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  frequency VARCHAR(50) NOT NULL,  -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'inactive', 'paused', 'archived'
  reward_penalty_config JSONB,  -- JSON: {"bonus_amount": 1000000, "penalty_amount": 500000, ...}
  created_by BIGINT REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. KPI_RECORDS (BẢNG QUAN TRỌNG NHẤT)
-- =====================================================
CREATE TABLE IF NOT EXISTS kpi_records (
  id BIGSERIAL PRIMARY KEY,
  kpi_id BIGINT NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,  -- NULL nếu giao cho department
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,  -- NULL nếu giao cho employee
  period VARCHAR(50) NOT NULL,  -- "Q1-2025", "M1-2025", etc.
  target DECIMAL(15,2) NOT NULL,
  actual DECIMAL(15,2) DEFAULT 0,
  progress DECIMAL(5,2) DEFAULT 0,  -- Percentage: (actual / target) * 100
  status VARCHAR(50) DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed', 'pending_approval', 'approved', 'rejected', 'overdue'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE,
  approval_date TIMESTAMP WITH TIME ZONE,
  approved_by BIGINT REFERENCES employees(id),
  submission_details TEXT DEFAULT '',
  attachment TEXT,  -- Comma-separated URLs từ Google Drive
  bonus_amount DECIMAL(15,2),
  penalty_amount DECIMAL(15,2),
  score DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint: Phải có employee_id HOẶC department_id (không thể cả hai NULL)
  CONSTRAINT check_assignment CHECK (
    (employee_id IS NOT NULL AND department_id IS NULL) OR
    (employee_id IS NULL AND department_id IS NOT NULL)
  )
);

-- =====================================================
-- 6. DAILY_KPI_PROGRESS
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_kpi_progress (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
  department_name VARCHAR(255) NOT NULL,  -- Denormalized để dễ query
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  responsible_person VARCHAR(255) NOT NULL,  -- Denormalized
  kpi_id BIGINT REFERENCES kpis(id) ON DELETE SET NULL,
  kpi_name VARCHAR(255) NOT NULL,  -- Denormalized
  actual_result DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_by BIGINT REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. BONUS_PENALTY_RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS bonus_penalty_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  kpi_id BIGINT REFERENCES kpis(id) ON DELETE SET NULL,  -- NULL nếu không liên quan KPI
  type VARCHAR(50) NOT NULL,  -- 'bonus' hoặc 'penalty'
  amount DECIMAL(15,2) NOT NULL,
  reason TEXT NOT NULL,
  period VARCHAR(50) NOT NULL,  -- "Q1-2025", etc.
  created_by BIGINT REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. KPI_SUBMISSIONS (Báo cáo chứa nhiều KPI)
-- =====================================================
CREATE TABLE IF NOT EXISTS kpi_submissions (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_details TEXT DEFAULT '',
  attachment TEXT,  -- Comma-separated URLs từ Google Drive
  status VARCHAR(50) DEFAULT 'pending_approval',  -- 'pending_approval', 'approved', 'rejected'
  approval_date TIMESTAMP WITH TIME ZONE,
  approved_by BIGINT REFERENCES employees(id),
  rejection_reason TEXT,  -- Lý do từ chối nếu bị reject
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. KPI_SUBMISSION_ITEMS (Các KPI trong một báo cáo)
-- =====================================================
CREATE TABLE IF NOT EXISTS kpi_submission_items (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES kpi_submissions(id) ON DELETE CASCADE,
  kpi_record_id BIGINT NOT NULL REFERENCES kpi_records(id) ON DELETE CASCADE,
  actual DECIMAL(15,2) NOT NULL,
  progress DECIMAL(5,2) NOT NULL,  -- Percentage: (actual / target) * 100
  notes TEXT,  -- Ghi chú riêng cho từng KPI trong báo cáo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Mỗi KPI record chỉ có thể có một submission item trong một submission
  CONSTRAINT unique_submission_kpi_record UNIQUE(submission_id, kpi_record_id)
);

-- =====================================================
-- 10. NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,  -- employee_id (BIGINT). NULL nếu gửi cho 'all'
  user_type VARCHAR(50) DEFAULT 'employee',  -- 'employee', 'admin', 'all'
  type VARCHAR(50) NOT NULL,  -- 'assigned', 'submitted', 'approved', 'rejected', 'reminder', 'reward', 'penalty', 'deadline', 'system'
  priority VARCHAR(50) DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'
  category VARCHAR(50) DEFAULT 'kpi',  -- 'kpi', 'bonus', 'system', 'reminder', 'approval'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Foreign key chỉ khi user_id không NULL
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Departments
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id) WHERE manager_id IS NOT NULL;

-- Roles
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- KPIs
CREATE INDEX IF NOT EXISTS idx_kpis_department_id ON kpis(department_id);
CREATE INDEX IF NOT EXISTS idx_kpis_status ON kpis(status);
CREATE INDEX IF NOT EXISTS idx_kpis_is_active ON kpis(is_active);

-- KPI Records
CREATE INDEX IF NOT EXISTS idx_kpi_records_kpi_id ON kpi_records(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_records_employee_id ON kpi_records(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kpi_records_department_id ON kpi_records(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kpi_records_status ON kpi_records(status);
CREATE INDEX IF NOT EXISTS idx_kpi_records_period ON kpi_records(period);
CREATE INDEX IF NOT EXISTS idx_kpi_records_end_date ON kpi_records(end_date);
CREATE INDEX IF NOT EXISTS idx_kpi_records_start_date ON kpi_records(start_date);

-- Daily KPI Progress
CREATE INDEX IF NOT EXISTS idx_daily_kpi_progress_date ON daily_kpi_progress(date);
CREATE INDEX IF NOT EXISTS idx_daily_kpi_progress_department_id ON daily_kpi_progress(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_kpi_progress_employee_id ON daily_kpi_progress(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_kpi_progress_kpi_id ON daily_kpi_progress(kpi_id) WHERE kpi_id IS NOT NULL;

-- Bonus Penalty Records
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_employee_id ON bonus_penalty_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_kpi_id ON bonus_penalty_records(kpi_id) WHERE kpi_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_period ON bonus_penalty_records(period);
CREATE INDEX IF NOT EXISTS idx_bonus_penalty_type ON bonus_penalty_records(type);

-- KPI Submissions
CREATE INDEX IF NOT EXISTS idx_kpi_submissions_employee_id ON kpi_submissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_kpi_submissions_status ON kpi_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kpi_submissions_submission_date ON kpi_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_kpi_submissions_approved_by ON kpi_submissions(approved_by) WHERE approved_by IS NOT NULL;

-- KPI Submission Items
CREATE INDEX IF NOT EXISTS idx_kpi_submission_items_submission_id ON kpi_submission_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_kpi_submission_items_kpi_record_id ON kpi_submission_items(kpi_record_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_records_updated_at BEFORE UPDATE ON kpi_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_kpi_progress_updated_at BEFORE UPDATE ON daily_kpi_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bonus_penalty_records_updated_at BEFORE UPDATE ON bonus_penalty_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINTS AFTER ALL TABLES CREATED
-- =====================================================

-- Thêm constraint manager_id cho departments (sau khi employees đã được tạo)
ALTER TABLE departments 
  ADD CONSTRAINT fk_departments_manager 
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Function to auto-calculate progress in kpi_records
CREATE OR REPLACE FUNCTION calculate_kpi_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target > 0 THEN
    NEW.progress = ROUND((NEW.actual / NEW.target) * 100, 2);
  ELSE
    NEW.progress = 0;
  END IF;
  
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate progress
CREATE TRIGGER calculate_progress_on_insert BEFORE INSERT ON kpi_records
  FOR EACH ROW EXECUTE FUNCTION calculate_kpi_progress();

CREATE TRIGGER calculate_progress_on_update BEFORE UPDATE ON kpi_records
  FOR EACH ROW 
  WHEN (OLD.actual IS DISTINCT FROM NEW.actual OR OLD.target IS DISTINCT FROM NEW.target)
  EXECUTE FUNCTION calculate_kpi_progress();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE departments IS 'Bảng lưu thông tin phòng ban';
COMMENT ON TABLE roles IS 'Bảng lưu thông tin vai trò (quyền)';
COMMENT ON TABLE employees IS 'Bảng lưu thông tin nhân viên';
COMMENT ON TABLE kpis IS 'Bảng lưu KPI template (mẫu KPI)';
COMMENT ON TABLE kpi_records IS 'Bảng lưu KPI được giao, submission, approval';
COMMENT ON TABLE daily_kpi_progress IS 'Bảng lưu tiến độ KPI hàng ngày';
COMMENT ON TABLE bonus_penalty_records IS 'Bảng lưu thông tin thưởng/phạt';
COMMENT ON TABLE notifications IS 'Bảng lưu thông báo cho users';

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
-- Enable Realtime for all tables to allow real-time data synchronization
-- Safe to run multiple times - will skip if already enabled

DO $$
BEGIN
    -- Enable Realtime replication for departments
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'departments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE departments;
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
    END IF;
END $$;


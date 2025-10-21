-- =====================================================
-- SCHEMA CHO PHẦN ĐĂNG NHẬP - Y99 KPI SYSTEM
-- =====================================================
-- Schema đơn giản và tối ưu cho hệ thống đăng nhập
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BẢNG CÔNG TY (COMPANIES)
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. BẢNG PHÒNG BAN (DEPARTMENTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  manager_id UUID, -- Sẽ được thêm FK sau khi tạo bảng employees
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_dept_code_per_company UNIQUE (company_id, code)
);

-- =====================================================
-- 3. BẢNG VAI TRÒ (ROLES)
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 1, -- 1=employee, 2=manager, 3=director, 4=admin
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_role_code_per_company UNIQUE (company_id, code)
);

-- =====================================================
-- 4. BẢNG NHÂN VIÊN (EMPLOYEES) - BẢNG CHÍNH CHO ĐĂNG NHẬP
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  -- Work information
  role_id UUID NOT NULL REFERENCES roles(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  manager_id UUID REFERENCES employees(id),
  position TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  
  -- Salary and contract
  salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'VND',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contract_type TEXT DEFAULT 'full_time',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
  is_active BOOLEAN DEFAULT true,
  
  -- Authentication fields (QUAN TRỌNG CHO ĐĂNG NHẬP)
  password_hash TEXT NOT NULL, -- Mật khẩu (plain text cho demo)
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_employee_code_per_company UNIQUE (company_id, employee_code),
  CONSTRAINT unique_email_per_company UNIQUE (company_id, email),
  CONSTRAINT valid_salary CHECK (salary >= 0)
);

-- =====================================================
-- 5. THÊM FOREIGN KEY CHO DEPARTMENTS.MANAGER_ID
-- =====================================================
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_manager_id 
FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- =====================================================
-- 6. INDEXES CHO PERFORMANCE
-- =====================================================

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Department indexes
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);

-- Role indexes
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);

-- Employee indexes (QUAN TRỌNG CHO ĐĂNG NHẬP)
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(company_id, email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON employees(company_id, employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);

-- =====================================================
-- 7. TRIGGERS CHO UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON companies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at 
  BEFORE UPDATE ON departments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON employees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. TẮT ROW LEVEL SECURITY (RLS) CHO ĐĂNG NHẬP
-- =====================================================
-- Tắt RLS để tránh vấn đề đăng nhập
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. DỮ LIỆU MẪU CHO ĐĂNG NHẬP
-- =====================================================

-- Tạo company mặc định
INSERT INTO companies (
  id,
  name,
  code,
  description,
  email,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Y99 Company',
  'Y99',
  'Công ty Y99',
  'contact@y99.vn',
  true
) ON CONFLICT (id) DO NOTHING;

-- Tạo department mặc định
INSERT INTO departments (
  id,
  company_id,
  name,
  code,
  description,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Quản lý',
  'MGMT',
  'Phòng ban quản lý',
  true
) ON CONFLICT (id) DO NOTHING;

-- Tạo role admin
INSERT INTO roles (
  id,
  company_id,
  name,
  code,
  description,
  level,
  permissions,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'Administrator',
  'ADMIN',
  'Quản trị viên hệ thống',
  4,
  '["all"]',
  true
) ON CONFLICT (id) DO NOTHING;

-- Tạo role employee
INSERT INTO roles (
  id,
  company_id,
  name,
  code,
  description,
  level,
  permissions,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440000',
  'Employee',
  'EMP',
  'Nhân viên',
  1,
  '["read_own_data", "update_own_kpi"]',
  true
) ON CONFLICT (id) DO NOTHING;

-- Tạo employee admin
INSERT INTO employees (
  id,
  company_id,
  employee_code,
  name,
  email,
  phone,
  avatar_url,
  role_id,
  department_id,
  position,
  level,
  salary,
  currency,
  hire_date,
  contract_type,
  status,
  is_active,
  password_hash,
  last_login,
  login_attempts,
  locked_until
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'ADMIN001',
  'Admin User',
  'db@y99.vn',
  '0123456789',
  'https://picsum.photos/seed/admin/40/40',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  'System Administrator',
  4,
  50000000,
  'VND',
  '2024-01-01',
  'full_time',
  'active',
  true,
  '12345678', -- Mật khẩu demo
  null,
  0,
  null
) ON CONFLICT (id) DO NOTHING;

-- Tạo employee demo
INSERT INTO employees (
  id,
  company_id,
  employee_code,
  name,
  email,
  phone,
  avatar_url,
  role_id,
  department_id,
  position,
  level,
  salary,
  currency,
  hire_date,
  contract_type,
  status,
  is_active,
  password_hash,
  last_login,
  login_attempts,
  locked_until
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  'EMP001',
  'Nguyễn Văn A',
  'employee@y99.vn',
  '0987654321',
  'https://picsum.photos/seed/employee/40/40',
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440001',
  'Nhân viên',
  1,
  15000000,
  'VND',
  '2024-01-15',
  'full_time',
  'active',
  true,
  '12345678', -- Mật khẩu demo
  null,
  0,
  null
) ON CONFLICT (id) DO NOTHING;

-- Cập nhật department manager
UPDATE departments 
SET manager_id = '550e8400-e29b-41d4-a716-446655440003'
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- =====================================================
-- 10. KIỂM TRA DỮ LIỆU ĐÃ TẠO
-- =====================================================
SELECT 
  e.name as employee_name,
  e.email,
  e.position,
  r.name as role_name,
  r.level as role_level,
  d.name as department_name,
  c.name as company_name
FROM employees e
JOIN roles r ON e.role_id = r.id
JOIN departments d ON e.department_id = d.id
JOIN companies c ON e.company_id = c.id
WHERE e.email IN ('db@y99.vn', 'employee@y99.vn')
ORDER BY e.email;

-- =====================================================
-- 11. KPI, KPI RECORDS, NOTIFICATIONS (APPLICATION DATA)
-- =====================================================

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

-- Updated_at triggers for new tables
CREATE TRIGGER update_kpis_updated_at 
  BEFORE UPDATE ON public.kpis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_records_updated_at 
  BEFORE UPDATE ON public.kpi_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_kpis_active ON public.kpis(is_active);
CREATE INDEX IF NOT EXISTS idx_kpis_created_at ON public.kpis(created_at);
CREATE INDEX IF NOT EXISTS idx_kpi_records_active ON public.kpi_records(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_records_created_at ON public.kpi_records(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Disable RLS to match current code behavior
ALTER TABLE public.kpis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SCHEMA ĐẦY ĐỦ HOÀN THÀNH
-- =====================================================
/*
Tài khoản demo:
- Admin: db@y99.vn / 12345678
- Employee: employee@y99.vn / 12345678

Cấu trúc bảng chính:
- companies, departments, roles, employees
- kpis, kpi_records, notifications

Ghi chú:
- Đã tắt RLS cho mục đích demo/dev. Bật và viết policy khi lên prod.
*/

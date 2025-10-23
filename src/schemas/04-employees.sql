-- =====================================================
-- EMPLOYEES SCHEMA
-- Quản lý thông tin nhân viên
-- =====================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role_id UUID NOT NULL REFERENCES roles(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    manager_id UUID REFERENCES employees(id),
    position VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1,
    salary DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'VND',
    hire_date DATE NOT NULL,
    contract_type VARCHAR(50) DEFAULT 'full_time',
    contract_start_date DATE,
    contract_end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_employee_code_per_company UNIQUE (company_id, employee_code),
    CONSTRAINT check_level_range CHECK (level >= 1 AND level <= 10),
    CONSTRAINT check_salary_positive CHECK (salary >= 0),
    CONSTRAINT check_login_attempts_non_negative CHECK (login_attempts >= 0),
    CONSTRAINT check_contract_dates CHECK (contract_end_date IS NULL OR contract_start_date IS NULL OR contract_end_date >= contract_start_date),
    CONSTRAINT check_status_valid CHECK (status IN ('active', 'inactive', 'suspended', 'terminated', 'on_leave'))
);

-- Indexes
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_employee_code ON employees(employee_code);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_role_id ON employees(role_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_level ON employees(level);

-- Triggers
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();

-- Comments
COMMENT ON TABLE employees IS 'Bảng quản lý thông tin nhân viên';
COMMENT ON COLUMN employees.id IS 'ID duy nhất của nhân viên';
COMMENT ON COLUMN employees.company_id IS 'ID công ty';
COMMENT ON COLUMN employees.employee_code IS 'Mã nhân viên';
COMMENT ON COLUMN employees.name IS 'Tên nhân viên';
COMMENT ON COLUMN employees.email IS 'Email nhân viên';
COMMENT ON COLUMN employees.phone IS 'Số điện thoại';
COMMENT ON COLUMN employees.avatar_url IS 'URL avatar';
COMMENT ON COLUMN employees.role_id IS 'ID vai trò';
COMMENT ON COLUMN employees.department_id IS 'ID phòng ban';
COMMENT ON COLUMN employees.position IS 'Vị trí công việc';
COMMENT ON COLUMN employees.level IS 'Cấp độ nhân viên';
COMMENT ON COLUMN employees.salary IS 'Mức lương';
COMMENT ON COLUMN employees.currency IS 'Đơn vị tiền tệ';
COMMENT ON COLUMN employees.hire_date IS 'Ngày tuyển dụng';
COMMENT ON COLUMN employees.contract_type IS 'Loại hợp đồng';
COMMENT ON COLUMN employees.contract_start_date IS 'Ngày bắt đầu hợp đồng';
COMMENT ON COLUMN employees.contract_end_date IS 'Ngày kết thúc hợp đồng';
COMMENT ON COLUMN employees.status IS 'Trạng thái nhân viên';
COMMENT ON COLUMN employees.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN employees.password_hash IS 'Mã hash mật khẩu';
COMMENT ON COLUMN employees.last_login IS 'Lần đăng nhập cuối';
COMMENT ON COLUMN employees.login_attempts IS 'Số lần đăng nhập thất bại';
COMMENT ON COLUMN employees.locked_until IS 'Thời gian khóa tài khoản';
COMMENT ON COLUMN employees.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN employees.updated_at IS 'Thời gian cập nhật cuối';

-- Update departments manager_id foreign key after employees table is created
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
    FOREIGN KEY (manager_id) REFERENCES employees(id);

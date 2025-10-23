-- =====================================================
-- DEPARTMENTS SCHEMA
-- Quản lý phòng ban trong công ty
-- =====================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    manager_id UUID, -- Sẽ reference đến employees sau
    parent_department_id UUID REFERENCES departments(id),
    level INTEGER DEFAULT 1,
    budget DECIMAL(15,2),
    cost_center VARCHAR(50),
    location VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_department_code_per_company UNIQUE (company_id, code),
    CONSTRAINT check_level_positive CHECK (level > 0)
);

-- Indexes
CREATE INDEX idx_departments_company_id ON departments(company_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX idx_departments_active ON departments(is_active);
CREATE INDEX idx_departments_level ON departments(level);

-- Triggers
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_departments_updated_at();

-- Comments
COMMENT ON TABLE departments IS 'Bảng quản lý phòng ban';
COMMENT ON COLUMN departments.id IS 'ID duy nhất của phòng ban';
COMMENT ON COLUMN departments.company_id IS 'ID công ty';
COMMENT ON COLUMN departments.name IS 'Tên phòng ban';
COMMENT ON COLUMN departments.code IS 'Mã phòng ban';
COMMENT ON COLUMN departments.description IS 'Mô tả phòng ban';
COMMENT ON COLUMN departments.manager_id IS 'ID trưởng phòng ban';
COMMENT ON COLUMN departments.parent_department_id IS 'ID phòng ban cha (cho cấu trúc phân cấp)';
COMMENT ON COLUMN departments.level IS 'Cấp độ trong cấu trúc tổ chức';
COMMENT ON COLUMN departments.budget IS 'Ngân sách phòng ban';
COMMENT ON COLUMN departments.cost_center IS 'Mã trung tâm chi phí';
COMMENT ON COLUMN departments.location IS 'Vị trí địa lý';
COMMENT ON COLUMN departments.phone IS 'Số điện thoại phòng ban';
COMMENT ON COLUMN departments.email IS 'Email phòng ban';
COMMENT ON COLUMN departments.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN departments.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN departments.updated_at IS 'Thời gian cập nhật cuối';

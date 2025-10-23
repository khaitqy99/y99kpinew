-- =====================================================
-- ROLES SCHEMA
-- Quản lý vai trò và quyền hạn trong hệ thống
-- =====================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_role_code_per_company UNIQUE (company_id, code),
    CONSTRAINT check_level_range CHECK (level >= 1 AND level <= 10),
    CONSTRAINT check_permissions_json CHECK (jsonb_typeof(permissions) = 'array')
);

-- Indexes
CREATE INDEX idx_roles_company_id ON roles(company_id);
CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_active ON roles(is_active);
CREATE INDEX idx_roles_system ON roles(is_system_role);

-- Triggers
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

-- Comments
COMMENT ON TABLE roles IS 'Bảng quản lý vai trò và quyền hạn';
COMMENT ON COLUMN roles.id IS 'ID duy nhất của vai trò';
COMMENT ON COLUMN roles.company_id IS 'ID công ty';
COMMENT ON COLUMN roles.name IS 'Tên vai trò';
COMMENT ON COLUMN roles.code IS 'Mã vai trò';
COMMENT ON COLUMN roles.description IS 'Mô tả vai trò';
COMMENT ON COLUMN roles.level IS 'Cấp độ vai trò (1-10)';
COMMENT ON COLUMN roles.permissions IS 'Danh sách quyền hạn (JSON array)';
COMMENT ON COLUMN roles.is_system_role IS 'Có phải vai trò hệ thống không';
COMMENT ON COLUMN roles.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN roles.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN roles.updated_at IS 'Thời gian cập nhật cuối';

-- Insert default roles
INSERT INTO roles (company_id, name, code, description, level, permissions, is_system_role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'System Administrator', 'SYSTEM_ADMIN', 'Quản trị viên hệ thống', 10, '["*"]', true),
('550e8400-e29b-41d4-a716-446655440000', 'Director', 'DIRECTOR', 'Giám đốc', 9, '["read_all", "write_all", "approve_all"]', false),
('550e8400-e29b-41d4-a716-446655440000', 'Manager', 'MANAGER', 'Quản lý', 7, '["read_department", "write_department", "approve_department"]', false),
('550e8400-e29b-41d4-a716-446655440000', 'Team Lead', 'TEAM_LEAD', 'Trưởng nhóm', 5, '["read_team", "write_team"]', false),
('550e8400-e29b-41d4-a716-446655440000', 'Employee', 'EMPLOYEE', 'Nhân viên', 1, '["read_own", "write_own"]', false);

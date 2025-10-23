-- =====================================================
-- PENALTY CONFIGS SCHEMA
-- Quản lý cấu hình phạt
-- =====================================================

CREATE TABLE penalty_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_amount_positive CHECK (amount > 0),
    CONSTRAINT check_conditions_json CHECK (jsonb_typeof(conditions) = 'array')
);

-- Indexes
CREATE INDEX idx_penalty_configs_company_id ON penalty_configs(company_id);
CREATE INDEX idx_penalty_configs_created_by ON penalty_configs(created_by);
CREATE INDEX idx_penalty_configs_active ON penalty_configs(is_active);
CREATE INDEX idx_penalty_configs_amount ON penalty_configs(amount);

-- Triggers
CREATE OR REPLACE FUNCTION update_penalty_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_penalty_configs_updated_at
    BEFORE UPDATE ON penalty_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_penalty_configs_updated_at();

-- Comments
COMMENT ON TABLE penalty_configs IS 'Bảng quản lý cấu hình phạt';
COMMENT ON COLUMN penalty_configs.id IS 'ID duy nhất của cấu hình phạt';
COMMENT ON COLUMN penalty_configs.company_id IS 'ID công ty';
COMMENT ON COLUMN penalty_configs.name IS 'Tên cấu hình phạt';
COMMENT ON COLUMN penalty_configs.description IS 'Mô tả';
COMMENT ON COLUMN penalty_configs.amount IS 'Số tiền phạt';
COMMENT ON COLUMN penalty_configs.currency IS 'Đơn vị tiền tệ';
COMMENT ON COLUMN penalty_configs.conditions IS 'Điều kiện phạt (JSON array)';
COMMENT ON COLUMN penalty_configs.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN penalty_configs.created_by IS 'Người tạo';
COMMENT ON COLUMN penalty_configs.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN penalty_configs.updated_at IS 'Thời gian cập nhật cuối';

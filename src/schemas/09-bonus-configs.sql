-- =====================================================
-- BONUS CONFIGS SCHEMA
-- Quản lý cấu hình thưởng
-- =====================================================

CREATE TABLE bonus_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    frequency VARCHAR(20) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_amount_positive CHECK (amount > 0),
    CONSTRAINT check_frequency_valid CHECK (frequency IN ('monthly', 'quarterly', 'annually', 'one_time')),
    CONSTRAINT check_conditions_json CHECK (jsonb_typeof(conditions) = 'array')
);

-- Indexes
CREATE INDEX idx_bonus_configs_company_id ON bonus_configs(company_id);
CREATE INDEX idx_bonus_configs_created_by ON bonus_configs(created_by);
CREATE INDEX idx_bonus_configs_frequency ON bonus_configs(frequency);
CREATE INDEX idx_bonus_configs_active ON bonus_configs(is_active);
CREATE INDEX idx_bonus_configs_amount ON bonus_configs(amount);

-- Triggers
CREATE OR REPLACE FUNCTION update_bonus_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bonus_configs_updated_at
    BEFORE UPDATE ON bonus_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_bonus_configs_updated_at();

-- Comments
COMMENT ON TABLE bonus_configs IS 'Bảng quản lý cấu hình thưởng';
COMMENT ON COLUMN bonus_configs.id IS 'ID duy nhất của cấu hình thưởng';
COMMENT ON COLUMN bonus_configs.company_id IS 'ID công ty';
COMMENT ON COLUMN bonus_configs.name IS 'Tên cấu hình thưởng';
COMMENT ON COLUMN bonus_configs.description IS 'Mô tả';
COMMENT ON COLUMN bonus_configs.amount IS 'Số tiền thưởng';
COMMENT ON COLUMN bonus_configs.currency IS 'Đơn vị tiền tệ';
COMMENT ON COLUMN bonus_configs.frequency IS 'Tần suất thưởng';
COMMENT ON COLUMN bonus_configs.conditions IS 'Điều kiện thưởng (JSON array)';
COMMENT ON COLUMN bonus_configs.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN bonus_configs.created_by IS 'Người tạo';
COMMENT ON COLUMN bonus_configs.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN bonus_configs.updated_at IS 'Thời gian cập nhật cuối';

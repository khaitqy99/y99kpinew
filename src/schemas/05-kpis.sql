-- =====================================================
-- KPIS SCHEMA
-- Quản lý các chỉ số KPI của công ty
-- =====================================================

CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID NOT NULL REFERENCES departments(id),
    target DECIMAL(15,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.00,
    status VARCHAR(20) DEFAULT 'active',
    reward_penalty_config JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_target_positive CHECK (target > 0),
    CONSTRAINT check_weight_range CHECK (weight >= 0 AND weight <= 100),
    CONSTRAINT check_frequency_valid CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    CONSTRAINT check_category_valid CHECK (category IN ('performance', 'quality', 'efficiency', 'compliance', 'growth', 'financial', 'customer', 'innovation')),
    CONSTRAINT check_status_valid CHECK (status IN ('active', 'inactive', 'paused', 'archived')),
    CONSTRAINT check_reward_penalty_config_json CHECK (jsonb_typeof(reward_penalty_config) = 'object')
);

-- Indexes
CREATE INDEX idx_kpis_company_id ON kpis(company_id);
CREATE INDEX idx_kpis_department_id ON kpis(department_id);
CREATE INDEX idx_kpis_created_by ON kpis(created_by);
CREATE INDEX idx_kpis_frequency ON kpis(frequency);
CREATE INDEX idx_kpis_category ON kpis(category);
CREATE INDEX idx_kpis_status ON kpis(status);
CREATE INDEX idx_kpis_active ON kpis(is_active);
CREATE INDEX idx_kpis_weight ON kpis(weight);

-- Triggers
CREATE OR REPLACE FUNCTION update_kpis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kpis_updated_at
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_kpis_updated_at();

-- Comments
COMMENT ON TABLE kpis IS 'Bảng quản lý các chỉ số KPI';
COMMENT ON COLUMN kpis.id IS 'ID duy nhất của KPI';
COMMENT ON COLUMN kpis.company_id IS 'ID công ty';
COMMENT ON COLUMN kpis.name IS 'Tên KPI';
COMMENT ON COLUMN kpis.description IS 'Mô tả KPI';
COMMENT ON COLUMN kpis.department_id IS 'ID phòng ban';
COMMENT ON COLUMN kpis.target IS 'Mục tiêu KPI';
COMMENT ON COLUMN kpis.unit IS 'Đơn vị đo lường';
COMMENT ON COLUMN kpis.frequency IS 'Tần suất đánh giá';
COMMENT ON COLUMN kpis.category IS 'Danh mục KPI';
COMMENT ON COLUMN kpis.weight IS 'Trọng số KPI (%)';
COMMENT ON COLUMN kpis.status IS 'Trạng thái KPI';
COMMENT ON COLUMN kpis.reward_penalty_config IS 'Cấu hình thưởng phạt (JSON)';
COMMENT ON COLUMN kpis.created_by IS 'Người tạo KPI';
COMMENT ON COLUMN kpis.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN kpis.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN kpis.updated_at IS 'Thời gian cập nhật cuối';

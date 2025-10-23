-- =====================================================
-- BONUS PENALTY RECORDS SCHEMA
-- Quản lý lịch sử thưởng phạt
-- =====================================================

CREATE TABLE bonus_penalty_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    kpi_record_id UUID REFERENCES kpi_records(id) ON DELETE SET NULL,
    bonus_config_id UUID REFERENCES bonus_configs(id) ON DELETE SET NULL,
    penalty_config_id UUID REFERENCES penalty_configs(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    type VARCHAR(20) NOT NULL, -- 'bonus' or 'penalty'
    reason TEXT NOT NULL,
    period VARCHAR(20) NOT NULL, -- Format: YYYY-MM, YYYY-Q1, YYYY
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_amount_non_zero CHECK (amount != 0),
    CONSTRAINT check_type_valid CHECK (type IN ('bonus', 'penalty')),
    CONSTRAINT check_status_valid CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    CONSTRAINT check_bonus_or_penalty_config CHECK (
        (type = 'bonus' AND bonus_config_id IS NOT NULL AND penalty_config_id IS NULL) OR
        (type = 'penalty' AND penalty_config_id IS NOT NULL AND bonus_config_id IS NULL)
    )
);

-- Indexes
CREATE INDEX idx_bonus_penalty_records_employee_id ON bonus_penalty_records(employee_id);
CREATE INDEX idx_bonus_penalty_records_kpi_record_id ON bonus_penalty_records(kpi_record_id);
CREATE INDEX idx_bonus_penalty_records_bonus_config_id ON bonus_penalty_records(bonus_config_id);
CREATE INDEX idx_bonus_penalty_records_penalty_config_id ON bonus_penalty_records(penalty_config_id);
CREATE INDEX idx_bonus_penalty_records_type ON bonus_penalty_records(type);
CREATE INDEX idx_bonus_penalty_records_status ON bonus_penalty_records(status);
CREATE INDEX idx_bonus_penalty_records_period ON bonus_penalty_records(period);
CREATE INDEX idx_bonus_penalty_records_approved_by ON bonus_penalty_records(approved_by);
CREATE INDEX idx_bonus_penalty_records_active ON bonus_penalty_records(is_active);
CREATE INDEX idx_bonus_penalty_records_created_at ON bonus_penalty_records(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_bonus_penalty_records_employee_period ON bonus_penalty_records(employee_id, period);
CREATE INDEX idx_bonus_penalty_records_employee_type ON bonus_penalty_records(employee_id, type);
CREATE INDEX idx_bonus_penalty_records_employee_status ON bonus_penalty_records(employee_id, status);

-- Triggers
CREATE OR REPLACE FUNCTION update_bonus_penalty_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bonus_penalty_records_updated_at
    BEFORE UPDATE ON bonus_penalty_records
    FOR EACH ROW
    EXECUTE FUNCTION update_bonus_penalty_records_updated_at();

-- Comments
COMMENT ON TABLE bonus_penalty_records IS 'Bảng quản lý lịch sử thưởng phạt';
COMMENT ON COLUMN bonus_penalty_records.id IS 'ID duy nhất của bản ghi thưởng phạt';
COMMENT ON COLUMN bonus_penalty_records.employee_id IS 'ID nhân viên';
COMMENT ON COLUMN bonus_penalty_records.kpi_record_id IS 'ID bản ghi KPI liên quan';
COMMENT ON COLUMN bonus_penalty_records.bonus_config_id IS 'ID cấu hình thưởng';
COMMENT ON COLUMN bonus_penalty_records.penalty_config_id IS 'ID cấu hình phạt';
COMMENT ON COLUMN bonus_penalty_records.amount IS 'Số tiền';
COMMENT ON COLUMN bonus_penalty_records.currency IS 'Đơn vị tiền tệ';
COMMENT ON COLUMN bonus_penalty_records.type IS 'Loại (thưởng/phạt)';
COMMENT ON COLUMN bonus_penalty_records.reason IS 'Lý do';
COMMENT ON COLUMN bonus_penalty_records.period IS 'Kỳ';
COMMENT ON COLUMN bonus_penalty_records.status IS 'Trạng thái';
COMMENT ON COLUMN bonus_penalty_records.approved_by IS 'Người duyệt';
COMMENT ON COLUMN bonus_penalty_records.approved_at IS 'Thời gian duyệt';
COMMENT ON COLUMN bonus_penalty_records.paid_at IS 'Thời gian thanh toán';
COMMENT ON COLUMN bonus_penalty_records.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN bonus_penalty_records.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN bonus_penalty_records.updated_at IS 'Thời gian cập nhật cuối';

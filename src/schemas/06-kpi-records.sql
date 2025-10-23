-- =====================================================
-- KPI RECORDS SCHEMA
-- Quản lý bản ghi thực hiện KPI của nhân viên/phòng ban
-- =====================================================

CREATE TABLE kpi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- Format: YYYY-MM, YYYY-Q1, YYYY
    target DECIMAL(15,2) NOT NULL,
    actual DECIMAL(15,2) DEFAULT 0,
    progress DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'not_started',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    submission_date TIMESTAMP WITH TIME ZONE,
    approval_date TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES employees(id),
    submission_details TEXT,
    attachment TEXT,
    bonus_amount DECIMAL(15,2) DEFAULT 0,
    penalty_amount DECIMAL(15,2) DEFAULT 0,
    score DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_target_positive CHECK (target > 0),
    CONSTRAINT check_actual_non_negative CHECK (actual >= 0),
    CONSTRAINT check_progress_range CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT check_bonus_non_negative CHECK (bonus_amount >= 0),
    CONSTRAINT check_penalty_non_negative CHECK (penalty_amount >= 0),
    CONSTRAINT check_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    CONSTRAINT check_dates_valid CHECK (end_date >= start_date),
    CONSTRAINT check_employee_or_department CHECK (
        (employee_id IS NOT NULL AND department_id IS NULL) OR 
        (employee_id IS NULL AND department_id IS NOT NULL)
    ),
    CONSTRAINT check_status_valid CHECK (status IN (
        'not_started', 'in_progress', 'completed', 
        'pending_approval', 'approved', 'rejected', 'overdue'
    ))
);

-- Indexes
CREATE INDEX idx_kpi_records_kpi_id ON kpi_records(kpi_id);
CREATE INDEX idx_kpi_records_employee_id ON kpi_records(employee_id);
CREATE INDEX idx_kpi_records_department_id ON kpi_records(department_id);
CREATE INDEX idx_kpi_records_period ON kpi_records(period);
CREATE INDEX idx_kpi_records_status ON kpi_records(status);
CREATE INDEX idx_kpi_records_start_date ON kpi_records(start_date);
CREATE INDEX idx_kpi_records_end_date ON kpi_records(end_date);
CREATE INDEX idx_kpi_records_approved_by ON kpi_records(approved_by);
CREATE INDEX idx_kpi_records_active ON kpi_records(is_active);
CREATE INDEX idx_kpi_records_created_at ON kpi_records(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_kpi_records_employee_period ON kpi_records(employee_id, period);
CREATE INDEX idx_kpi_records_department_period ON kpi_records(department_id, period);
CREATE INDEX idx_kpi_records_kpi_period ON kpi_records(kpi_id, period);

-- Triggers
CREATE OR REPLACE FUNCTION update_kpi_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kpi_records_updated_at
    BEFORE UPDATE ON kpi_records
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_records_updated_at();

-- Function to automatically calculate progress
CREATE OR REPLACE FUNCTION calculate_kpi_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual IS NOT NULL AND NEW.target > 0 THEN
        NEW.progress = LEAST(100, GREATEST(0, ROUND((NEW.actual / NEW.target) * 100, 2)));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_kpi_progress
    BEFORE INSERT OR UPDATE ON kpi_records
    FOR EACH ROW
    EXECUTE FUNCTION calculate_kpi_progress();

-- Comments
COMMENT ON TABLE kpi_records IS 'Bảng quản lý bản ghi thực hiện KPI';
COMMENT ON COLUMN kpi_records.id IS 'ID duy nhất của bản ghi KPI';
COMMENT ON COLUMN kpi_records.kpi_id IS 'ID KPI';
COMMENT ON COLUMN kpi_records.employee_id IS 'ID nhân viên (nếu giao cho cá nhân)';
COMMENT ON COLUMN kpi_records.department_id IS 'ID phòng ban (nếu giao cho phòng ban)';
COMMENT ON COLUMN kpi_records.period IS 'Kỳ đánh giá';
COMMENT ON COLUMN kpi_records.target IS 'Mục tiêu';
COMMENT ON COLUMN kpi_records.actual IS 'Kết quả thực tế';
COMMENT ON COLUMN kpi_records.progress IS 'Tiến độ (%)';
COMMENT ON COLUMN kpi_records.status IS 'Trạng thái';
COMMENT ON COLUMN kpi_records.start_date IS 'Ngày bắt đầu';
COMMENT ON COLUMN kpi_records.end_date IS 'Ngày kết thúc';
COMMENT ON COLUMN kpi_records.submission_date IS 'Ngày nộp';
COMMENT ON COLUMN kpi_records.approval_date IS 'Ngày duyệt';
COMMENT ON COLUMN kpi_records.approved_by IS 'Người duyệt';
COMMENT ON COLUMN kpi_records.submission_details IS 'Chi tiết nộp';
COMMENT ON COLUMN kpi_records.attachment IS 'File đính kèm';
COMMENT ON COLUMN kpi_records.bonus_amount IS 'Số tiền thưởng';
COMMENT ON COLUMN kpi_records.penalty_amount IS 'Số tiền phạt';
COMMENT ON COLUMN kpi_records.score IS 'Điểm số';
COMMENT ON COLUMN kpi_records.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN kpi_records.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN kpi_records.updated_at IS 'Thời gian cập nhật cuối';
COMMENT ON COLUMN kpi_records.last_updated IS 'Thời gian cập nhật cuối cùng';

-- =====================================================
-- DAILY KPI PROGRESS SCHEMA
-- Quản lý tiến độ KPI hàng ngày
-- =====================================================

CREATE TABLE daily_kpi_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    department_name VARCHAR(255) NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    responsible_person VARCHAR(255) NOT NULL,
    kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
    kpi_name VARCHAR(255) NOT NULL,
    actual_result DECIMAL(15,2) NOT NULL,
    target_result DECIMAL(15,2),
    progress_percentage DECIMAL(5,2),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_actual_result_non_negative CHECK (actual_result >= 0),
    CONSTRAINT check_target_result_positive CHECK (target_result IS NULL OR target_result > 0),
    CONSTRAINT check_progress_percentage_range CHECK (progress_percentage IS NULL OR (progress_percentage >= 0 AND progress_percentage <= 100)),
    CONSTRAINT check_employee_or_department_daily CHECK (
        (employee_id IS NOT NULL AND department_id IS NULL) OR 
        (employee_id IS NULL AND department_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_daily_kpi_progress_date ON daily_kpi_progress(date);
CREATE INDEX idx_daily_kpi_progress_department_id ON daily_kpi_progress(department_id);
CREATE INDEX idx_daily_kpi_progress_employee_id ON daily_kpi_progress(employee_id);
CREATE INDEX idx_daily_kpi_progress_kpi_id ON daily_kpi_progress(kpi_id);
CREATE INDEX idx_daily_kpi_progress_created_by ON daily_kpi_progress(created_by);
CREATE INDEX idx_daily_kpi_progress_active ON daily_kpi_progress(is_active);
CREATE INDEX idx_daily_kpi_progress_created_at ON daily_kpi_progress(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_daily_kpi_progress_employee_date ON daily_kpi_progress(employee_id, date);
CREATE INDEX idx_daily_kpi_progress_department_date ON daily_kpi_progress(department_id, date);
CREATE INDEX idx_daily_kpi_progress_kpi_date ON daily_kpi_progress(kpi_id, date);

-- Triggers
CREATE OR REPLACE FUNCTION update_daily_kpi_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_kpi_progress_updated_at
    BEFORE UPDATE ON daily_kpi_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_kpi_progress_updated_at();

-- Function to automatically calculate progress percentage
CREATE OR REPLACE FUNCTION calculate_daily_progress_percentage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual_result IS NOT NULL AND NEW.target_result IS NOT NULL AND NEW.target_result > 0 THEN
        NEW.progress_percentage = LEAST(100, GREATEST(0, ROUND((NEW.actual_result / NEW.target_result) * 100, 2)));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_daily_progress_percentage
    BEFORE INSERT OR UPDATE ON daily_kpi_progress
    FOR EACH ROW
    EXECUTE FUNCTION calculate_daily_progress_percentage();

-- Comments
COMMENT ON TABLE daily_kpi_progress IS 'Bảng quản lý tiến độ KPI hàng ngày';
COMMENT ON COLUMN daily_kpi_progress.id IS 'ID duy nhất của bản ghi tiến độ';
COMMENT ON COLUMN daily_kpi_progress.date IS 'Ngày';
COMMENT ON COLUMN daily_kpi_progress.department_id IS 'ID phòng ban';
COMMENT ON COLUMN daily_kpi_progress.department_name IS 'Tên phòng ban';
COMMENT ON COLUMN daily_kpi_progress.employee_id IS 'ID nhân viên';
COMMENT ON COLUMN daily_kpi_progress.responsible_person IS 'Người chịu trách nhiệm';
COMMENT ON COLUMN daily_kpi_progress.kpi_id IS 'ID KPI';
COMMENT ON COLUMN daily_kpi_progress.kpi_name IS 'Tên KPI';
COMMENT ON COLUMN daily_kpi_progress.actual_result IS 'Kết quả thực tế';
COMMENT ON COLUMN daily_kpi_progress.target_result IS 'Kết quả mục tiêu';
COMMENT ON COLUMN daily_kpi_progress.progress_percentage IS 'Phần trăm tiến độ';
COMMENT ON COLUMN daily_kpi_progress.notes IS 'Ghi chú';
COMMENT ON COLUMN daily_kpi_progress.created_by IS 'Người tạo';
COMMENT ON COLUMN daily_kpi_progress.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN daily_kpi_progress.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN daily_kpi_progress.updated_at IS 'Thời gian cập nhật cuối';

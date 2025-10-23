-- =====================================================
-- FEEDBACK SCHEMA
-- Quản lý phản hồi và đánh giá
-- =====================================================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_record_id UUID NOT NULL REFERENCES kpi_records(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES employees(id),
    author_name VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    rating INTEGER,
    is_visible_to_employee BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_type_valid CHECK (type IN ('approval', 'rejection', 'suggestion', 'praise', 'improvement')),
    CONSTRAINT check_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

-- Indexes
CREATE INDEX idx_feedback_kpi_record_id ON feedback(kpi_record_id);
CREATE INDEX idx_feedback_author_id ON feedback(author_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_feedback_visible ON feedback(is_visible_to_employee);

-- Triggers
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- Comments
COMMENT ON TABLE feedback IS 'Bảng quản lý phản hồi và đánh giá';
COMMENT ON COLUMN feedback.id IS 'ID duy nhất của phản hồi';
COMMENT ON COLUMN feedback.kpi_record_id IS 'ID bản ghi KPI';
COMMENT ON COLUMN feedback.author_id IS 'ID người viết phản hồi';
COMMENT ON COLUMN feedback.author_name IS 'Tên người viết phản hồi';
COMMENT ON COLUMN feedback.comment IS 'Nội dung phản hồi';
COMMENT ON COLUMN feedback.type IS 'Loại phản hồi';
COMMENT ON COLUMN feedback.rating IS 'Đánh giá (1-5 sao)';
COMMENT ON COLUMN feedback.is_visible_to_employee IS 'Có hiển thị cho nhân viên không';
COMMENT ON COLUMN feedback.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN feedback.updated_at IS 'Thời gian cập nhật cuối';

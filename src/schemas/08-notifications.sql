-- =====================================================
-- NOTIFICATIONS SCHEMA
-- Quản lý hệ thống thông báo
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sender_id UUID REFERENCES employees(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_type_valid CHECK (type IN (
        'assigned', 'reminder', 'approved', 'rejected', 'reward', 
        'penalty', 'deadline', 'system', 'kpi_update', 'bonus_calculation'
    )),
    CONSTRAINT check_priority_valid CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT check_category_valid CHECK (category IN (
        'kpi', 'bonus', 'penalty', 'system', 'deadline', 'approval', 
        'reminder', 'announcement', 'warning'
    )),
    CONSTRAINT check_metadata_json CHECK (jsonb_typeof(metadata) = 'object')
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX idx_notifications_active ON notifications(is_active);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- Composite indexes for common queries
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_user_category ON notifications(user_id, category);
CREATE INDEX idx_notifications_user_priority ON notifications(user_id, priority);

-- Triggers
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Function to automatically set read_at when notification is marked as read
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read = true AND OLD.read = false THEN
        NEW.read_at = NOW();
    ELSIF NEW.read = false THEN
        NEW.read_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_read_at();

-- Comments
COMMENT ON TABLE notifications IS 'Bảng quản lý thông báo hệ thống';
COMMENT ON COLUMN notifications.id IS 'ID duy nhất của thông báo';
COMMENT ON COLUMN notifications.user_id IS 'ID người nhận thông báo';
COMMENT ON COLUMN notifications.type IS 'Loại thông báo';
COMMENT ON COLUMN notifications.priority IS 'Mức độ ưu tiên';
COMMENT ON COLUMN notifications.category IS 'Danh mục thông báo';
COMMENT ON COLUMN notifications.title IS 'Tiêu đề thông báo';
COMMENT ON COLUMN notifications.message IS 'Nội dung thông báo';
COMMENT ON COLUMN notifications.read IS 'Đã đọc chưa';
COMMENT ON COLUMN notifications.read_at IS 'Thời gian đọc';
COMMENT ON COLUMN notifications.action_url IS 'URL hành động';
COMMENT ON COLUMN notifications.metadata IS 'Dữ liệu bổ sung (JSON)';
COMMENT ON COLUMN notifications.sender_id IS 'ID người gửi';
COMMENT ON COLUMN notifications.expires_at IS 'Thời gian hết hạn';
COMMENT ON COLUMN notifications.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN notifications.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN notifications.updated_at IS 'Thời gian cập nhật cuối';

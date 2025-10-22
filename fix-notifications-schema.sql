-- Migration: Update notifications table to allow special user_id values
-- This allows notifications to be targeted to specific roles (admin, employee, all)

-- First, drop the foreign key constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Change user_id column to TEXT to allow special values like 'admin', 'employee', 'all'
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;

-- Add a check constraint to ensure user_id is either a valid UUID or one of the special values
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_check 
CHECK (
  user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' OR 
  user_id IN ('admin', 'employee', 'all')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_active ON public.notifications(user_id, is_active) WHERE is_active = true;

-- Insert some test notifications
INSERT INTO public.notifications (user_id, type, priority, category, title, message, read, is_active) VALUES
('all', 'reminder', 'medium', 'system', 'Chào mừng đến với hệ thống KPI', 'Hệ thống quản lý KPI đã được cập nhật với nhiều tính năng mới. Hãy khám phá!', false, true),
('admin', 'assigned', 'high', 'kpi', 'KPI mới cần phê duyệt', 'Có 3 KPI mới được submit và đang chờ phê duyệt từ quản lý.', false, true),
('employee', 'reminder', 'medium', 'kpi', 'Nhắc nhở deadline KPI', 'Bạn có 2 KPI sắp đến hạn deadline. Vui lòng hoàn thành sớm!', false, true),
('all', 'reminder', 'low', 'system', 'Bảo trì hệ thống', 'Hệ thống sẽ được bảo trì vào cuối tuần. Vui lòng lưu công việc trước đó.', false, true),
('admin', 'deadline', 'urgent', 'kpi', 'Deadline quan trọng', 'Có KPI quan trọng sắp hết hạn và cần xử lý ngay!', false, true),
('employee', 'approved', 'medium', 'kpi', 'KPI đã được phê duyệt', 'KPI "Tăng trưởng khách hàng" của bạn đã được phê duyệt với điểm số 85/100.', false, true);

-- Verify the notifications were inserted
SELECT 
  user_id,
  type,
  priority,
  category,
  title,
  message,
  read,
  created_at
FROM public.notifications 
WHERE is_active = true 
ORDER BY created_at DESC;

-- Test notifications to verify the notification system
-- Run this after applying the migration update-notifications-user-id.sql

-- Insert test notifications for different user types
INSERT INTO public.notifications (user_id, type, priority, category, title, message, read, is_active) VALUES
-- Notification for all users
('all', 'reminder', 'medium', 'system', 'Chào mừng đến với hệ thống KPI', 'Hệ thống quản lý KPI đã được cập nhật với nhiều tính năng mới. Hãy khám phá!', false, true),

-- Notification for admin users
('admin', 'assigned', 'high', 'kpi', 'KPI mới cần phê duyệt', 'Có 3 KPI mới được submit và đang chờ phê duyệt từ quản lý.', false, true),

-- Notification for employee users  
('employee', 'reminder', 'medium', 'kpi', 'Nhắc nhở deadline KPI', 'Bạn có 2 KPI sắp đến hạn deadline. Vui lòng hoàn thành sớm!', false, true),

-- Notification for specific user (replace with actual UUID from your employees table)
-- You can get a real UUID by running: SELECT id FROM employees LIMIT 1;
-- Then replace '00000000-0000-0000-0000-000000000000' with the actual UUID
('00000000-0000-0000-0000-000000000000', 'reward', 'low', 'bonus', 'Thưởng KPI', 'Chúc mừng! Bạn đã nhận được thưởng 500,000 VNĐ cho KPI "Doanh số bán hàng".', false, true),

-- More test notifications
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

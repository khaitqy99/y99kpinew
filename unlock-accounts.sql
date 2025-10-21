-- =====================================================
-- SCRIPT MỞ KHÓA TÀI KHOẢN - Y99 KPI SYSTEM
-- =====================================================
-- Chạy script này để mở khóa tài khoản bị khóa
-- =====================================================

-- 1. KIỂM TRA TÌNH TRẠNG KHÓA TÀI KHOẢN
SELECT 
  id,
  name,
  email,
  login_attempts,
  locked_until,
  is_active,
  status,
  last_login
FROM employees 
WHERE email IN ('db@y99.vn', 'employee@y99.vn')
ORDER BY email;

-- 2. MỞ KHÓA TẤT CẢ TÀI KHOẢN (RESET HOÀN TOÀN)
UPDATE employees 
SET 
  login_attempts = 0,
  locked_until = NULL,
  last_login = NULL
WHERE email IN ('db@y99.vn', 'employee@y99.vn');

-- 3. MỞ KHÓA TÀI KHOẢN CỤ THỂ (nếu chỉ muốn mở 1 tài khoản)
-- Thay 'your_email@example.com' bằng email của bạn
UPDATE employees 
SET 
  login_attempts = 0,
  locked_until = NULL
WHERE email = 'your_email@example.com';

-- 4. MỞ KHÓA TẤT CẢ TÀI KHOẢN TRONG HỆ THỐNG
UPDATE employees 
SET 
  login_attempts = 0,
  locked_until = NULL;

-- 5. KIỂM TRA LẠI SAU KHI MỞ KHÓA
SELECT 
  id,
  name,
  email,
  login_attempts,
  locked_until,
  is_active,
  status
FROM employees 
WHERE email IN ('db@y99.vn', 'employee@y99.vn')
ORDER BY email;

-- 6. RESET MẬT KHẨU (nếu cần)
-- Thay 'new_password' bằng mật khẩu mới
UPDATE employees 
SET 
  password_hash = 'new_password',
  login_attempts = 0,
  locked_until = NULL
WHERE email = 'your_email@example.com';

-- =====================================================
-- HƯỚNG DẪN SỬ DỤNG:
-- =====================================================
/*
1. Chạy query số 1 để kiểm tra tình trạng khóa
2. Chạy query số 2 để mở khóa tất cả tài khoản demo
3. Chạy query số 5 để xác nhận đã mở khóa thành công

Nếu bạn muốn mở khóa tài khoản cụ thể:
- Thay 'your_email@example.com' bằng email thật của bạn
- Chạy query số 3

Nếu muốn reset mật khẩu:
- Thay 'new_password' bằng mật khẩu mới
- Chạy query số 6
*/

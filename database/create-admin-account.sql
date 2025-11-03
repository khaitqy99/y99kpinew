-- =====================================================
-- TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
-- Email: db@y99.vn
-- Password: Dby996868
-- =====================================================

-- Đảm bảo role Admin tồn tại (level 4 = admin)
INSERT INTO roles (id, name, code, description, level, permissions, is_active)
VALUES 
  (1, 'Admin', 'ROLE001', 'Quản trị viên hệ thống', 4, '["all"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;

-- Đảm bảo có ít nhất 1 department (Phòng IT)
INSERT INTO departments (id, name, code, description, is_active)
VALUES 
  (4, 'Phòng quản lýlý', 'DEPT004', 'Phòng ban phụ trách công nghệ thông tin', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Tạo/Update tài khoản admin với quyền toàn quyền
INSERT INTO employees (
  id, 
  employee_code, 
  name, 
  email, 
  role_id, 
  department_id, 
  position, 
  level, 
  currency, 
  hire_date, 
  contract_type, 
  status, 
  is_active, 
  password_hash, 
  login_attempts,
  locked_until
)
VALUES 
  (
    100,  -- id cố định cho admin
    'EMP000', 
    'DB Admin', 
    'db@y99.vn', 
    1,  -- role_id = 1 (Admin)
    4,  -- department_id = 4 (Phòng IT)
    'Admin', 
    4,  -- level = 4 (admin)
    'VND', 
    CURRENT_DATE, 
    'fulltime', 
    'active', 
    true, 
    'Dby996868',  -- password plain text (không hash)
    0,  -- login_attempts = 0
    NULL  -- locked_until = NULL
  )
ON CONFLICT (id) DO UPDATE SET
  employee_code = EXCLUDED.employee_code,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role_id = EXCLUDED.role_id,
  department_id = EXCLUDED.department_id,
  position = EXCLUDED.position,
  level = EXCLUDED.level,
  currency = EXCLUDED.currency,
  hire_date = EXCLUDED.hire_date,
  contract_type = EXCLUDED.contract_type,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  password_hash = EXCLUDED.password_hash,
  login_attempts = EXCLUDED.login_attempts,
  locked_until = EXCLUDED.locked_until,
  updated_at = NOW();

-- Cũng có thể update nếu email đã tồn tại (trường hợp conflict trên email)
UPDATE employees
SET 
  employee_code = 'EMP000',
  name = 'DB Admin',
  role_id = 1,
  department_id = 4,
  position = 'Admin',
  level = 4,
  currency = 'VND',
  status = 'active',
  is_active = true,
  password_hash = 'Dby996868',
  login_attempts = 0,
  locked_until = NULL,
  updated_at = NOW()
WHERE email = 'db@y99.vn' AND id != 100;

-- Set sequence cho employees nếu cần
SELECT setval('employees_id_seq', GREATEST(100, COALESCE((SELECT MAX(id) FROM employees), 100)), true);

-- Xác nhận tài khoản đã được tạo
SELECT 
  id,
  employee_code,
  name,
  email,
  position,
  level,
  status,
  is_active,
  'Admin account created successfully!' as message
FROM employees
WHERE email = 'db@y99.vn';



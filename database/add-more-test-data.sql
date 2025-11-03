-- =====================================================
-- KPI MANAGEMENT SYSTEM - THÊM DỮ LIỆU MẪU ĐỂ TEST REALTIME
-- File này thêm nhiều dữ liệu mẫu để test tính năng Realtime
-- =====================================================
-- LƯU Ý: 
-- - File này có thể chạy độc lập (tự động tạo roles, departments và employees cơ bản nếu chưa có)
-- - Tốt nhất chạy schema.sql TRƯỚC, sau đó chạy test-data.sql hoặc file này
-- - Safe to run multiple times (sử dụng ON CONFLICT)
-- - File này tự động tạo: roles (1-4), departments (1-4), employees (1,2,3,4,5,100), KPIs (1-4) trước khi insert data khác

-- =====================================================
-- 0. ĐẢM BẢO ROLES TỒN TẠI (Nếu chưa có)
-- =====================================================
-- Kiểm tra và insert roles nếu chưa có để tránh foreign key error
INSERT INTO roles (id, name, code, description, level, permissions, is_active)
VALUES 
  (1, 'Admin', 'ROLE001', 'Quản trị viên hệ thống', 4, '["all"]'::jsonb, true),
  (2, 'Manager', 'ROLE002', 'Quản lý phòng ban', 3, '["view_all", "approve"]'::jsonb, true),
  (3, 'Director', 'ROLE003', 'Giám đốc', 2, '["view_all", "approve", "create_kpi"]'::jsonb, true),
  (4, 'Employee', 'ROLE004', 'Nhân viên', 1, '["view_own", "submit"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  permissions = EXCLUDED.permissions;

SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles), true);

-- =====================================================
-- 0b. ĐẢM BẢO DEPARTMENTS TỒN TẠI (Nếu chưa có)
-- =====================================================
INSERT INTO departments (id, name, code, description, is_active)
VALUES 
  (1, 'Phòng Kinh doanh', 'DEPT001', 'Phòng ban phụ trách kinh doanh và sales', true),
  (2, 'Phòng Marketing', 'DEPT002', 'Phòng ban phụ trách marketing và truyền thông', true),
  (3, 'Phòng Nhân sự', 'DEPT003', 'Phòng ban phụ trách nhân sự và tuyển dụng', true),
  (4, 'Phòng IT', 'DEPT004', 'Phòng ban phụ trách công nghệ thông tin', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description;

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments), true);

-- =====================================================
-- 1. ĐẢM BẢO EMPLOYEES CƠ BẢN TỒN TẠI (Nếu chưa có)
-- =====================================================
-- Insert các employees cơ bản trước để tránh foreign key error khi insert KPIs và KPI Records
INSERT INTO employees (id, employee_code, name, email, role_id, department_id, position, level, currency, hire_date, contract_type, status, is_active, password_hash, login_attempts)
VALUES 
  (100, 'EMP000', 'DB Admin', 'db@y99.vn', 1, 4, 'Admin', 4, 'VND', '2024-01-01', 'fulltime', 'active', true, 'Dby996868', 0),
  (1, 'EMP001', 'Admin User', 'admin@y99.com', 1, 4, 'Admin', 4, 'VND', '2024-01-01', 'fulltime', 'active', true, 'password123', 0),
  (2, 'EMP002', 'Nguyễn Văn A', 'nguyenvana@y99.com', 4, 1, 'Nhân viên Kinh doanh', 1, 'VND', '2024-02-01', 'fulltime', 'active', true, 'password123', 0),
  (3, 'EMP003', 'Trần Thị B', 'tranthib@y99.com', 2, 2, 'Quản lý Marketing', 3, 'VND', '2024-01-15', 'fulltime', 'active', true, 'password123', 0),
  (4, 'EMP004', 'Lê Văn C', 'levanc@y99.com', 4, 1, 'Nhân viên Kinh doanh', 1, 'VND', '2024-03-01', 'fulltime', 'active', true, 'password123', 0),
  (5, 'EMP005', 'Phạm Thị D', 'phamthid@y99.com', 4, 3, 'Nhân viên Nhân sự', 1, 'VND', '2024-02-15', 'fulltime', 'active', true, 'password123', 0)
ON CONFLICT (id) DO UPDATE SET
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
  password_hash = EXCLUDED.password_hash;

SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees), true);

-- =====================================================
-- 1b. THÊM NHIỀU EMPLOYEES MỚI
-- =====================================================
INSERT INTO employees (id, employee_code, name, email, role_id, department_id, position, level, currency, hire_date, contract_type, status, is_active, password_hash, login_attempts)
VALUES 
  (10, 'EMP010', 'Hoàng Văn E', 'hoangvane@y99.com', 4, 1, 'Nhân viên Kinh doanh', 1, 'VND', '2025-01-10', 'fulltime', 'active', true, 'password123', 0),
  (11, 'EMP011', 'Vũ Thị F', 'vuthif@y99.com', 4, 2, 'Nhân viên Marketing', 1, 'VND', '2025-01-15', 'fulltime', 'active', true, 'password123', 0),
  (12, 'EMP012', 'Bùi Văn G', 'buivang@y99.com', 4, 3, 'Nhân viên Nhân sự', 1, 'VND', '2025-01-20', 'fulltime', 'active', true, 'password123', 0),
  (13, 'EMP013', 'Đặng Thị H', 'dangthih@y99.com', 4, 4, 'Nhân viên IT', 1, 'VND', '2025-01-25', 'fulltime', 'active', true, 'password123', 0),
  (14, 'EMP014', 'Ngô Văn I', 'ngovani@y99.com', 4, 1, 'Nhân viên Kinh doanh', 1, 'VND', '2025-02-01', 'fulltime', 'active', true, 'password123', 0),
  (15, 'EMP015', 'Phan Thị K', 'phanthik@y99.com', 2, 3, 'Quản lý Nhân sự', 3, 'VND', '2024-12-01', 'fulltime', 'active', true, 'password123', 0),
  (16, 'EMP016', 'Lý Văn L', 'lyvanl@y99.com', 4, 2, 'Nhân viên Marketing', 1, 'VND', '2025-02-05', 'fulltime', 'active', true, 'password123', 0),
  (17, 'EMP017', 'Trịnh Thị M', 'trinhthim@y99.com', 4, 4, 'Nhân viên IT', 1, 'VND', '2025-02-10', 'fulltime', 'active', true, 'password123', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role_id = EXCLUDED.role_id,
  department_id = EXCLUDED.department_id;

SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees), true);

-- =====================================================
-- 2. ĐẢM BẢO KPIS CƠ BẢN TỒN TẠI (Nếu chưa có)
-- =====================================================
-- Insert các KPIs cơ bản trước để tránh foreign key error khi insert KPI Records
INSERT INTO kpis (id, name, description, department_id, target, unit, frequency, status, reward_penalty_config, created_by, is_active)
VALUES 
  (1, 'Số lượng khách hàng mới', 'Tổng số khách hàng mới trong tháng', 1, 100, 'khách hàng', 'monthly', 'active', '{"bonus_amount": 1000000, "penalty_amount": 500000, "threshold_100": 1000000, "threshold_80": 500000, "threshold_50": 500000, "threshold_70": 250000}'::jsonb, 1, true),
  (2, 'Tỷ lệ chuyển đổi khách hàng', 'Tỷ lệ khách hàng tiềm năng chuyển thành khách hàng thực tế', 1, 30, '%', 'monthly', 'active', '{"bonus_amount": 800000, "penalty_amount": 400000}'::jsonb, 1, true),
  (3, 'Số bài viết marketing', 'Số lượng bài viết marketing được xuất bản trong tháng', 2, 20, 'bài viết', 'monthly', 'active', '{"bonus_amount": 600000, "penalty_amount": 300000}'::jsonb, 1, true),
  (4, 'Số ứng viên tuyển dụng', 'Số lượng ứng viên được tuyển dụng thành công trong quý', 3, 10, 'người', 'quarterly', 'active', '{"bonus_amount": 1200000, "penalty_amount": 600000}'::jsonb, 1, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  department_id = EXCLUDED.department_id,
  target = EXCLUDED.target,
  unit = EXCLUDED.unit,
  frequency = EXCLUDED.frequency,
  status = EXCLUDED.status,
  reward_penalty_config = EXCLUDED.reward_penalty_config,
  created_by = EXCLUDED.created_by;

SELECT setval('kpis_id_seq', (SELECT MAX(id) FROM kpis), true);

-- =====================================================
-- 2b. THÊM NHIỀU KPIS MỚI
-- =====================================================
INSERT INTO kpis (id, name, description, department_id, target, unit, frequency, status, reward_penalty_config, created_by, is_active)
VALUES 
  (10, 'Số đơn hàng online', 'Tổng số đơn hàng online trong tháng', 1, 500, 'đơn hàng', 'monthly', 'active', '{"bonus_amount": 800000, "penalty_amount": 400000}'::jsonb, 1, true),
  (11, 'Tỷ lệ hoàn đơn', 'Tỷ lệ khách hàng hoàn thành đơn hàng', 1, 95, '%', 'monthly', 'active', '{"bonus_amount": 600000, "penalty_amount": 300000}'::jsonb, 1, true),
  (12, 'Số lượng lead', 'Số khách hàng tiềm năng mới', 1, 200, 'lead', 'monthly', 'active', '{"bonus_amount": 500000, "penalty_amount": 250000}'::jsonb, 1, true),
  (13, 'Engagement rate', 'Tỷ lệ tương tác trên mạng xã hội', 2, 80, '%', 'monthly', 'active', '{"bonus_amount": 700000, "penalty_amount": 350000}'::jsonb, 1, true),
  (14, 'Số campaign', 'Số lượng chiến dịch marketing', 2, 8, 'campaign', 'quarterly', 'active', '{"bonus_amount": 1000000, "penalty_amount": 500000}'::jsonb, 1, true),
  (15, 'Thời gian phản hồi', 'Thời gian phản hồi khách hàng', 2, 30, 'phút', 'monthly', 'active', '{"bonus_amount": 400000, "penalty_amount": 200000}'::jsonb, 1, true),
  (16, 'Số ứng viên phỏng vấn', 'Số ứng viên được phỏng vấn', 3, 50, 'ứng viên', 'monthly', 'active', '{"bonus_amount": 600000, "penalty_amount": 300000}'::jsonb, 1, true),
  (17, 'Tỷ lệ tuyển thành công', 'Tỷ lệ tuyển thành công', 3, 20, '%', 'monthly', 'active', '{"bonus_amount": 800000, "penalty_amount": 400000}'::jsonb, 1, true),
  (18, 'Số lỗi code', 'Số lỗi code phát sinh', 4, 10, 'lỗi', 'monthly', 'active', '{"bonus_amount": 0, "penalty_amount": 300000}'::jsonb, 1, true),
  (19, 'Thời gian phát hành', 'Thời gian phát hành feature mới', 4, 15, 'ngày', 'monthly', 'active', '{"bonus_amount": 900000, "penalty_amount": 450000}'::jsonb, 1, true),
  (20, 'Uptime system', 'Tỷ lệ uptime của hệ thống', 4, 99.9, '%', 'monthly', 'active', '{"bonus_amount": 1200000, "penalty_amount": 600000}'::jsonb, 1, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  department_id = EXCLUDED.department_id,
  target = EXCLUDED.target,
  frequency = EXCLUDED.frequency;

SELECT setval('kpis_id_seq', (SELECT MAX(id) FROM kpis), true);

-- =====================================================
-- 3. THÊM NHIỀU KPI RECORDS (Q1-2025 và M1-2025, M2-2025)
-- =====================================================
INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_details, is_active, submission_date, approval_date, approved_by)
VALUES 
  -- Q1-2025 Records cho Employee 2 (Nguyễn Văn A)
  (100, 10, 2, NULL, 'M1-2025', 500, 480, 96, 'approved', '2025-01-01', '2025-01-31', 'Hoàn thành tốt, thiếu 20 đơn hàng', true, '2025-01-28', '2025-01-30', 1),
  (101, 11, 2, NULL, 'M1-2025', 95, 97, 102, 'approved', '2025-01-01', '2025-01-31', 'Vượt mục tiêu 2%', true, '2025-01-28', '2025-01-30', 1),
  (102, 12, 2, NULL, 'M2-2025', 200, 180, 90, 'in_progress', '2025-02-01', '2025-02-28', 'Đang trong quá trình thực hiện', true, NULL, NULL, NULL),
  
  -- M1-2025 cho Employee 4 (Lê Văn C)
  (103, 10, 4, NULL, 'M1-2025', 500, 520, 104, 'approved', '2025-01-01', '2025-01-31', 'Vượt mục tiêu 4%', true, '2025-01-29', '2025-01-31', 1),
  (104, 11, 4, NULL, 'M1-2025', 95, 96, 101, 'approved', '2025-01-01', '2025-01-31', 'Hoàn thành tốt', true, '2025-01-29', '2025-01-31', 1),
  
  -- M2-2025 cho Employee 10
  (105, 10, 10, NULL, 'M2-2025', 500, 450, 90, 'in_progress', '2025-02-01', '2025-02-28', 'Đang tiếp tục thực hiện', true, NULL, NULL, NULL),
  (106, 12, 10, NULL, 'M2-2025', 200, 150, 75, 'in_progress', '2025-02-01', '2025-02-28', 'Cần đẩy mạnh hơn', true, NULL, NULL, NULL),
  
  -- M1-2025 cho Employee 11 (Marketing)
  (107, 13, 11, NULL, 'M1-2025', 80, 85, 106, 'approved', '2025-01-01', '2025-01-31', 'Vượt mục tiêu 5%', true, '2025-01-28', '2025-01-30', 3),
  (108, 3, 11, NULL, 'M1-2025', 20, 25, 125, 'approved', '2025-01-01', '2025-01-31', 'Vượt mục tiêu 25%', true, '2025-01-28', '2025-01-30', 3),
  
  -- M2-2025 cho Employee 11
  (109, 13, 11, NULL, 'M2-2025', 80, 70, 88, 'in_progress', '2025-02-01', '2025-02-28', 'Đang thực hiện', true, NULL, NULL, NULL),
  (110, 3, 11, NULL, 'M2-2025', 20, 18, 90, 'in_progress', '2025-02-01', '2025-02-28', 'Tiến độ tốt', true, NULL, NULL, NULL),
  
  -- M1-2025 cho Employee 16
  (111, 13, 16, NULL, 'M1-2025', 80, 75, 94, 'approved', '2025-01-01', '2025-01-31', 'Hoàn thành tốt', true, '2025-01-28', '2025-01-30', 3),
  (112, 15, 16, NULL, 'M1-2025', 30, 25, 83, 'approved', '2025-01-01', '2025-01-31', 'Phản hồi nhanh chóng', true, '2025-01-28', '2025-01-30', 3),
  
  -- M2-2025 cho Employee 16
  (113, 13, 16, NULL, 'M2-2025', 80, 65, 81, 'in_progress', '2025-02-01', '2025-02-28', 'Đang cải thiện', true, NULL, NULL, NULL),
  
  -- HR Records
  (114, 16, 5, NULL, 'M1-2025', 50, 55, 110, 'approved', '2025-01-01', '2025-01-31', 'Vượt mục tiêu', true, '2025-01-29', '2025-01-31', 15),
  (115, 17, 5, NULL, 'M1-2025', 20, 22, 110, 'approved', '2025-01-01', '2025-01-31', 'Tuyển dụng hiệu quả', true, '2025-01-29', '2025-01-31', 15),
  
  -- IT Records
  (116, 18, 13, NULL, 'M1-2025', 10, 8, 80, 'approved', '2025-01-01', '2025-01-31', 'Ít lỗi hơn mục tiêu', true, '2025-01-28', '2025-01-30', 1),
  (117, 19, 13, NULL, 'M1-2025', 15, 12, 80, 'approved', '2025-01-01', '2025-01-31', 'Phát hành nhanh', true, '2025-01-28', '2025-01-30', 1),
  (118, 20, 13, NULL, 'M1-2025', 99.9, 99.95, 100, 'approved', '2025-01-01', '2025-01-31', 'Hệ thống ổn định', true, '2025-01-28', '2025-01-30', 1),
  
  -- M2-2025 IT
  (119, 18, 13, NULL, 'M2-2025', 10, 5, 50, 'in_progress', '2025-02-01', '2025-02-28', 'Đang kiểm tra', true, NULL, NULL, NULL),
  (120, 19, 13, NULL, 'M2-2025', 15, 10, 67, 'in_progress', '2025-02-01', '2025-02-28', 'Đang phát triển', true, NULL, NULL, NULL),
  
  -- IT Employee 17
  (121, 18, 17, NULL, 'M1-2025', 10, 12, 120, 'approved', '2025-01-01', '2025-01-31', 'Vượt mục tiêu về chất lượng', true, '2025-01-28', '2025-01-30', 1),
  (122, 19, 17, NULL, 'M1-2025', 15, 14, 93, 'approved', '2025-01-01', '2025-01-31', 'Phát hành đúng hạn', true, '2025-01-28', '2025-01-30', 1),
  
  -- Pending Approval Records
  (123, 10, 14, NULL, 'M1-2025', 500, 490, 98, 'pending_approval', '2025-01-01', '2025-01-31', 'Chờ phê duyệt từ quản lý', true, '2025-01-30', NULL, NULL),
  (124, 14, NULL, 2, 'Q1-2025', 8, 6, 75, 'pending_approval', '2025-01-01', '2025-03-31', 'Đã thực hiện 6/8 campaigns', true, '2025-01-30', NULL, NULL),
  
  -- Not Started Records
  (125, 10, 14, NULL, 'M2-2025', 500, 0, 0, 'not_started', '2025-02-01', '2025-02-28', '', true, NULL, NULL, NULL),
  (126, 11, 14, NULL, 'M2-2025', 95, 0, 0, 'not_started', '2025-02-01', '2025-02-28', '', true, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  kpi_id = EXCLUDED.kpi_id,
  employee_id = EXCLUDED.employee_id,
  actual = EXCLUDED.actual,
  progress = EXCLUDED.progress,
  status = EXCLUDED.status;

SELECT setval('kpi_records_id_seq', (SELECT MAX(id) FROM kpi_records), true);

-- =====================================================
-- 4. THÊM NHIỀU DAILY KPI PROGRESS (Cho tháng 2)
-- =====================================================
INSERT INTO daily_kpi_progress (id, date, department_id, department_name, employee_id, responsible_person, kpi_id, kpi_name, actual_result, notes, created_by, is_active)
VALUES 
  (100, '2025-02-01', 1, 'Phòng Kinh doanh', 2, 'Nguyễn Văn A', 10, 'Số đơn hàng online', 15, 'Ngày đầu tháng khởi động tốt', 1, true),
  (101, '2025-02-02', 1, 'Phòng Kinh doanh', 2, 'Nguyễn Văn A', 10, 'Số đơn hàng online', 20, 'Tiếp tục phát triển', 1, true),
  (102, '2025-02-03', 1, 'Phòng Kinh doanh', 4, 'Lê Văn C', 10, 'Số đơn hàng online', 18, 'Hoàn thành tốt', 1, true),
  (103, '2025-02-04', 1, 'Phòng Kinh doanh', 10, 'Hoàng Văn E', 10, 'Số đơn hàng online', 16, 'Đang thực hiện', 1, true),
  (104, '2025-02-05', 1, 'Phòng Kinh doanh', 14, 'Ngô Văn I', 10, 'Số đơn hàng online', 14, 'Khởi động chậm nhưng đang cải thiện', 1, true),
  
  -- Marketing Daily Progress
  (105, '2025-02-01', 2, 'Phòng Marketing', 11, 'Vũ Thị F', 13, 'Engagement rate', 3.5, 'Tương tác tốt trên Facebook', 3, true),
  (106, '2025-02-02', 2, 'Phòng Marketing', 16, 'Lý Văn L', 13, 'Engagement rate', 3.2, 'Tiếp tục duy trì', 3, true),
  (107, '2025-02-03', 2, 'Phòng Marketing', 11, 'Vũ Thị F', 3, 'Số bài viết marketing', 1, 'Đã xuất bản 1 bài mới', 3, true),
  (108, '2025-02-04', 2, 'Phòng Marketing', 16, 'Lý Văn L', 3, 'Số bài viết marketing', 1, 'Bài viết về sản phẩm mới', 3, true),
  
  -- IT Daily Progress
  (109, '2025-02-01', 4, 'Phòng IT', 13, 'Đặng Thị H', 20, 'Uptime system', 0.01, 'Không có downtime', 1, true),
  (110, '2025-02-02', 4, 'Phòng IT', 17, 'Trịnh Thị M', 20, 'Uptime system', 0, 'Hệ thống ổn định 100%', 1, true),
  (111, '2025-02-03', 4, 'Phòng IT', 13, 'Đặng Thị H', 19, 'Thời gian phát hành', 1, 'Đã push code lên production', 1, true)
ON CONFLICT (id) DO UPDATE SET
  date = EXCLUDED.date,
  actual_result = EXCLUDED.actual_result,
  notes = EXCLUDED.notes;

SELECT setval('daily_kpi_progress_id_seq', (SELECT MAX(id) FROM daily_kpi_progress), true);

-- =====================================================
-- 5. THÊM NHIỀU BONUS PENALTY RECORDS
-- =====================================================
INSERT INTO bonus_penalty_records (id, employee_id, kpi_id, type, amount, reason, period, created_by, is_active)
VALUES 
  (10, 2, 10, 'bonus', 800000, 'Hoàn thành KPI số đơn hàng online M1-2025 với 96%', 'M1-2025', 1, true),
  (11, 2, 11, 'bonus', 1200000, 'Vượt mục tiêu tỷ lệ hoàn đơn 2%', 'M1-2025', 1, true),
  (12, 4, 10, 'bonus', 1600000, 'Vượt mục tiêu số đơn hàng online 4%', 'M1-2025', 1, true),
  (13, 4, 11, 'bonus', 600000, 'Hoàn thành tỷ lệ hoàn đơn 1% so với mục tiêu', 'M1-2025', 1, true),
  (14, 11, 13, 'bonus', 1225000, 'Vượt mục tiêu engagement rate 5%', 'M1-2025', 3, true),
  (15, 11, 3, 'bonus', 750000, 'Vượt mục tiêu số bài viết marketing 25%', 'M1-2025', 3, true),
  (16, 16, 13, 'bonus', 700000, 'Hoàn thành tốt engagement rate', 'M1-2025', 3, true),
  (17, 16, 15, 'bonus', 400000, 'Phản hồi nhanh hơn mục tiêu', 'M1-2025', 3, true),
  (18, 5, 16, 'bonus', 660000, 'Vượt mục tiêu số ứng viên phỏng vấn 10%', 'M1-2025', 15, true),
  (19, 5, 17, 'bonus', 880000, 'Vượt mục tiêu tỷ lệ tuyển thành công 2%', 'M1-2025', 15, true),
  (20, 13, 19, 'bonus', 720000, 'Phát hành nhanh hơn mục tiêu 3 ngày', 'M1-2025', 1, true),
  (21, 13, 20, 'bonus', 1200000, 'Uptime system vượt mục tiêu', 'M1-2025', 1, true),
  
  -- Penalty Records
  (22, 17, 18, 'penalty', 360000, 'Vượt mục tiêu số lỗi code (12 > 10)', 'M1-2025', 1, true)
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  amount = EXCLUDED.amount,
  reason = EXCLUDED.reason;

SELECT setval('bonus_penalty_records_id_seq', (SELECT MAX(id) FROM bonus_penalty_records), true);

-- =====================================================
-- 6. THÊM NHIỀU NOTIFICATIONS
-- =====================================================
INSERT INTO notifications (id, user_id, user_type, type, priority, category, title, message, read, is_active)
VALUES 
  -- Notifications cho Employee 2
  (10, 2, 'employee', 'assigned', 'medium', 'kpi', 'KPI mới được giao - Số đơn hàng online', 'Bạn đã được giao KPI "Số đơn hàng online" với mục tiêu 500 đơn trong tháng 2', false, true),
  (11, 2, 'employee', 'approved', 'medium', 'kpi', 'KPI đã được phê duyệt', 'KPI "Số đơn hàng online" tháng 1 đã được phê duyệt. Chúc mừng bạn!', false, true),
  (12, 2, 'employee', 'reward', 'high', 'bonus', 'Thưởng KPI tháng 1', 'Bạn đã nhận được 2,000,000 VNĐ thưởng cho KPI tháng 1/2025', false, true),
  
  -- Notifications cho Employee 4
  (13, 4, 'employee', 'approved', 'medium', 'kpi', 'KPI đã được phê duyệt', 'KPI của bạn đã được phê duyệt thành công', false, true),
  (14, 4, 'employee', 'reward', 'high', 'bonus', 'Thưởng vượt mục tiêu', 'Chúc mừng! Bạn nhận 2,200,000 VNĐ thưởng', false, true),
  
  -- Notifications cho Employee 10
  (15, 10, 'employee', 'assigned', 'medium', 'kpi', 'KPI mới - Lead generation', 'Bạn đã được giao KPI "Số lượng lead" mục tiêu 200 lead trong tháng 2', false, true),
  
  -- Notifications cho Employee 11 (Marketing)
  (16, 11, 'employee', 'approved', 'medium', 'kpi', 'KPI Marketing đã được phê duyệt', 'Tất cả KPI tháng 1 của bạn đã được phê duyệt', false, true),
  (17, 11, 'employee', 'reward', 'high', 'bonus', 'Thưởng vượt mục tiêu', 'Bạn nhận 1,975,000 VNĐ thưởng cho tháng 1', false, true),
  
  -- Notifications cho Employee 13 (IT)
  (18, 13, 'employee', 'approved', 'medium', 'kpi', 'KPI IT đã được phê duyệt', 'KPI tháng 1 của bạn đã được phê duyệt', false, true),
  (19, 13, 'employee', 'reward', 'high', 'bonus', 'Thưởng IT performance', 'Bạn nhận 1,920,000 VNĐ thưởng', false, true),
  
  -- Notifications cho Employee 17 (IT)
  (20, 17, 'employee', 'penalty', 'medium', 'kpi', 'Phạt chất lượng code', 'Bạn bị phạt 360,000 VNĐ do vượt mục tiêu số lỗi code', false, true),
  
  -- Admin notifications
  (21, 1, 'admin', 'submitted', 'medium', 'kpi', 'KPI đã được submit', 'Nguyễn Văn A đã submit KPI "Số đơn hàng online" M1-2025', false, true),
  (22, 1, 'admin', 'submitted', 'medium', 'kpi', 'KPI đã được submit', 'Lê Văn C đã submit KPI "Tỷ lệ hoàn đơn" M1-2025', false, true),
  
  -- Manager notifications
  (23, 3, 'admin', 'submitted', 'low', 'kpi', 'KPI Marketing submitted', 'Vũ Thị F đã submit KPI "Engagement rate"', false, true),
  
  -- Reminder notifications
  (24, 14, 'employee', 'reminder', 'high', 'kpi', 'Nhắc nhở deadline', 'KPI của bạn sắp hết hạn vào ngày 28/02/2025. Còn 10 ngày nữa!', false, true),
  (25, 10, 'employee', 'reminder', 'medium', 'kpi', 'Nhắc nhở tiến độ', 'Bạn cần tăng tốc để hoàn thành KPI "Số lượng lead"', false, true)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  read = EXCLUDED.read;

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications), true);

-- =====================================================
-- VERIFY ADDED DATA
-- =====================================================
SELECT '=== NEW DATA ADDED ===' as info;

SELECT 'Employees (Total)' as table_name, COUNT(*) as count FROM employees
UNION ALL
SELECT 'Employees (New)', COUNT(*) FROM employees WHERE id > 9
UNION ALL
SELECT 'KPIs (Total)', COUNT(*) FROM kpis
UNION ALL
SELECT 'KPIs (New)', COUNT(*) FROM kpis WHERE id > 9
UNION ALL
SELECT 'KPI Records (Total)', COUNT(*) FROM kpi_records
UNION ALL
SELECT 'KPI Records (New)', COUNT(*) FROM kpi_records WHERE id >= 100
UNION ALL
SELECT 'Daily Progress (Total)', COUNT(*) FROM daily_kpi_progress
UNION ALL
SELECT 'Daily Progress (New)', COUNT(*) FROM daily_kpi_progress WHERE id >= 100
UNION ALL
SELECT 'Bonus Penalty (Total)', COUNT(*) FROM bonus_penalty_records
UNION ALL
SELECT 'Bonus Penalty (New)', COUNT(*) FROM bonus_penalty_records WHERE id >= 10
UNION ALL
SELECT 'Notifications (Total)', COUNT(*) FROM notifications
UNION ALL
SELECT 'Notifications (New)', COUNT(*) FROM notifications WHERE id >= 10;

SELECT '=== DATA STATUS SUMMARY ===' as info;

SELECT 
  status,
  COUNT(*) as count
FROM kpi_records
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'approved' THEN 1
    WHEN 'pending_approval' THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'not_started' THEN 4
    WHEN 'rejected' THEN 5
    ELSE 6
  END;

SELECT '=== REALTIME TEST READY ===' as info;
SELECT 'Now you can test realtime by:' as tip;
SELECT '1. Opening 2 browser windows' as step1;
SELECT '2. Making changes in window 1' as step2;
SELECT '3. Watching updates appear in window 2!' as step3;


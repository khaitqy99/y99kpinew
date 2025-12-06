-- =====================================================
-- KPI MANAGEMENT SYSTEM - DỮ LIỆU MẪU ĐỂ TEST
-- File này thêm dữ liệu mẫu đơn giản với một vài trường để test
-- =====================================================
-- LƯU Ý: 
-- - File này có thể chạy độc lập (tự động tạo roles, departments và employees cơ bản nếu chưa có)
-- - Tốt nhất chạy schema.sql TRƯỚC, sau đó chạy file này
-- - Safe to run multiple times (sử dụng ON CONFLICT)

-- =====================================================
-- 1. ROLES (Vai trò)
-- =====================================================
INSERT INTO roles (id, name, code, description, level, permissions, is_active)
VALUES 
  (1, 'Admin', 'ROLE001', 'Quản trị viên hệ thống', 4, '["all"]'::jsonb, true),
  (2, 'Manager', 'ROLE002', 'Quản lý phòng ban', 3, '["view_all", "approve"]'::jsonb, true),
  (4, 'Employee', 'ROLE004', 'Nhân viên', 1, '["view_own", "submit"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  permissions = EXCLUDED.permissions;

SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles), true);

-- =====================================================
-- 2. BRANCHES (Chi nhánh) - Nếu bảng tồn tại
-- =====================================================
-- Kiểm tra và thêm branches nếu bảng tồn tại
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
    INSERT INTO branches (id, name, code, description, address, phone, email, manager_id, is_active)
    VALUES 
      (1, 'Chi nhánh Hà Nội', 'BRANCH001', 'Trụ sở chính tại Hà Nội', '123 Đường ABC, Quận XYZ, Hà Nội', '0241234567', 'hanoi@y99.com', 1, true),
      (2, 'Chi nhánh TP.HCM', 'BRANCH002', 'Chi nhánh tại Thành phố Hồ Chí Minh', '456 Đường DEF, Quận 1, TP.HCM', '0287654321', 'hcm@y99.com', 3, true),
      (3, 'Y99 Vĩnh Long', 'Y99_VL', 'Chi nhánh Y99 Vĩnh Long', '789 Đường GHI, Thành phố Vĩnh Long, Vĩnh Long', '0270388888', 'vinhlong@y99.com', NULL, true)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      code = EXCLUDED.code,
      description = EXCLUDED.description,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email;
    
    PERFORM setval('branches_id_seq', (SELECT MAX(id) FROM branches), true);
  END IF;
END $$;

-- =====================================================
-- 3. DEPARTMENTS (Phòng ban)
-- =====================================================
INSERT INTO departments (id, name, code, description, branch_id, is_active)
VALUES 
  (1, 'Phòng Kinh doanh', 'DEPT001', 'Phòng ban phụ trách kinh doanh và sales', 1, true),
  (2, 'Phòng Marketing', 'DEPT002', 'Phòng ban phụ trách marketing và truyền thông', 1, true),
  (3, 'Phòng Nhân sự', 'DEPT003', 'Phòng ban phụ trách nhân sự và tuyển dụng', 1, true),
  (4, 'Phòng IT', 'DEPT004', 'Phòng ban phụ trách công nghệ thông tin', 1, true),
  (5, 'Phòng Kinh doanh Vĩnh Long', 'DEPT005', 'Phòng ban phụ trách kinh doanh và sales - Vĩnh Long', 3, true),
  (6, 'Phòng Marketing Vĩnh Long', 'DEPT006', 'Phòng ban phụ trách marketing và truyền thông - Vĩnh Long', 3, true),
  (7, 'Phòng Nhân sự Vĩnh Long', 'DEPT007', 'Phòng ban phụ trách nhân sự và tuyển dụng - Vĩnh Long', 3, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  branch_id = EXCLUDED.branch_id;

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments), true);

-- =====================================================
-- 4. EMPLOYEES (Nhân viên)
-- =====================================================
INSERT INTO employees (id, employee_code, name, email, role_id, department_id, position, level, currency, hire_date, contract_type, status, is_active, password_hash, login_attempts)
VALUES 
  (1, 'EMP001', 'Admin User', 'admin@y99.com', 1, 4, 'Admin', 4, 'VND', '2024-01-01', 'fulltime', 'active', true, 'password123', 0),
  (2, 'EMP002', 'Nguyễn Văn A', 'nguyenvana@y99.com', 4, 1, 'Nhân viên Kinh doanh', 1, 'VND', '2024-02-01', 'fulltime', 'active', true, 'password123', 0),
  (3, 'EMP003', 'Trần Thị B', 'tranthib@y99.com', 2, 2, 'Quản lý Marketing', 3, 'VND', '2024-01-15', 'fulltime', 'active', true, 'password123', 0),
  (4, 'EMP004', 'Lê Văn C', 'levanc@y99.com', 4, 1, 'Nhân viên Kinh doanh', 1, 'VND', '2024-03-01', 'fulltime', 'active', true, 'password123', 0),
  (5, 'EMP005', 'Phạm Thị D', 'phamthid@y99.com', 4, 3, 'Nhân viên Nhân sự', 1, 'VND', '2024-02-15', 'fulltime', 'active', true, 'password123', 0),
  (6, 'EMP006', 'Hoàng Văn E', 'hoangvane@y99.com', 4, 4, 'Nhân viên IT', 1, 'VND', '2024-03-15', 'fulltime', 'active', true, 'password123', 0),
  -- Nhân viên chi nhánh Vĩnh Long
  (7, 'EMP007', 'Võ Văn F', 'vovanf@y99.com', 2, 5, 'Quản lý Kinh doanh Vĩnh Long', 3, 'VND', '2024-04-01', 'fulltime', 'active', true, 'password123', 0),
  (8, 'EMP008', 'Đỗ Thị G', 'dothig@y99.com', 4, 5, 'Nhân viên Kinh doanh Vĩnh Long', 1, 'VND', '2024-04-15', 'fulltime', 'active', true, 'password123', 0),
  (9, 'EMP009', 'Bùi Văn H', 'buivanh@y99.com', 4, 5, 'Nhân viên Kinh doanh Vĩnh Long', 1, 'VND', '2024-05-01', 'fulltime', 'active', true, 'password123', 0),
  (10, 'EMP010', 'Lý Thị I', 'lythii@y99.com', 4, 6, 'Nhân viên Marketing Vĩnh Long', 1, 'VND', '2024-04-20', 'fulltime', 'active', true, 'password123', 0),
  (11, 'EMP011', 'Ngô Văn K', 'ngovank@y99.com', 4, 7, 'Nhân viên Nhân sự Vĩnh Long', 1, 'VND', '2024-05-10', 'fulltime', 'active', true, 'password123', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role_id = EXCLUDED.role_id,
  department_id = EXCLUDED.department_id,
  position = EXCLUDED.position,
  password_hash = EXCLUDED.password_hash;

SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees), true);

-- Cập nhật manager_id cho branch Vĩnh Long sau khi employees đã được tạo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
    UPDATE branches SET manager_id = 7 WHERE id = 3 AND manager_id IS NULL;
  END IF;
END $$;

-- =====================================================
-- 5. KPIS (Mẫu KPI)
-- =====================================================
INSERT INTO kpis (id, name, description, department_id, target, unit, frequency, status, reward_penalty_config, created_by, is_active)
VALUES 
  (1, 'Số lượng khách hàng mới', 'Tổng số khách hàng mới trong tháng', 1, 100, 'khách hàng', 'monthly', 'active', '{"bonus_amount": 1000000, "penalty_amount": 500000}'::jsonb, 1, true),
  (2, 'Tỷ lệ chuyển đổi khách hàng', 'Tỷ lệ khách hàng tiềm năng chuyển thành khách hàng thực tế', 1, 30, '%', 'monthly', 'active', '{"bonus_amount": 800000, "penalty_amount": 400000}'::jsonb, 1, true),
  (3, 'Số bài viết marketing', 'Số lượng bài viết marketing được xuất bản trong tháng', 2, 20, 'bài viết', 'monthly', 'active', '{"bonus_amount": 600000, "penalty_amount": 300000}'::jsonb, 1, true),
  (4, 'Số ứng viên tuyển dụng', 'Số lượng ứng viên được tuyển dụng thành công trong quý', 3, 10, 'người', 'quarterly', 'active', '{"bonus_amount": 1200000, "penalty_amount": 600000}'::jsonb, 1, true),
  (5, 'Số lỗi code', 'Số lỗi code phát sinh trong tháng', 4, 10, 'lỗi', 'monthly', 'active', '{"bonus_amount": 0, "penalty_amount": 300000}'::jsonb, 1, true),
  -- KPIs cho chi nhánh Vĩnh Long
  (6, 'Số lượng khách hàng mới Vĩnh Long', 'Tổng số khách hàng mới trong tháng - Vĩnh Long', 5, 80, 'khách hàng', 'monthly', 'active', '{"bonus_amount": 800000, "penalty_amount": 400000}'::jsonb, 1, true),
  (7, 'Số bài viết marketing Vĩnh Long', 'Số lượng bài viết marketing được xuất bản trong tháng - Vĩnh Long', 6, 15, 'bài viết', 'monthly', 'active', '{"bonus_amount": 500000, "penalty_amount": 250000}'::jsonb, 1, true),
  (8, 'Số ứng viên tuyển dụng Vĩnh Long', 'Số lượng ứng viên được tuyển dụng thành công trong quý - Vĩnh Long', 7, 8, 'người', 'quarterly', 'active', '{"bonus_amount": 1000000, "penalty_amount": 500000}'::jsonb, 1, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  department_id = EXCLUDED.department_id,
  target = EXCLUDED.target,
  unit = EXCLUDED.unit,
  frequency = EXCLUDED.frequency;

SELECT setval('kpis_id_seq', (SELECT MAX(id) FROM kpis), true);

-- =====================================================
-- 6. KPI RECORDS (KPI được giao)
-- =====================================================
INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_details, is_active, submission_date, approval_date, approved_by)
VALUES 
  -- KPI cho Employee 2 (Nguyễn Văn A) - Tháng 1/2025
  (1, 1, 2, NULL, 'M1-2025', 100, 95, 95, 'approved', '2025-01-01', '2025-01-31', 'Đang thực hiện tốt, còn 5 khách hàng nữa', true, '2025-01-28', '2025-01-30', 1),
  (2, 2, 2, NULL, 'M1-2025', 30, 28, 93, 'approved', '2025-01-01', '2025-01-31', 'Tiến độ ổn định', true, '2025-01-28', '2025-01-30', 1),
  
  -- KPI cho Employee 4 (Lê Văn C) - Tháng 1/2025
  (3, 1, 4, NULL, 'M1-2025', 100, 105, 105, 'approved', '2025-01-01', '2025-01-31', 'Vượt mục tiêu 5 khách hàng', true, '2025-01-29', '2025-01-31', 1),
  
  -- KPI cho Department Marketing (Trần Thị B quản lý)
  (4, 3, NULL, 2, 'M1-2025', 20, 18, 90, 'in_progress', '2025-01-01', '2025-01-31', 'Đang hoàn thiện 2 bài viết cuối', true, NULL, NULL, NULL),
  
  -- KPI cho Employee 5 (Phạm Thị D) - Quý 1/2025
  (5, 4, 5, NULL, 'Q1-2025', 10, 8, 80, 'in_progress', '2025-01-01', '2025-03-31', 'Đã tuyển được 8 ứng viên, còn 2 nữa', true, NULL, NULL, NULL),
  
  -- KPI cho Employee 6 (Hoàng Văn E) - Tháng 1/2025
  (6, 5, 6, NULL, 'M1-2025', 10, 8, 80, 'approved', '2025-01-01', '2025-01-31', 'Ít lỗi hơn mục tiêu', true, '2025-01-28', '2025-01-30', 1),
  
  -- KPI cho Employee 2 - Tháng 2/2025 (chưa submit)
  (7, 1, 2, NULL, 'M2-2025', 100, 0, 0, 'not_started', '2025-02-01', '2025-02-28', '', true, NULL, NULL, NULL),
  (8, 2, 2, NULL, 'M2-2025', 30, 0, 0, 'not_started', '2025-02-01', '2025-02-28', '', true, NULL, NULL, NULL),
  
  -- KPI cho nhân viên Vĩnh Long - Tháng 1/2025
  (9, 6, 8, NULL, 'M1-2025', 80, 75, 94, 'approved', '2025-01-01', '2025-01-31', 'Hoàn thành tốt, còn thiếu 5 khách hàng', true, '2025-01-28', '2025-01-30', 7),
  (10, 6, 9, NULL, 'M1-2025', 80, 82, 103, 'approved', '2025-01-01', '2025-01-31', 'Vượt mục tiêu 2 khách hàng', true, '2025-01-29', '2025-01-31', 7),
  (11, 7, 10, NULL, 'M1-2025', 15, 12, 80, 'in_progress', '2025-01-01', '2025-01-31', 'Đang hoàn thiện 3 bài viết cuối', true, NULL, NULL, NULL),
  (12, 8, 11, NULL, 'Q1-2025', 8, 6, 75, 'in_progress', '2025-01-01', '2025-03-31', 'Đã tuyển được 6 ứng viên, còn 2 nữa', true, NULL, NULL, NULL),
  
  -- KPI cho nhân viên Vĩnh Long - Tháng 2/2025
  (13, 6, 8, NULL, 'M2-2025', 80, 0, 0, 'not_started', '2025-02-01', '2025-02-28', '', true, NULL, NULL, NULL),
  (14, 6, 9, NULL, 'M2-2025', 80, 0, 0, 'not_started', '2025-02-01', '2025-02-28', '', true, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  kpi_id = EXCLUDED.kpi_id,
  employee_id = EXCLUDED.employee_id,
  department_id = EXCLUDED.department_id,
  actual = EXCLUDED.actual,
  progress = EXCLUDED.progress,
  status = EXCLUDED.status,
  submission_date = EXCLUDED.submission_date,
  approval_date = EXCLUDED.approval_date,
  approved_by = EXCLUDED.approved_by;

SELECT setval('kpi_records_id_seq', (SELECT MAX(id) FROM kpi_records), true);

-- =====================================================
-- 7. DAILY KPI PROGRESS (Tiến độ hàng ngày)
-- =====================================================
INSERT INTO daily_kpi_progress (id, date, department_id, department_name, employee_id, responsible_person, kpi_id, kpi_name, actual_result, notes, created_by, is_active)
VALUES 
  (1, '2025-01-15', 1, 'Phòng Kinh doanh', 2, 'Nguyễn Văn A', 1, 'Số lượng khách hàng mới', 3, 'Có thêm 3 khách hàng mới hôm nay', 1, true),
  (2, '2025-01-16', 1, 'Phòng Kinh doanh', 2, 'Nguyễn Văn A', 1, 'Số lượng khách hàng mới', 2, 'Tiếp tục phát triển', 1, true),
  (3, '2025-01-17', 1, 'Phòng Kinh doanh', 4, 'Lê Văn C', 1, 'Số lượng khách hàng mới', 4, 'Ngày làm việc hiệu quả', 1, true),
  (4, '2025-01-18', 2, 'Phòng Marketing', 3, 'Trần Thị B', 3, 'Số bài viết marketing', 1, 'Đã xuất bản 1 bài viết mới', 1, true),
  (5, '2025-01-20', 4, 'Phòng IT', 6, 'Hoàng Văn E', 5, 'Số lỗi code', 1, 'Phát hiện và sửa 1 lỗi', 1, true),
  (6, '2025-02-01', 1, 'Phòng Kinh doanh', 2, 'Nguyễn Văn A', 1, 'Số lượng khách hàng mới', 2, 'Khởi động tháng 2', 1, true),
  -- Daily progress cho Vĩnh Long
  (7, '2025-01-15', 5, 'Phòng Kinh doanh Vĩnh Long', 8, 'Đỗ Thị G', 6, 'Số lượng khách hàng mới Vĩnh Long', 2, 'Có thêm 2 khách hàng mới', 7, true),
  (8, '2025-01-16', 5, 'Phòng Kinh doanh Vĩnh Long', 9, 'Bùi Văn H', 6, 'Số lượng khách hàng mới Vĩnh Long', 3, 'Tiếp tục phát triển tốt', 7, true),
  (9, '2025-01-20', 6, 'Phòng Marketing Vĩnh Long', 10, 'Lý Thị I', 7, 'Số bài viết marketing Vĩnh Long', 1, 'Đã xuất bản 1 bài viết', 7, true)
ON CONFLICT (id) DO UPDATE SET
  date = EXCLUDED.date,
  actual_result = EXCLUDED.actual_result,
  notes = EXCLUDED.notes;

SELECT setval('daily_kpi_progress_id_seq', (SELECT MAX(id) FROM daily_kpi_progress), true);

-- =====================================================
-- 8. BONUS PENALTY RECORDS (Thưởng/Phạt)
-- =====================================================
INSERT INTO bonus_penalty_records (id, employee_id, kpi_id, type, amount, reason, period, created_by, is_active)
VALUES 
  (1, 2, 1, 'bonus', 950000, 'Hoàn thành 95% mục tiêu số khách hàng mới', 'M1-2025', 1, true),
  (2, 2, 2, 'bonus', 800000, 'Hoàn thành 93% mục tiêu tỷ lệ chuyển đổi', 'M1-2025', 1, true),
  (3, 4, 1, 'bonus', 1050000, 'Vượt mục tiêu 5% số khách hàng mới', 'M1-2025', 1, true),
  (4, 6, 5, 'bonus', 50000, 'Hoàn thành tốt, ít lỗi hơn mục tiêu (8 < 10)', 'M1-2025', 1, true),
  (5, 5, 4, 'penalty', 240000, 'Chưa đạt mục tiêu tuyển dụng (8/10)', 'Q1-2025', 1, true),
  -- Bonus cho nhân viên Vĩnh Long
  (6, 8, 6, 'bonus', 752000, 'Hoàn thành 94% mục tiêu số khách hàng mới Vĩnh Long', 'M1-2025', 7, true),
  (7, 9, 6, 'bonus', 824000, 'Vượt mục tiêu 2.5% số khách hàng mới Vĩnh Long', 'M1-2025', 7, true)
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  amount = EXCLUDED.amount,
  reason = EXCLUDED.reason,
  type = EXCLUDED.type;

SELECT setval('bonus_penalty_records_id_seq', (SELECT MAX(id) FROM bonus_penalty_records), true);

-- =====================================================
-- 9. KPI SUBMISSIONS (Báo cáo KPI)
-- =====================================================
INSERT INTO kpi_submissions (id, employee_id, submission_date, submission_details, attachment, status, approval_date, approved_by, rejection_reason, is_active)
VALUES 
  (1, 2, '2025-01-28 10:00:00', 'Báo cáo KPI tháng 1/2025 - Nguyễn Văn A', NULL, 'approved', '2025-01-30 14:00:00', 1, NULL, true),
  (2, 4, '2025-01-29 11:00:00', 'Báo cáo KPI tháng 1/2025 - Lê Văn C', NULL, 'approved', '2025-01-31 15:00:00', 1, NULL, true),
  (3, 6, '2025-01-28 09:00:00', 'Báo cáo KPI tháng 1/2025 - Hoàng Văn E', NULL, 'approved', '2025-01-30 13:00:00', 1, NULL, true),
  (4, 5, '2025-01-25 10:30:00', 'Báo cáo KPI quý 1/2025 - Phạm Thị D', NULL, 'pending_approval', NULL, NULL, NULL, true),
  -- KPI submissions cho Vĩnh Long
  (5, 8, '2025-01-28 14:00:00', 'Báo cáo KPI tháng 1/2025 - Đỗ Thị G (Vĩnh Long)', NULL, 'approved', '2025-01-30 16:00:00', 7, NULL, true),
  (6, 9, '2025-01-29 15:00:00', 'Báo cáo KPI tháng 1/2025 - Bùi Văn H (Vĩnh Long)', NULL, 'approved', '2025-01-31 17:00:00', 7, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  submission_date = EXCLUDED.submission_date,
  status = EXCLUDED.status,
  approval_date = EXCLUDED.approval_date,
  approved_by = EXCLUDED.approved_by;

SELECT setval('kpi_submissions_id_seq', (SELECT MAX(id) FROM kpi_submissions), true);

-- =====================================================
-- 10. KPI SUBMISSION ITEMS (Chi tiết KPI trong báo cáo)
-- =====================================================
INSERT INTO kpi_submission_items (id, submission_id, kpi_record_id, actual, progress, notes, is_active)
VALUES 
  -- Chi tiết báo cáo của Employee 2 (submission 1)
  (1, 1, 1, 95, 95, 'Hoàn thành 95 khách hàng mới, còn thiếu 5 khách hàng', true),
  (2, 1, 2, 28, 93, 'Tỷ lệ chuyển đổi đạt 93%, gần đạt mục tiêu', true),
  
  -- Chi tiết báo cáo của Employee 4 (submission 2)
  (3, 2, 3, 105, 105, 'Vượt mục tiêu 5 khách hàng, đạt 105%', true),
  
  -- Chi tiết báo cáo của Employee 6 (submission 3)
  (4, 3, 6, 8, 80, 'Chỉ có 8 lỗi code, tốt hơn mục tiêu 10 lỗi', true),
  
  -- Chi tiết báo cáo của Employee 5 (submission 4 - pending)
  (5, 4, 5, 8, 80, 'Đã tuyển được 8 ứng viên, còn thiếu 2 người', true),
  
  -- Chi tiết báo cáo cho Vĩnh Long
  (6, 5, 9, 75, 94, 'Hoàn thành 75 khách hàng mới, còn thiếu 5 khách hàng', true),
  (7, 6, 10, 82, 103, 'Vượt mục tiêu 2 khách hàng, đạt 103%', true)
ON CONFLICT (id) DO UPDATE SET
  submission_id = EXCLUDED.submission_id,
  kpi_record_id = EXCLUDED.kpi_record_id,
  actual = EXCLUDED.actual,
  progress = EXCLUDED.progress,
  notes = EXCLUDED.notes;

SELECT setval('kpi_submission_items_id_seq', (SELECT MAX(id) FROM kpi_submission_items), true);

-- =====================================================
-- 11. NOTIFICATIONS (Thông báo)
-- =====================================================
INSERT INTO notifications (id, user_id, user_type, type, priority, category, title, message, read, is_active)
VALUES 
  (1, 2, 'employee', 'assigned', 'medium', 'kpi', 'KPI mới được giao', 'Bạn đã được giao KPI "Số lượng khách hàng mới" với mục tiêu 100 khách hàng trong tháng 1', false, true),
  (2, 2, 'employee', 'reminder', 'high', 'kpi', 'Nhắc nhở deadline', 'KPI của bạn sắp hết hạn vào ngày 31/01/2025. Còn 15 ngày nữa!', false, true),
  (3, 2, 'employee', 'approved', 'medium', 'kpi', 'KPI đã được phê duyệt', 'KPI tháng 1/2025 của bạn đã được phê duyệt thành công', false, true),
  (4, 4, 'employee', 'reward', 'high', 'bonus', 'Thưởng vượt mục tiêu', 'Chúc mừng! Bạn nhận 1,050,000 VNĐ thưởng cho KPI tháng 1/2025', false, true),
  (5, 1, 'admin', 'submitted', 'medium', 'kpi', 'KPI đã được submit', 'Lê Văn C đã submit KPI "Số lượng khách hàng mới" M1-2025', false, true),
  (6, 1, 'admin', 'submitted', 'medium', 'kpi', 'KPI đã được submit', 'Hoàng Văn E đã submit KPI "Số lỗi code" M1-2025', false, true),
  (7, 5, 'employee', 'submitted', 'medium', 'kpi', 'Báo cáo đã được gửi', 'Báo cáo KPI quý 1/2025 của bạn đã được gửi và đang chờ phê duyệt', false, true),
  (8, 6, 'employee', 'approved', 'medium', 'kpi', 'KPI đã được phê duyệt', 'KPI tháng 1/2025 của bạn đã được phê duyệt', false, true),
  (9, 2, 'employee', 'assigned', 'medium', 'kpi', 'KPI tháng 2 được giao', 'Bạn đã được giao KPI "Số lượng khách hàng mới" và "Tỷ lệ chuyển đổi" cho tháng 2/2025', false, true),
  (10, NULL, 'all', 'system', 'low', 'system', 'Thông báo hệ thống', 'Hệ thống KPI đã được cập nhật phiên bản mới', false, true),
  -- Notifications cho Vĩnh Long
  (11, 8, 'employee', 'assigned', 'medium', 'kpi', 'KPI mới được giao - Vĩnh Long', 'Bạn đã được giao KPI "Số lượng khách hàng mới Vĩnh Long" với mục tiêu 80 khách hàng trong tháng 1', false, true),
  (12, 9, 'employee', 'assigned', 'medium', 'kpi', 'KPI mới được giao - Vĩnh Long', 'Bạn đã được giao KPI "Số lượng khách hàng mới Vĩnh Long" với mục tiêu 80 khách hàng trong tháng 1', false, true),
  (13, 8, 'employee', 'approved', 'medium', 'kpi', 'KPI đã được phê duyệt - Vĩnh Long', 'KPI tháng 1/2025 của bạn đã được phê duyệt thành công', false, true),
  (14, 9, 'employee', 'reward', 'high', 'bonus', 'Thưởng vượt mục tiêu - Vĩnh Long', 'Chúc mừng! Bạn nhận 824,000 VNĐ thưởng cho KPI tháng 1/2025', false, true),
  (15, 7, 'admin', 'submitted', 'medium', 'kpi', 'KPI đã được submit - Vĩnh Long', 'Đỗ Thị G đã submit KPI "Số lượng khách hàng mới Vĩnh Long" M1-2025', false, true)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  read = EXCLUDED.read;

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications), true);

-- =====================================================
-- VERIFY DATA
-- =====================================================
SELECT '=== DỮ LIỆU MẪU ĐÃ ĐƯỢC THÊM ===' as info;

SELECT 'Roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'KPIs', COUNT(*) FROM kpis
UNION ALL
SELECT 'KPI Records', COUNT(*) FROM kpi_records
UNION ALL
SELECT 'Daily Progress', COUNT(*) FROM daily_kpi_progress
UNION ALL
SELECT 'Bonus Penalty', COUNT(*) FROM bonus_penalty_records
UNION ALL
SELECT 'KPI Submissions', COUNT(*) FROM kpi_submissions
UNION ALL
SELECT 'KPI Submission Items', COUNT(*) FROM kpi_submission_items
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;

-- Verify branches nếu bảng tồn tại
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
    RAISE NOTICE 'Branches: %', (SELECT COUNT(*) FROM branches);
  END IF;
END $$;

SELECT '=== CHI TIẾT DỮ LIỆU ===' as info;

SELECT 'KPI Records Status' as info, status, COUNT(*) as count 
FROM kpi_records 
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'approved' THEN 1
    WHEN 'pending_approval' THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'not_started' THEN 4
    ELSE 5
  END;

SELECT 'KPI Submissions Status' as info, status, COUNT(*) as count 
FROM kpi_submissions 
GROUP BY status;

SELECT 'Bonus/Penalty Summary' as info, type, COUNT(*) as count, SUM(amount) as total_amount
FROM bonus_penalty_records 
GROUP BY type;

SELECT '=== DỮ LIỆU SẴN SÀNG ĐỂ TEST ===' as info;


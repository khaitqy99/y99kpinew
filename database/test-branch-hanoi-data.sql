-- =====================================================
-- TEST DATA CHO CHI NHÁNH HÀ NỘI (BRANCH001)
-- Dữ liệu test với nhiều period khác nhau để test chức năng lọc
-- =====================================================
-- LƯU Ý: 
-- - File này tạo dữ liệu test cho chi nhánh Hà Nội (BRANCH001)
-- - Tạo dữ liệu cho nhiều quý và tháng khác nhau (2024-2025)
-- - Safe to run multiple times (sử dụng ON CONFLICT)

-- =====================================================
-- 1. ĐẢM BẢO BRANCH HÀ NỘI TỒN TẠI
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
    INSERT INTO branches (id, name, code, description, address, phone, email, is_active)
    VALUES 
      (1, 'Chi nhánh Hà Nội', 'BRANCH001', 'Trụ sở chính tại Hà Nội', '123 Đường ABC, Quận XYZ, Hà Nội', '0241234567', 'hanoi@y99.com', true)
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
-- 2. TẠO DEPARTMENTS CHO CHI NHÁNH HÀ NỘI
-- =====================================================
INSERT INTO departments (id, name, code, description, branch_id, is_active)
VALUES 
  (1, 'Phòng Kinh doanh Hà Nội', 'DEPT001', 'Phòng ban phụ trách kinh doanh và sales - Hà Nội', 1, true),
  (2, 'Phòng Marketing Hà Nội', 'DEPT002', 'Phòng ban phụ trách marketing và truyền thông - Hà Nội', 1, true),
  (3, 'Phòng Nhân sự Hà Nội', 'DEPT003', 'Phòng ban phụ trách nhân sự và tuyển dụng - Hà Nội', 1, true),
  (4, 'Phòng IT Hà Nội', 'DEPT004', 'Phòng ban phụ trách công nghệ thông tin - Hà Nội', 1, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  branch_id = EXCLUDED.branch_id;

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments), true);

-- =====================================================
-- 3. TẠO EMPLOYEES CHO CHI NHÁNH HÀ NỘI
-- =====================================================
-- Đảm bảo roles tồn tại
INSERT INTO roles (id, name, code, description, level, permissions, is_active)
VALUES 
  (1, 'Admin', 'ROLE001', 'Quản trị viên hệ thống', 4, '["all"]'::jsonb, true),
  (2, 'Manager', 'ROLE002', 'Quản lý phòng ban', 3, '["view_all", "approve"]'::jsonb, true),
  (4, 'Employee', 'ROLE004', 'Nhân viên', 1, '["view_own", "submit"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (id, employee_code, name, email, role_id, department_id, position, level, currency, hire_date, contract_type, status, is_active, password_hash, login_attempts)
VALUES 
  (1, 'EMP001', 'Admin User', 'admin@y99.com', 1, 4, 'Admin', 4, 'VND', '2024-01-01', 'fulltime', 'active', true, 'password123', 0),
  (2, 'EMP002', 'Nguyễn Văn A', 'nguyenvana@y99.com', 4, 1, 'Nhân viên Kinh doanh', 1, 'VND', '2024-02-01', 'fulltime', 'active', true, 'password123', 0),
  (3, 'EMP003', 'Trần Thị B', 'tranthib@y99.com', 2, 2, 'Quản lý Marketing', 3, 'VND', '2024-01-15', 'fulltime', 'active', true, 'password123', 0),
  (4, 'EMP004', 'Lê Văn C', 'levanc@y99.com', 4, 1, 'Nhân viên Kinh doanh', 1, 'VND', '2024-03-01', 'fulltime', 'active', true, 'password123', 0),
  (5, 'EMP005', 'Phạm Thị D', 'phamthid@y99.com', 4, 3, 'Nhân viên Nhân sự', 1, 'VND', '2024-02-15', 'fulltime', 'active', true, 'password123', 0),
  (6, 'EMP006', 'Hoàng Văn E', 'hoangvane@y99.com', 4, 4, 'Nhân viên IT', 1, 'VND', '2024-03-15', 'fulltime', 'active', true, 'password123', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role_id = EXCLUDED.role_id,
  department_id = EXCLUDED.department_id,
  position = EXCLUDED.position;

SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees), true);

-- Cập nhật manager_id cho branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
    UPDATE branches SET manager_id = 1 WHERE id = 1 AND manager_id IS NULL;
  END IF;
END $$;

-- =====================================================
-- 4. TẠO KPIS CHO CHI NHÁNH HÀ NỘI
-- =====================================================
INSERT INTO kpis (id, name, description, department_id, target, unit, frequency, status, reward_penalty_config, created_by, is_active)
VALUES 
  (1, 'Số lượng khách hàng mới', 'Tổng số khách hàng mới trong tháng', 1, 100, 'khách hàng', 'monthly', 'active', '{"bonus_amount": 1000000, "penalty_amount": 500000}'::jsonb, 1, true),
  (2, 'Tỷ lệ chuyển đổi khách hàng', 'Tỷ lệ khách hàng tiềm năng chuyển thành khách hàng thực tế', 1, 30, '%', 'monthly', 'active', '{"bonus_amount": 800000, "penalty_amount": 400000}'::jsonb, 1, true),
  (3, 'Số bài viết marketing', 'Số lượng bài viết marketing được xuất bản trong tháng', 2, 20, 'bài viết', 'monthly', 'active', '{"bonus_amount": 600000, "penalty_amount": 300000}'::jsonb, 1, true),
  (4, 'Số ứng viên tuyển dụng', 'Số lượng ứng viên được tuyển dụng thành công trong quý', 3, 10, 'người', 'quarterly', 'active', '{"bonus_amount": 1200000, "penalty_amount": 600000}'::jsonb, 1, true),
  (5, 'Số lỗi code', 'Số lỗi code phát sinh trong tháng', 4, 10, 'lỗi', 'monthly', 'active', '{"bonus_amount": 0, "penalty_amount": 300000}'::jsonb, 1, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  department_id = EXCLUDED.department_id,
  target = EXCLUDED.target,
  unit = EXCLUDED.unit,
  frequency = EXCLUDED.frequency;

SELECT setval('kpis_id_seq', (SELECT MAX(id) FROM kpis), true);

-- =====================================================
-- 5. TẠO KPI RECORDS VỚI NHIỀU PERIOD KHÁC NHAU
-- =====================================================
-- Xóa dữ liệu cũ cho chi nhánh Hà Nội để tránh duplicate key
-- Xóa các KPI records của employees và departments thuộc chi nhánh Hà Nội
DELETE FROM kpi_records 
WHERE (
  -- KPI records của employees thuộc chi nhánh Hà Nội
  (employee_id IN (SELECT id FROM employees WHERE department_id IN (SELECT id FROM departments WHERE branch_id = 1)))
  OR
  -- KPI records của departments thuộc chi nhánh Hà Nội
  (department_id IN (SELECT id FROM departments WHERE branch_id = 1))
  OR
  -- KPI records của các KPIs thuộc chi nhánh Hà Nội
  (kpi_id IN (SELECT id FROM kpis WHERE department_id IN (SELECT id FROM departments WHERE branch_id = 1)))
);

-- Helper function để tính toán bonus/penalty
DO $$
DECLARE
  record_id BIGINT := 1000; -- Bắt đầu từ ID 1000 để tránh conflict
  bonus_amt DECIMAL(15,2);
  penalty_amt DECIMAL(15,2);
  progress_val DECIMAL(5,2);
  actual_val DECIMAL(15,2);
BEGIN
  -- ============================================
  -- QUÝ 1-4 NĂM 2024
  -- ============================================
  
  -- Q1-2024: Employee 2 (KPI 1 - Monthly nhưng có thể có record quý)
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 1, 2, NULL, 'Q1-2024', 300, 285, 95.00, 'approved', '2024-01-01', '2024-03-31', '2024-03-28', '2024-03-30', 1, 0, 500000, true);
  record_id := record_id + 1;
  
  -- Q2-2024
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 1, 2, NULL, 'Q2-2024', 300, 310, 103.33, 'approved', '2024-04-01', '2024-06-30', '2024-06-28', '2024-06-30', 1, 1000000, 0, true);
  record_id := record_id + 1;
  
  -- Q3-2024
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 1, 2, NULL, 'Q3-2024', 300, 295, 98.33, 'approved', '2024-07-01', '2024-09-30', '2024-09-28', '2024-09-30', 1, 0, 0, true);
  record_id := record_id + 1;
  
  -- Q4-2024
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 1, 2, NULL, 'Q4-2024', 300, 320, 106.67, 'approved', '2024-10-01', '2024-12-31', '2024-12-28', '2024-12-30', 1, 1000000, 0, true);
  record_id := record_id + 1;
  
  -- ============================================
  -- THÁNG 1-12 NĂM 2024
  -- ============================================
  -- Employee 2 - KPI 1 (Monthly)
  FOR month_num IN 1..12 LOOP
    actual_val := 90 + (month_num * 2) + (RANDOM() * 10)::INTEGER;
    progress_val := (actual_val / 100) * 100;
    
    IF progress_val >= 100 THEN
      bonus_amt := 1000000;
      penalty_amt := 0;
    ELSIF progress_val >= 80 THEN
      bonus_amt := 0;
      penalty_amt := 0;
    ELSE
      bonus_amt := 0;
      penalty_amt := 500000;
    END IF;
    
    INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
    VALUES (
      record_id,
      1,
      2,
      NULL,
      'M' || month_num || '-2024',
      100,
      actual_val,
      progress_val,
      CASE WHEN month_num <= 11 THEN 'approved' ELSE 'in_progress' END,
      (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month')::DATE,
      (DATE '2024-01-01' + month_num * INTERVAL '1 month' - INTERVAL '1 day')::DATE,
      CASE WHEN month_num <= 11 THEN (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '27 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
      CASE WHEN month_num <= 11 THEN (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '29 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
      CASE WHEN month_num <= 11 THEN 1 ELSE NULL END,
      bonus_amt,
      penalty_amt,
      true
    );
    record_id := record_id + 1;
  END LOOP;
  
  -- Employee 4 - KPI 1 (Monthly) - 2024
  FOR month_num IN 1..12 LOOP
    actual_val := 95 + (month_num * 1.5) + (RANDOM() * 8)::INTEGER;
    progress_val := (actual_val / 100) * 100;
    
    IF progress_val >= 100 THEN
      bonus_amt := 1000000;
      penalty_amt := 0;
    ELSIF progress_val >= 80 THEN
      bonus_amt := 0;
      penalty_amt := 0;
    ELSE
      bonus_amt := 0;
      penalty_amt := 500000;
    END IF;
    
    INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
    VALUES (
      record_id,
      1,
      4,
      NULL,
      'M' || month_num || '-2024',
      100,
      actual_val,
      progress_val,
      CASE WHEN month_num <= 11 THEN 'approved' ELSE 'in_progress' END,
      (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month')::DATE,
      (DATE '2024-01-01' + month_num * INTERVAL '1 month' - INTERVAL '1 day')::DATE,
      CASE WHEN month_num <= 11 THEN (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '27 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
      CASE WHEN month_num <= 11 THEN (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '29 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
      CASE WHEN month_num <= 11 THEN 1 ELSE NULL END,
      bonus_amt,
      penalty_amt,
      true
    );
    record_id := record_id + 1;
  END LOOP;
  
  -- Department 2 (Marketing) - KPI 3 (Monthly) - 2024
  FOR month_num IN 1..12 LOOP
    actual_val := 18 + (RANDOM() * 5)::INTEGER;
    progress_val := (actual_val / 20) * 100;
    
    IF progress_val >= 100 THEN
      bonus_amt := 600000;
      penalty_amt := 0;
    ELSIF progress_val >= 80 THEN
      bonus_amt := 0;
      penalty_amt := 0;
    ELSE
      bonus_amt := 0;
      penalty_amt := 300000;
    END IF;
    
    INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
    VALUES (
      record_id,
      3,
      NULL,
      2,
      'M' || month_num || '-2024',
      20,
      actual_val,
      progress_val,
      CASE WHEN month_num <= 11 THEN 'approved' ELSE 'in_progress' END,
      (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month')::DATE,
      (DATE '2024-01-01' + month_num * INTERVAL '1 month' - INTERVAL '1 day')::DATE,
      CASE WHEN month_num <= 11 THEN (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '27 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
      CASE WHEN month_num <= 11 THEN (DATE '2024-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '29 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
      CASE WHEN month_num <= 11 THEN 1 ELSE NULL END,
      bonus_amt,
      penalty_amt,
      true
    );
    record_id := record_id + 1;
  END LOOP;
  
  -- Employee 5 - KPI 4 (Quarterly) - 2024
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 4, 5, NULL, 'Q1-2024', 10, 8, 80.00, 'approved', '2024-01-01', '2024-03-31', '2024-03-28', '2024-03-30', 1, 0, 600000, true);
  record_id := record_id + 1;
  
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 4, 5, NULL, 'Q2-2024', 10, 10, 100.00, 'approved', '2024-04-01', '2024-06-30', '2024-06-28', '2024-06-30', 1, 1200000, 0, true);
  record_id := record_id + 1;
  
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 4, 5, NULL, 'Q3-2024', 10, 12, 120.00, 'approved', '2024-07-01', '2024-09-30', '2024-09-28', '2024-09-30', 1, 1200000, 0, true);
  record_id := record_id + 1;
  
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 4, 5, NULL, 'Q4-2024', 10, 9, 90.00, 'approved', '2024-10-01', '2024-12-31', '2024-12-28', '2024-12-30', 1, 0, 0, true);
  record_id := record_id + 1;
  
  -- ============================================
  -- QUÝ 1-4 NĂM 2025
  -- ============================================
  
  -- Q1-2025
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 1, 2, NULL, 'Q1-2025', 300, 290, 96.67, 'approved', '2025-01-01', '2025-03-31', '2025-03-28', '2025-03-30', 1, 0, 0, true);
  record_id := record_id + 1;
  
  -- Q2-2025
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 1, 2, NULL, 'Q2-2025', 300, 315, 105.00, 'approved', '2025-04-01', '2025-06-30', '2025-06-28', '2025-06-30', 1, 1000000, 0, true);
  record_id := record_id + 1;
  
  -- Q3-2025 (có thể đang in_progress)
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 1, 2, NULL, 'Q3-2025', 300, 150, 50.00, 'in_progress', '2025-07-01', '2025-09-30', NULL, NULL, NULL, 0, 0, true);
  record_id := record_id + 1;
  
  -- ============================================
  -- THÁNG 1-12 NĂM 2025
  -- ============================================
  -- Employee 2 - KPI 1 (Monthly) - 2025
  FOR month_num IN 1..12 LOOP
    actual_val := 92 + (month_num * 1.8) + (RANDOM() * 10)::INTEGER;
    progress_val := (actual_val / 100) * 100;
    
    IF progress_val >= 100 THEN
      bonus_amt := 1000000;
      penalty_amt := 0;
    ELSIF progress_val >= 80 THEN
      bonus_amt := 0;
      penalty_amt := 0;
    ELSE
      bonus_amt := 0;
      penalty_amt := 500000;
    END IF;
    
    -- Chỉ tạo dữ liệu cho các tháng đã qua hoặc tháng hiện tại
    IF month_num <= EXTRACT(MONTH FROM CURRENT_DATE) OR EXTRACT(YEAR FROM CURRENT_DATE) > 2025 THEN
      INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
      VALUES (
        record_id,
        1,
        2,
        NULL,
        'M' || month_num || '-2025',
        100,
        actual_val,
        progress_val,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN 'approved' ELSE 'in_progress' END,
        (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month')::DATE,
        (DATE '2025-01-01' + month_num * INTERVAL '1 month' - INTERVAL '1 day')::DATE,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '27 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '29 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN 1 ELSE NULL END,
        bonus_amt,
        penalty_amt,
        true
      );
      record_id := record_id + 1;
    END IF;
  END LOOP;
  
  -- Employee 4 - KPI 1 (Monthly) - 2025
  FOR month_num IN 1..12 LOOP
    actual_val := 96 + (month_num * 1.2) + (RANDOM() * 8)::INTEGER;
    progress_val := (actual_val / 100) * 100;
    
    IF progress_val >= 100 THEN
      bonus_amt := 1000000;
      penalty_amt := 0;
    ELSIF progress_val >= 80 THEN
      bonus_amt := 0;
      penalty_amt := 0;
    ELSE
      bonus_amt := 0;
      penalty_amt := 500000;
    END IF;
    
    IF month_num <= EXTRACT(MONTH FROM CURRENT_DATE) OR EXTRACT(YEAR FROM CURRENT_DATE) > 2025 THEN
      INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
      VALUES (
        record_id,
        1,
        4,
        NULL,
        'M' || month_num || '-2025',
        100,
        actual_val,
        progress_val,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN 'approved' ELSE 'in_progress' END,
        (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month')::DATE,
        (DATE '2025-01-01' + month_num * INTERVAL '1 month' - INTERVAL '1 day')::DATE,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '27 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '29 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN 1 ELSE NULL END,
        bonus_amt,
        penalty_amt,
        true
      );
      record_id := record_id + 1;
    END IF;
  END LOOP;
  
  -- Department 2 (Marketing) - KPI 3 (Monthly) - 2025
  FOR month_num IN 1..12 LOOP
    actual_val := 19 + (RANDOM() * 4)::INTEGER;
    progress_val := (actual_val / 20) * 100;
    
    IF progress_val >= 100 THEN
      bonus_amt := 600000;
      penalty_amt := 0;
    ELSIF progress_val >= 80 THEN
      bonus_amt := 0;
      penalty_amt := 0;
    ELSE
      bonus_amt := 0;
      penalty_amt := 300000;
    END IF;
    
    IF month_num <= EXTRACT(MONTH FROM CURRENT_DATE) OR EXTRACT(YEAR FROM CURRENT_DATE) > 2025 THEN
      INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
      VALUES (
        record_id,
        3,
        NULL,
        2,
        'M' || month_num || '-2025',
        20,
        actual_val,
        progress_val,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN 'approved' ELSE 'in_progress' END,
        (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month')::DATE,
        (DATE '2025-01-01' + month_num * INTERVAL '1 month' - INTERVAL '1 day')::DATE,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '27 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN (DATE '2025-01-01' + (month_num - 1) * INTERVAL '1 month' + INTERVAL '29 days')::TIMESTAMP WITH TIME ZONE ELSE NULL END,
        CASE WHEN month_num < EXTRACT(MONTH FROM CURRENT_DATE) THEN 1 ELSE NULL END,
        bonus_amt,
        penalty_amt,
        true
      );
      record_id := record_id + 1;
    END IF;
  END LOOP;
  
  -- Employee 5 - KPI 4 (Quarterly) - 2025
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 4, 5, NULL, 'Q1-2025', 10, 11, 110.00, 'approved', '2025-01-01', '2025-03-31', '2025-03-28', '2025-03-30', 1, 1200000, 0, true);
  record_id := record_id + 1;
  
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 4, 5, NULL, 'Q2-2025', 10, 9, 90.00, 'approved', '2025-04-01', '2025-06-30', '2025-06-28', '2025-06-30', 1, 0, 0, true);
  record_id := record_id + 1;
  
  -- Q3-2025 có thể đang in_progress
  INSERT INTO kpi_records (id, kpi_id, employee_id, department_id, period, target, actual, progress, status, start_date, end_date, submission_date, approval_date, approved_by, bonus_amount, penalty_amount, is_active)
  VALUES 
    (record_id, 4, 5, NULL, 'Q3-2025', 10, 5, 50.00, 'in_progress', '2025-07-01', '2025-09-30', NULL, NULL, NULL, 0, 0, true);
  record_id := record_id + 1;
  
END $$;

-- Cập nhật sequence
SELECT setval('kpi_records_id_seq', (SELECT MAX(id) FROM kpi_records), true);

-- =====================================================
-- VERIFY DATA
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Branch Hà Nội: %', (SELECT COUNT(*) FROM branches WHERE code = 'BRANCH001');
  RAISE NOTICE 'Departments in Hà Nội: %', (SELECT COUNT(*) FROM departments WHERE branch_id = 1);
  RAISE NOTICE 'Employees in Hà Nội: %', (SELECT COUNT(*) FROM employees e JOIN departments d ON e.department_id = d.id WHERE d.branch_id = 1);
  RAISE NOTICE 'KPIs in Hà Nội: %', (SELECT COUNT(*) FROM kpis k JOIN departments d ON k.department_id = d.id WHERE d.branch_id = 1);
  RAISE NOTICE 'KPI Records by Period:';
  RAISE NOTICE '  - Q1-2024: %', (SELECT COUNT(*) FROM kpi_records WHERE period = 'Q1-2024');
  RAISE NOTICE '  - Q2-2024: %', (SELECT COUNT(*) FROM kpi_records WHERE period = 'Q2-2024');
  RAISE NOTICE '  - Q3-2024: %', (SELECT COUNT(*) FROM kpi_records WHERE period = 'Q3-2024');
  RAISE NOTICE '  - Q4-2024: %', (SELECT COUNT(*) FROM kpi_records WHERE period = 'Q4-2024');
  RAISE NOTICE '  - Q1-2025: %', (SELECT COUNT(*) FROM kpi_records WHERE period = 'Q1-2025');
  RAISE NOTICE '  - Q2-2025: %', (SELECT COUNT(*) FROM kpi_records WHERE period = 'Q2-2025');
  RAISE NOTICE '  - Q3-2025: %', (SELECT COUNT(*) FROM kpi_records WHERE period = 'Q3-2025');
  RAISE NOTICE '  - Total Records: %', (SELECT COUNT(*) FROM kpi_records);
END $$;

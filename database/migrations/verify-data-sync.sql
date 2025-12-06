-- =====================================================
-- VERIFY DATA SYNCHRONIZATION AND CONSISTENCY
-- Chạy query này để kiểm tra tính nhất quán dữ liệu
-- =====================================================

-- 1. Kiểm tra KPI Records có progress hợp lệ
SELECT 
    'KPI Records với progress < 0' AS check_type,
    COUNT(*) AS count
FROM kpi_records
WHERE progress < 0 AND is_active = true
UNION ALL
SELECT 
    'KPI Records với actual < 0' AS check_type,
    COUNT(*) AS count
FROM kpi_records
WHERE actual < 0 AND is_active = true
UNION ALL
SELECT 
    'KPI Records với target <= 0' AS check_type,
    COUNT(*) AS count
FROM kpi_records
WHERE target <= 0 AND is_active = true
UNION ALL
SELECT 
    'KPI Records với start_date > end_date' AS check_type,
    COUNT(*) AS count
FROM kpi_records
WHERE start_date > end_date AND is_active = true;

-- 2. Kiểm tra KPI Records có employee_id và department_id cùng NULL
SELECT 
    'KPI Records không có assignment (cả employee_id và department_id đều NULL)' AS check_type,
    COUNT(*) AS count
FROM kpi_records
WHERE employee_id IS NULL AND department_id IS NULL AND is_active = true;

-- 3. Kiểm tra KPI Records có cả employee_id và department_id (vi phạm constraint)
SELECT 
    'KPI Records có cả employee_id và department_id (vi phạm constraint)' AS check_type,
    COUNT(*) AS count
FROM kpi_records
WHERE employee_id IS NOT NULL AND department_id IS NOT NULL AND is_active = true;

-- 4. Kiểm tra Foreign Key integrity
SELECT 
    'KPI Records với kpi_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM kpi_records kr
LEFT JOIN kpis k ON kr.kpi_id = k.id
WHERE k.id IS NULL AND kr.is_active = true
UNION ALL
SELECT 
    'KPI Records với employee_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM kpi_records kr
LEFT JOIN employees e ON kr.employee_id = e.id
WHERE kr.employee_id IS NOT NULL AND e.id IS NULL AND kr.is_active = true
UNION ALL
SELECT 
    'KPI Records với department_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM kpi_records kr
LEFT JOIN departments d ON kr.department_id = d.id
WHERE kr.department_id IS NOT NULL AND d.id IS NULL AND kr.is_active = true;

-- 5. Kiểm tra Bonus/Penalty Records
SELECT 
    'Bonus/Penalty Records với amount <= 0' AS check_type,
    COUNT(*) AS count
FROM bonus_penalty_records
WHERE amount <= 0 AND is_active = true
UNION ALL
SELECT 
    'Bonus/Penalty Records với employee_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM bonus_penalty_records bpr
LEFT JOIN employees e ON bpr.employee_id = e.id
WHERE e.id IS NULL AND bpr.is_active = true
UNION ALL
SELECT 
    'Bonus/Penalty Records với kpi_id không tồn tại (nếu có)' AS check_type,
    COUNT(*) AS count
FROM bonus_penalty_records bpr
LEFT JOIN kpis k ON bpr.kpi_id = k.id
WHERE bpr.kpi_id IS NOT NULL AND k.id IS NULL AND bpr.is_active = true;

-- 6. Kiểm tra KPI Submissions
SELECT 
    'KPI Submissions với employee_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM kpi_submissions ks
LEFT JOIN employees e ON ks.employee_id = e.id
WHERE e.id IS NULL AND ks.is_active = true
UNION ALL
SELECT 
    'KPI Submission Items với submission_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM kpi_submission_items ksi
LEFT JOIN kpi_submissions ks ON ksi.submission_id = ks.id
WHERE ks.id IS NULL AND ksi.is_active = true
UNION ALL
SELECT 
    'KPI Submission Items với kpi_record_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM kpi_submission_items ksi
LEFT JOIN kpi_records kr ON ksi.kpi_record_id = kr.id
WHERE kr.id IS NULL AND ksi.is_active = true;

-- 7. Kiểm tra Employees
SELECT 
    'Employees với role_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM employees e
LEFT JOIN roles r ON e.role_id = r.id
WHERE r.id IS NULL AND e.is_active = true
UNION ALL
SELECT 
    'Employees với department_id không tồn tại' AS check_type,
    COUNT(*) AS count
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE d.id IS NULL AND e.is_active = true;

-- 8. Kiểm tra Notifications
SELECT 
    'Notifications với user_id không tồn tại (nếu có)' AS check_type,
    COUNT(*) AS count
FROM notifications n
LEFT JOIN employees e ON n.user_id = e.id
WHERE n.user_id IS NOT NULL AND e.id IS NULL AND n.is_active = true;

-- 9. Tổng hợp kết quả
SELECT 
    '=== TỔNG HỢP KIỂM TRA ===' AS summary,
    'Tất cả các checks trên đều phải trả về 0' AS note;


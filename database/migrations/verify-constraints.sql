-- =====================================================
-- VERIFY CONSTRAINTS AFTER MIGRATION
-- Chạy query này để kiểm tra tất cả constraints đã được tạo thành công
-- =====================================================

-- Kiểm tra tất cả CHECK constraints
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname LIKE 'check_%' 
   OR conname LIKE 'unique_kpi_assignment%'
ORDER BY table_name, constraint_name;

-- Đếm số lượng constraints
SELECT 
    'Total CHECK constraints' AS type,
    COUNT(*) AS count
FROM pg_constraint
WHERE conname LIKE 'check_%'
UNION ALL
SELECT 
    'Total UNIQUE indexes' AS type,
    COUNT(*) AS count
FROM pg_indexes
WHERE indexname LIKE 'unique_kpi_assignment%';

-- Kiểm tra các constraints quan trọng nhất
SELECT 
    '✅ KPI Records Constraints' AS section,
    COUNT(*) AS count
FROM pg_constraint
WHERE conrelid = 'kpi_records'::regclass
  AND conname LIKE 'check_%'
UNION ALL
SELECT 
    '✅ Bonus/Penalty Constraints',
    COUNT(*)
FROM pg_constraint
WHERE conrelid = 'bonus_penalty_records'::regclass
  AND conname LIKE 'check_%'
UNION ALL
SELECT 
    '✅ KPIs Constraints',
    COUNT(*)
FROM pg_constraint
WHERE conrelid = 'kpis'::regclass
  AND conname LIKE 'check_%'
UNION ALL
SELECT 
    '✅ Employees Constraints',
    COUNT(*)
FROM pg_constraint
WHERE conrelid = 'employees'::regclass
  AND conname LIKE 'check_%'
UNION ALL
SELECT 
    '✅ Unique Indexes',
    COUNT(*)
FROM pg_indexes
WHERE indexname LIKE 'unique_kpi_assignment%';


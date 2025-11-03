# HƯỚNG DẪN CHẠY MIGRATION - DATA INTEGRITY CONSTRAINTS

## 📋 Tổng quan

Migration này thêm các constraints để đảm bảo tính toàn vẹn dữ liệu cho hệ thống KPI Management.

## ⚠️ QUAN TRỌNG

**Phải chạy migration này TRƯỚC khi deploy code mới!**

Migration sẽ thêm:
- CHECK constraints cho date ranges
- CHECK constraints cho số dương và ranges
- CHECK constraints cho enum values
- UNIQUE indexes để tránh duplicate KPI assignments

## 🔧 Cách chạy Migration

### ⚠️ QUAN TRỌNG: Phải chạy các file theo thứ tự!

### Bước 0: Kiểm tra dữ liệu (Tùy chọn)

Chạy `check-data-before-migration.sql` để xem có bao nhiêu records cần fix:
```sql
-- Copy nội dung từ check-data-before-migration.sql
-- Paste và chạy trong Supabase SQL Editor
```

### Bước 1: Fix dữ liệu hiện có

**Option 1: Chạy trong Supabase SQL Editor (Khuyến nghị)**

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy toàn bộ nội dung từ file `database/migrations/fix-existing-data-before-constraints.sql`
4. Paste vào SQL Editor
5. Click **Run** hoặc nhấn `Ctrl+Enter` / `Cmd+Enter`
6. Kiểm tra output để đảm bảo không còn dữ liệu không hợp lệ

### Bước 2: Thêm constraints

**Option 1: Chạy trong Supabase SQL Editor (Khuyến nghị)**

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy toàn bộ nội dung từ file `database/migrations/add-data-integrity-constraints.sql`
4. Paste vào SQL Editor
5. Click **Run** hoặc nhấn `Ctrl+Enter` / `Cmd+Enter`

### Option 2: Chạy bằng psql

```bash
# Bước 1: Fix dữ liệu
psql -U postgres -d your_database -f database/migrations/fix-existing-data-before-constraints.sql

# Bước 2: Thêm constraints
psql -U postgres -d your_database -f database/migrations/add-data-integrity-constraints.sql
```

### Option 3: Chạy bằng Supabase CLI

```bash
# Chạy từng file một
supabase db execute --file database/migrations/fix-existing-data-before-constraints.sql
supabase db execute --file database/migrations/add-data-integrity-constraints.sql
```

## ✅ Kiểm tra Migration

Sau khi chạy migration, có thể kiểm tra bằng cách chạy query sau:

```sql
-- Kiểm tra các constraints đã được thêm
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname LIKE 'check_%' 
   OR conname LIKE 'unique_kpi_assignment%'
ORDER BY table_name, constraint_name;
```

## 📊 Các Constraints Được Thêm

### 1. KPI_RECORDS
- ✅ `check_date_range`: start_date <= end_date
- ✅ `check_target_positive`: target > 0
- ✅ `check_progress_range`: progress >= 0 AND progress <= 100
- ✅ `check_actual_non_negative`: actual >= 0
- ✅ `check_bonus_amount_non_negative`: bonus_amount >= 0 (nếu không NULL)
- ✅ `check_penalty_amount_non_negative`: penalty_amount >= 0 (nếu không NULL)
- ✅ `check_score_range`: score >= 0 AND score <= 100 (nếu không NULL)
- ✅ `check_status_valid`: status phải là một trong các giá trị hợp lệ
- ✅ `unique_kpi_assignment_employee`: Tránh duplicate KPI cho cùng employee/period
- ✅ `unique_kpi_assignment_department`: Tránh duplicate KPI cho cùng department/period

### 2. BONUS_PENALTY_RECORDS
- ✅ `check_bonus_penalty_amount_positive`: amount > 0
- ✅ `check_bonus_penalty_type_valid`: type phải là 'bonus' hoặc 'penalty'

### 3. KPIS
- ✅ `check_kpi_target_positive`: target > 0
- ✅ `check_kpi_weight_positive`: weight > 0
- ✅ `check_kpi_frequency_valid`: frequency phải là một trong các giá trị hợp lệ
- ✅ `check_kpi_category_valid`: category phải là một trong các giá trị hợp lệ
- ✅ `check_kpi_status_valid`: status phải là một trong các giá trị hợp lệ

### 4. DAILY_KPI_PROGRESS
- ✅ `check_daily_progress_result_non_negative`: actual_result >= 0

### 5. EMPLOYEES
- ✅ `check_employee_status_valid`: status phải là một trong các giá trị hợp lệ
- ✅ `check_employee_level_range`: level >= 1 AND level <= 4
- ✅ `check_login_attempts_non_negative`: login_attempts >= 0

### 6. NOTIFICATIONS
- ✅ `check_notification_user_type_valid`: user_type phải là một trong các giá trị hợp lệ
- ✅ `check_notification_type_valid`: type phải là một trong các giá trị hợp lệ
- ✅ `check_notification_priority_valid`: priority phải là một trong các giá trị hợp lệ
- ✅ `check_notification_category_valid`: category phải là một trong các giá trị hợp lệ

### 7. ROLES
- ✅ `check_role_level_range`: level >= 1 AND level <= 4

## 🔄 Rollback (Nếu cần)

Nếu cần rollback migration, chạy script sau:

```sql
-- Xóa các constraints được thêm bởi migration
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname FROM pg_constraint 
        WHERE conname LIKE 'check_%' 
           OR conname LIKE 'unique_kpi_assignment%'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
            (SELECT conrelid::regclass::text FROM pg_constraint WHERE conname = constraint_name LIMIT 1),
            constraint_name);
    END LOOP;
END $$;

-- Xóa các indexes
DROP INDEX IF EXISTS unique_kpi_assignment_employee;
DROP INDEX IF EXISTS unique_kpi_assignment_department;
```

## ⚠️ Lưu ý

1. **Safe to run multiple times**: Migration sử dụng `DO $$ ... IF NOT EXISTS ...` để tránh duplicate constraints
2. **Existing data**: Nếu có dữ liệu không hợp lệ trong database, migration sẽ **FAIL**. Cần fix dữ liệu trước khi chạy migration
3. **Performance**: Các constraints có thể ảnh hưởng một chút đến performance INSERT/UPDATE, nhưng đảm bảo tính toàn vẹn dữ liệu

## 🐛 Troubleshooting

### Lỗi: "check constraint violation" khi chạy migration
- **Nguyên nhân:** Có dữ liệu không hợp lệ trong database
- **Giải pháp:** Chạy file `fix-existing-data-before-constraints.sql` TRƯỚC
- **Hoặc:** Chạy các queries sau để fix thủ công:
  ```sql
  -- Fix progress out of range
  UPDATE kpi_records SET progress = 0 WHERE progress < 0;
  UPDATE kpi_records SET progress = 100 WHERE progress > 100;
  
  -- Fix negative amounts
  UPDATE bonus_penalty_records SET amount = ABS(amount) WHERE amount < 0;
  
  -- Fix invalid dates
  UPDATE kpi_records SET end_date = start_date + INTERVAL '1 day' WHERE end_date < start_date;
  ```

### Lỗi: "constraint already exists"
- Migration đã được chạy trước đó
- Có thể bỏ qua hoặc kiểm tra xem constraints đã tồn tại chưa

### Lỗi: "check constraint violation" sau khi migration
- Có dữ liệu mới không hợp lệ được insert
- Kiểm tra code validation ở service layer
- Xem logs để tìm record nào vi phạm

### Lỗi: "duplicate key value"
- Có duplicate KPI assignments
- Cần xóa duplicates trước:
  ```sql
  -- Tìm và xóa duplicates
  DELETE FROM kpi_records a USING kpi_records b
  WHERE a.id < b.id 
    AND a.kpi_id = b.kpi_id 
    AND a.employee_id = b.employee_id 
    AND a.period = b.period
    AND a.is_active = true
    AND b.is_active = true;
  ```

## 📝 Sau khi Migration

Sau khi migration thành công:
1. ✅ Deploy code mới với validation ở service layer
2. ✅ Test các operations (CREATE, UPDATE) để đảm bảo validation hoạt động
3. ✅ Monitor logs để phát hiện lỗi validation sớm


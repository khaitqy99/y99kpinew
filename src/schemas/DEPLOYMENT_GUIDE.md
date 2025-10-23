# HƯỚNG DẪN TRIỂN KHAI SCHEMA MỚI

## Cách 1: Chạy từng file SQL riêng lẻ (Khuyến nghị)

### Bước 1: Mở SQL Editor
- Mở Supabase Dashboard
- Vào **SQL Editor**
- Hoặc sử dụng psql command line

### Bước 2: Chạy các file theo thứ tự dependency

```sql
-- 1. Chạy file đầu tiên
\i src/schemas/01-companies.sql

-- 2. Chạy file thứ hai
\i src/schemas/02-departments.sql

-- 3. Chạy file thứ ba
\i src/schemas/03-roles.sql

-- 4. Chạy file thứ tư
\i src/schemas/04-employees.sql

-- 5. Chạy file thứ năm
\i src/schemas/05-kpis.sql

-- 6. Chạy file thứ sáu
\i src/schemas/06-kpi-records.sql

-- 7. Chạy file thứ bảy
\i src/schemas/07-daily-kpi-progress.sql

-- 8. Chạy file thứ tám
\i src/schemas/08-notifications.sql

-- 9. Chạy file thứ chín
\i src/schemas/09-bonus-configs.sql

-- 10. Chạy file thứ mười
\i src/schemas/10-penalty-configs.sql

-- 11. Chạy file thứ mười một
\i src/schemas/11-feedback.sql

-- 12. Chạy file thứ mười hai
\i src/schemas/12-bonus-penalty-records.sql
```

## Cách 2: Chạy file migration tổng hợp

### Sử dụng file migration chính:
```sql
-- Chạy file migration tổng hợp
\i src/schemas/00-complete-migration.sql
```

## Cách 3: Copy-paste từng file vào SQL Editor

### Bước 1: Mở từng file SQL
- Mở file `01-companies.sql`
- Copy toàn bộ nội dung
- Paste vào SQL Editor
- Chạy (Execute)

### Bước 2: Lặp lại cho các file khác
- Làm tương tự cho các file còn lại theo thứ tự

## Cách 4: Sử dụng Supabase CLI (Nếu có)

```bash
# Nếu bạn có Supabase CLI
supabase db reset
supabase db push
```

## Lưu ý quan trọng:

### ⚠️ **Trước khi chạy:**
1. **Backup dữ liệu hiện tại** (nếu có)
2. **Kiểm tra môi trường** (development/staging/production)
3. **Đảm bảo không có conflict** với schema cũ

### ✅ **Sau khi chạy:**
1. **Kiểm tra các bảng đã được tạo**
2. **Kiểm tra các index đã được tạo**
3. **Kiểm tra các trigger đã được tạo**
4. **Kiểm tra các view đã được tạo**
5. **Kiểm tra các function đã được tạo**

### 🔍 **Kiểm tra kết quả:**

```sql
-- Kiểm tra các bảng đã được tạo
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Kiểm tra các index
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Kiểm tra các trigger
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Kiểm tra các view
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public';
```

## Thứ tự thực hiện khuyến nghị:

1. **Development environment trước**
2. **Test kỹ lưỡng**
3. **Staging environment**
4. **Production environment**

## Troubleshooting:

### Nếu gặp lỗi:
1. **Kiểm tra dependency** - Đảm bảo chạy đúng thứ tự
2. **Kiểm tra permissions** - Đảm bảo có quyền tạo bảng
3. **Kiểm tra conflicts** - Xóa schema cũ nếu cần
4. **Kiểm tra syntax** - Đảm bảo SQL syntax đúng

### Lệnh xóa schema cũ (nếu cần):
```sql
-- CẨN THẬN: Chỉ chạy khi muốn xóa hoàn toàn schema cũ
DROP TABLE IF EXISTS bonus_penalty_records CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS penalty_configs CASCADE;
DROP TABLE IF EXISTS bonus_configs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS daily_kpi_progress CASCADE;
DROP TABLE IF EXISTS kpi_records CASCADE;
DROP TABLE IF EXISTS kpis CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
```

## Kết quả mong đợi:

Sau khi chạy thành công, bạn sẽ có:
- ✅ 12 bảng mới
- ✅ Đầy đủ index tối ưu
- ✅ Trigger tự động
- ✅ View hữu ích
- ✅ Function hỗ trợ
- ✅ Constraint đảm bảo tính toàn vẹn
- ✅ Dữ liệu mẫu cơ bản

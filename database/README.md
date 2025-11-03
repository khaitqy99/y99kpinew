# Database Schema - KPI Management System

## 📋 Hướng dẫn sử dụng

### **1. Tạo Schema:**

Chạy file `schema.sql` trong Supabase SQL Editor hoặc PostgreSQL:

```sql
-- Copy toàn bộ nội dung từ database/schema.sql
-- Paste vào Supabase SQL Editor và Execute
```

**Hoặc sử dụng psql:**
```bash
psql -U postgres -d your_database -f database/schema.sql
```

### **2. Import Test Data:**

Sau khi tạo schema, chạy file `test-data.sql` để import dữ liệu mẫu:

```sql
-- Copy toàn bộ nội dung từ database/test-data.sql
-- Paste vào Supabase SQL Editor và Execute
```

**Hoặc sử dụng psql:**
```bash
psql -U postgres -d your_database -f database/test-data.sql
```

### **2b. Thêm Nhiều Dữ Liệu Test (Tùy chọn):**

Để test tốt hơn Realtime, chạy thêm `add-more-test-data.sql`:

```sql
-- Copy toàn bộ nội dung từ database/add-more-test-data.sql
-- Paste vào Supabase SQL Editor và Execute
```

**Hoặc sử dụng psql:**
```bash
psql -U postgres -d your_database -f database/add-more-test-data.sql
```

**✅ Lưu ý:**
- File này **có thể chạy độc lập** (tự động tạo roles và departments nếu chưa có)
- Không cần chạy `test-data.sql` trước (nhưng nên chạy để có đầy đủ dữ liệu)
- File này thêm:
  - 8 employees mới
  - 11 KPIs mới
  - 27 KPI records với các status khác nhau
  - 11 daily progress records
  - 13 bonus/penalty records
  - 16 notifications mới

### **3. Enable Realtime (Optional):**

Realtime đã được tự động enable trong `schema.sql`, nhưng nếu cần enable riêng:

```sql
-- Copy toàn bộ nội dung từ database/enable-realtime.sql
-- Paste vào Supabase SQL Editor và Execute
```

**Hoặc sử dụng psql:**
```bash
psql -U postgres -d your_database -f database/enable-realtime.sql
```

**✅ Safe to run nhiều lần:** File này có safe checks, có thể chạy lại mà không bị lỗi.

### **4. Verify:**

Chạy query sau để kiểm tra dữ liệu:

```sql
SELECT 'Departments' as table_name, COUNT(*) as count FROM departments
UNION ALL
SELECT 'Roles', COUNT(*) FROM roles
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
SELECT 'Notifications', COUNT(*) FROM notifications;
```

## 🔑 Key Features

### **BIGSERIAL IDs:**
- Tất cả PRIMARY KEY dùng `BIGSERIAL` (tự động tăng số nguyên)
- Tất cả FOREIGN KEY dùng `BIGINT` (number)
- Dễ đọc và quản lý: `id = 1, 2, 100, 5000` thay vì UUID

### **Auto-calculated Fields:**
- `kpi_records.progress`: Tự động tính = `(actual / target) * 100`
- `kpi_records.last_updated`: Tự động cập nhật khi có thay đổi
- `updated_at`: Tự động cập nhật cho tất cả bảng

### **Indexes:**
- Đã có indexes cho tất cả foreign keys
- Indexes cho các trường thường query: status, period, date, etc.

### **Constraints:**
- Foreign key constraints với ON DELETE CASCADE/SET NULL
- Check constraint: `kpi_records` phải có employee_id HOẶC department_id

### **Realtime Subscriptions:**
- Hỗ trợ real-time updates cho tất cả tables
- Tự động sync dữ liệu khi có INSERT, UPDATE, DELETE
- Giảm tải server bằng cách không cần polling
- Cập nhật UI ngay lập tức khi có thay đổi

## 📊 Test Data

### Sau khi chạy `test-data.sql`:
- **4 Departments**: Kinh doanh, Marketing, Nhân sự, IT
- **4 Roles**: Admin, Manager, Director, Employee
- **6 Employees**: 1 admin + 5 employees
- **4 KPIs**: Mẫu KPI cho các phòng ban
- **4 KPI Records**: 2 assigned cho employee, 2 cho department
- **3 Daily Progress**: Tiến độ hàng ngày mẫu
- **2 Bonus/Penalty Records**: Thưởng/phạt mẫu
- **5 Notifications**: Thông báo mẫu

### Sau khi chạy thêm `add-more-test-data.sql`:
- **Tổng cộng 14 Employees** (thêm 8 employees)
- **Tổng cộng 15 KPIs** (thêm 11 KPIs)
- **Tổng cộng 31 KPI Records** (thêm 27 records với đa dạng status)
- **Tổng cộng 14 Daily Progress** (thêm 11 records)
- **Tổng cộng 15 Bonus/Penalty** (thêm 13 records)
- **Tổng cộng 21 Notifications** (thêm 16 notifications)

## 🔐 Test Credentials

- **Admin mặc định (DB Admin)**: `db@y99.vn` / `Dby996868` ⭐
- **Admin**: `admin@y99.com` / `password123`
- **Employee**: `nguyenvana@y99.com` / `password123`

**Lưu ý:** 
- Tài khoản admin mặc định (`db@y99.vn`) có toàn quyền và được tạo tự động với password `Dby996868`
- Password hash trong test data khác chỉ là example, cần hash thật với bcrypt (hoặc sử dụng plain text nếu auth-service check plain text)

## ⚠️ Lưu ý

1. **Password Hash**: Test data có password hash example, cần thay bằng hash thật
2. **Sequence Reset**: Test data sử dụng fixed IDs (1, 2, 3...), cần reset sequence sau khi insert
3. **Clean Up**: Nếu cần test lại, uncomment phần DELETE ở đầu `test-data.sql`


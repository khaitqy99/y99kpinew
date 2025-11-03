# WORKFLOW HỆ THỐNG KPI MANAGEMENT - THAO TÁC CRUD TỪ UI

## 📋 MỤC LỤC
1. [Tổng quan CRUD Operations](#tổng-quan-crud-operations)
2. [Chi tiết CRUD từ UI](#chi-tiết-crud-từ-ui)
3. [Thông báo tự động (System)](#system-thông-báo-tự-động-background-process)
4. [Dữ liệu được lưu trữ](#dữ-liệu-được-lưu-trữ)

---

## TỔNG QUAN CRUD OPERATIONS

### **Admin CRUD Operations:**

| Trang | Bảng | CREATE | READ | UPDATE | DELETE |
|-------|------|--------|------|--------|--------|
| `/admin/kpis` | `kpis` | ✅ addKpi | ✅ List | ✅ editKpi | ✅ deleteKpi |
| `/admin/assign` | `kpi_records` | ✅ assignKpi | ✅ List | ❌ | ❌ |
| `/admin/approval` | `kpi_records` | ❌ | ✅ List pending | ✅ updateKpiRecordStatus | ❌ |
| `/admin/bonus-calculation` | `bonus_penalty_records` | ✅ createRecord | ✅ List | ❌ | ✅ deleteRecord |
| `/admin/daily-kpi-progress` | `daily_kpi_progress` | ✅ addDailyKpiProgress | ✅ List | ✅ editDailyKpiProgress | ✅ deleteDailyKpiProgress |

### **Employee CRUD Operations:**

| Trang | Bảng | CREATE | READ | UPDATE | DELETE |
|-------|------|--------|------|--------|--------|
| `/employee/dashboard` | `kpi_records` | ❌ | ✅ List own KPIs | ✅ submitKpiRecord | ❌ |
| `/employee/account` | `employees` | ❌ | ✅ View profile | ✅ changePassword | ❌ |

---

## CHI TIẾT CRUD TỪ UI

---

### 🔵 ADMIN: QUẢN LÝ KPI (`/admin/kpis`)

#### **CREATE - Tạo KPI mới:**

**Bước:**
1. Click "Tạo KPI mới"
2. Nhập form:
   - Tên KPI (name)
   - Mô tả (description)
   - Phòng ban (department_id)
   - Mục tiêu (target)
   - Đơn vị (unit)
   - Tần suất (frequency)
   - Danh mục (category)
   - Trọng số (weight)
   - Trạng thái (status)
   - Cấu hình thưởng/phạt (reward_penalty_config)
3. Click "Lưu"

**Dữ liệu lưu vào `kpis`:**
```json
{
  "name": "Số lượng khách hàng mới",
  "description": "Tổng số khách hàng mới trong tháng",
  "department_id": 5,
  "target": 100,
  "unit": "khách hàng",
  "frequency": "monthly",
  "category": "performance",
  "weight": 1,
  "status": "active",
  "reward_penalty_config": {
    "bonus_amount": 1000000,
    "penalty_amount": 500000
  },
  "created_by": 10,
  "is_active": true
}
```

#### **READ - Xem danh sách KPI:**

- Hiển thị tất cả KPI từ bảng `kpis`
- Có thể filter, search

#### **UPDATE - Sửa KPI:**

**Bước:**
1. Click vào KPI cần sửa
2. Chỉnh sửa form
3. Click "Lưu"

**Dữ liệu update vào `kpis`:**
- Các trường đã chỉnh sửa
- `updated_at` tự động cập nhật

#### **DELETE - Xóa KPI:**

**Bước:**
1. Click vào KPI cần xóa
2. Click "Xóa"
3. Confirm

**Hành động:**
- Xóa record từ bảng `kpis` (hoặc soft delete với `is_active = false`)

---

### 🟢 ADMIN: GIAO KPI (`/admin/assign`)

#### **CREATE - Giao KPI cho Employee/Department:**

**Bước:**
1. Chọn loại giao: Employee hoặc Department
2. Chọn Employee hoặc Department từ dropdown
3. Chọn KPI từ dropdown
4. Chọn kỳ (period): Q1-2025, M1-2025, etc.
5. Chọn thời gian: start_date, end_date
6. Click "Giao KPI"

**Dữ liệu lưu vào `kpi_records`:**
```json
{
  "kpi_id": 12,
  "employee_id": 45,  // hoặc null nếu giao cho department
  "department_id": null,  // hoặc department_id nếu giao cho department
  "period": "Q1-2025",
  "target": 100,
  "actual": 0,
  "progress": 0,
  "status": "not_started",
  "start_date": "2025-01-01",
  "end_date": "2025-03-31",
  "submission_details": "",
  "attachment": null,
  "is_active": true
}
```

**Sau khi tạo:**
- Tạo notification cho employee/department (tự động)

#### **READ - Xem danh sách KPI đã giao:**

- Hiển thị tất cả KPI records từ bảng `kpi_records`
- Hiển thị thông tin employee, department, KPI name, progress

---

### 🟡 EMPLOYEE: NỘP BÁO CÁO KPI (`/employee/dashboard`)

#### **READ - Xem danh sách KPI của mình:**

- Filter `kpi_records` where `employee_id` = current_user.id
- Hiển thị status, progress, deadline

#### **UPDATE - Nộp báo cáo KPI:**

**Bước:**
1. Click vào KPI cần nộp
2. Click "Nộp"
3. Nhập số liệu thực tế (`actual`)
4. Nhập chi tiết báo cáo (`submission_details`)
5. Upload file (optional) - Upload lên Google Drive
6. Click "Nộp báo cáo"

**Dữ liệu update vào `kpi_records`:**
```json
{
  "actual": 85,                    // ← UPDATED
  "progress": 85,                  // ← UPDATED (tự động tính: actual / target * 100)
  "status": "pending_approval",     // ← UPDATED
  "submission_date": "2025-03-25T14:30:00Z",  // ← UPDATED
  "submission_details": "Đã hoàn thành 85 khách hàng mới...",
  "attachment": "https://drive.google.com/file/d/xxx,https://drive.google.com/file/d/yyy"
}
```

**Sau khi nộp:**
- Tạo 2 notifications:
  - Cho Admin: thông báo có KPI chờ duyệt
  - Cho Employee: xác nhận đã nộp thành công

---

### 🟠 ADMIN: DUYỆT/TỪ CHỐI KPI (`/admin/approval`)

#### **READ - Xem danh sách KPI chờ duyệt:**

- Filter `kpi_records` where `status` = 'pending_approval'
- Hiển thị employee, KPI name, actual, target, progress

#### **UPDATE - Duyệt KPI (Approve):**

**Bước:**
1. Click vào KPI cần duyệt
2. Xem chi tiết submission
3. Nhập phản hồi (optional)
4. Click "Duyệt"

**Dữ liệu update vào `kpi_records`:**
```json
{
  "status": "completed",           // ← UPDATED (hoặc "approved")
  "approval_date": "2025-03-26T09:00:00Z",  // ← UPDATED
  "approved_by": 10,                // ← UPDATED (admin employee_id)
  "score": 85,                      // ← UPDATED (optional)
  "bonus_amount": 500000,           // ← UPDATED (tự động tính từ config)
  "penalty_amount": null
}
```

**Sau khi approve:**
- Tạo notification cho employee
- Tự động tính bonus/penalty (nếu có)
- Tạo notification bonus/penalty (nếu có)

#### **UPDATE - Từ chối KPI (Reject):**

**Bước:**
1. Click vào KPI cần từ chối
2. Nhập lý do từ chối (bắt buộc)
3. Click "Từ chối"

**Dữ liệu update vào `kpi_records`:**
```json
{
  "status": "in_progress",         // ← UPDATED (hoặc "rejected")
  "approval_date": "2025-03-26T09:00:00Z",
  "approved_by": 10
}
```

**Sau khi reject:**
- Tạo notification cho employee với lý do từ chối

---

### 🟣 ADMIN: NHẬP TIẾN ĐỘ HÀNG NGÀY (`/admin/daily-kpi-progress`)

#### **CREATE - Thêm tiến độ hàng ngày:**

**Bước:**
1. Click "Bắt đầu nhập"
2. Nhập form:
   - Ngày (date)
   - Bộ phận (department)
   - Người chịu trách nhiệm (responsible_person)
   - KPI (kpi_name)
   - Kết quả thực tế (actual_result)
   - Ghi chú (notes) - optional
3. Click "Lưu"

**Dữ liệu lưu vào `daily_kpi_progress`:**
```json
{
  "date": "2025-01-15",
  "department_id": 5,
  "department_name": "Phòng Kinh doanh",
  "employee_id": 45,
  "responsible_person": "Nguyễn Văn A",
  "kpi_id": 12,
  "kpi_name": "Số lượng khách hàng mới",
  "actual_result": 5,
  "notes": "Hoàn thành tốt trong ngày",
  "created_by": 10,
  "is_active": true
}
```

#### **READ - Xem danh sách tiến độ:**

- Hiển thị tất cả records từ `daily_kpi_progress`
- Có thể filter theo department, search

#### **UPDATE - Sửa tiến độ:**

- Click vào record cần sửa
- Chỉnh sửa và lưu

**Dữ liệu update vào `daily_kpi_progress`:**
- Các trường đã chỉnh sửa
- `updated_at` tự động cập nhật

#### **DELETE - Xóa tiến độ:**

- Click vào record cần xóa
- Confirm và xóa

---

### 🔴 ADMIN: QUẢN LÝ THƯỞNG/PHẠT (`/admin/bonus-calculation`)

#### **CREATE - Thêm thưởng/phạt:**

**Bước:**
1. Click "Thêm thưởng/phạt"
2. Nhập form:
   - Chọn nhân viên
   - Chọn KPI (optional)
   - Chọn loại: Thưởng hoặc Phạt
   - Nhập số tiền (amount)
   - Nhập lý do (reason)
   - Chọn thời kỳ (period)
3. Click "Lưu"

**Dữ liệu lưu vào `bonus_penalty_records`:**
```json
{
  "employee_id": 45,
  "kpi_id": 12,  // hoặc null nếu không liên quan KPI
  "type": "bonus",  // hoặc "penalty"
  "amount": 1000000,
  "reason": "Hoàn thành vượt mục tiêu KPI Q1-2025",
  "period": "Q1-2025",
  "created_by": 10,
  "is_active": true
}
```

**Sau khi tạo:**
- Tạo notification cho employee

#### **READ - Xem danh sách thưởng/phạt:**

- Hiển thị tất cả records từ `bonus_penalty_records`
- Filter theo period
- Hiển thị summary: total bonus, total penalty, net amount

#### **DELETE - Xóa thưởng/phạt:**

- Click vào record cần xóa
- Confirm và xóa

**Sau khi tạo:**
- Tạo notification cho employee về thưởng/phạt mới

---

### 🟢 SYSTEM: THÔNG BÁO TỰ ĐỘNG (Background Process)

#### **Các loại thông báo tự động:**

Hệ thống tự động tạo notifications cho các sự kiện sau:

##### **1. Deadline Reminder (Nhắc nhở hạn nộp):**

- **Khi nào:** Chạy scheduler mỗi 30 phút
- **Điều kiện:** Kiểm tra `kpi_records` có `end_date` <= 3 ngày và `status` != 'completed'
- **Hành động:** Tạo notification cho employee

**Dữ liệu notification:**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "reminder",
  "priority": "medium",
  "category": "kpi",
  "title": "Nhắc nhở hạn nộp KPI",
  "message": "KPI \"Số lượng khách hàng mới\" của bạn sắp hết hạn vào 2025-03-31. Còn 3 ngày nữa.",
  "read": false
}
```

##### **2. Overdue Notification (Thông báo quá hạn):**

- **Khi nào:** Khi `end_date` < today và `status` != 'approved' và `status` != 'completed'
- **Hành động:** 
  - Update `status` = 'overdue' trong `kpi_records`
  - Tạo notification cho employee

**Dữ liệu update vào `kpi_records`:**
```json
{
  "status": "overdue"  // ← UPDATED
}
```

**Dữ liệu notification:**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "deadline",
  "priority": "high",
  "category": "kpi",
  "title": "KPI đã quá hạn",
  "message": "KPI \"Số lượng khách hàng mới\" của bạn đã quá hạn. Vui lòng nộp báo cáo sớm nhất có thể.",
  "read": false
}
```

##### **3. System Notifications (Thông báo hệ thống):**

- **Chào mừng user mới:**
  - Khi employee mới được tạo
  - Tạo notification welcome

**Dữ liệu notification:**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "system",
  "priority": "low",
  "category": "system",
  "title": "Chào mừng bạn",
  "message": "Chào mừng bạn đến với hệ thống KPI Management!",
  "read": false
}
```

- **Thông báo hệ thống bảo trì:**
  - Admin có thể tạo thông báo system cho tất cả users

**Dữ liệu notification:**
```json
{
  "user_id": null,
  "user_type": "all",
  "type": "system",
  "priority": "medium",
  "category": "system",
  "title": "Thông báo bảo trì hệ thống",
  "message": "Hệ thống sẽ bảo trì từ 22:00 đến 02:00 ngày mai.",
  "read": false
}
```

##### **4. Notification tự động từ các CRUD operations:**

###### **A. Khi giao KPI (từ `/admin/assign`):**
- Tự động tạo notification cho employee/department được giao

**Dữ liệu notification:**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "assigned",
  "priority": "medium",
  "category": "kpi",
  "title": "KPI mới được giao",
  "message": "Bạn đã được giao KPI \"Số lượng khách hàng mới\" với mục tiêu 100 khách hàng trong kỳ Q1-2025",
  "read": false
}
```

###### **B. Khi employee nộp báo cáo (từ `/employee/dashboard`):**
- Tự động tạo 2 notifications:
  - Cho Admin: thông báo có KPI chờ duyệt
  - Cho Employee: xác nhận đã nộp thành công

**Notification cho Admin:**
```json
{
  "user_id": 10,
  "user_type": "admin",
  "type": "submitted",
  "priority": "medium",
  "category": "kpi",
  "title": "KPI đã được submit",
  "message": "Nguyễn Văn A đã submit KPI \"Số lượng khách hàng mới\" với kết quả 85 khách hàng",
  "read": false
}
```

**Notification cho Employee:**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "submitted",
  "priority": "low",
  "category": "kpi",
  "title": "KPI đã được submit thành công",
  "message": "Bạn đã submit KPI \"Số lượng khách hàng mới\" thành công. Đang chờ phê duyệt từ quản lý.",
  "read": false
}
```

###### **C. Khi admin duyệt KPI (từ `/admin/approval` - Approve):**
- Tự động tạo notification cho employee
- Nếu có bonus/penalty, tạo thêm notification bonus/penalty

**Notification approved:**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "approved",
  "priority": "medium",
  "category": "kpi",
  "title": "KPI đã được phê duyệt",
  "message": "KPI \"Số lượng khách hàng mới\" của bạn đã được Quản lý phê duyệt với điểm số 85",
  "read": false
}
```

**Notification bonus/penalty (nếu có):**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "reward",
  "priority": "medium",
  "category": "bonus",
  "title": "Thưởng KPI",
  "message": "Chúc mừng! Bạn đã nhận được thưởng 500,000 VNĐ cho KPI \"Số lượng khách hàng mới\"",
  "read": false
}
```

###### **D. Khi admin từ chối KPI (từ `/admin/approval` - Reject):**
- Tự động tạo notification cho employee với lý do từ chối

**Dữ liệu notification:**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "rejected",
  "priority": "high",
  "category": "kpi",
  "title": "KPI đã bị từ chối",
  "message": "KPI \"Số lượng khách hàng mới\" của bạn đã bị Quản lý từ chối. Vui lòng xem phản hồi và chỉnh sửa.",
  "read": false
}
```

###### **E. Khi admin tạo thưởng/phạt (từ `/admin/bonus-calculation`):**
- Tự động tạo notification cho employee

**Dữ liệu notification:**
```json
{
  "user_id": 45,
  "user_type": "employee",
  "type": "reward",  // hoặc "penalty"
  "priority": "medium",
  "category": "bonus",  // hoặc "penalty"
  "title": "Thưởng mới",  // hoặc "Phạt mới"
  "message": "Bạn đã nhận được thưởng 1,000,000 VNĐ cho Hoàn thành vượt mục tiêu KPI Q1-2025",
  "read": false
}
```

**Lưu ý:**
- Tất cả notifications đều lưu vào bảng `notifications`
- Không có UI để tạo notification trực tiếp (chỉ tự động)
- User có thể đọc (mark as read) notifications từ UI
- Admin có thể tạo system notification cho tất cả users

---

## DỮ LIỆU ĐƯỢC LƯU TRỮ

### **Các bảng chính:**

| Bảng | Mục đích | CRUD từ UI |
|------|----------|------------|
| `kpis` | Lưu KPI template | ✅ CREATE, ✅ READ, ✅ UPDATE, ✅ DELETE |
| `kpi_records` | Lưu KPI được giao, submission, approval | ✅ CREATE (assign), ✅ READ, ✅ UPDATE (submit, approve), ❌ DELETE |
| `daily_kpi_progress` | Lưu tiến độ hàng ngày | ✅ CREATE, ✅ READ, ✅ UPDATE, ✅ DELETE |
| `bonus_penalty_records` | Lưu thưởng/phạt | ✅ CREATE, ✅ READ, ❌ UPDATE, ✅ DELETE |
| `notifications` | Lưu thông báo | ❌ CREATE từ UI (tự động), ✅ READ, ✅ UPDATE (mark read) |

### **Các trường quan trọng:**

- **ID**: Tất cả dùng `BIGSERIAL` (integer) để dễ đọc và quản lý
- **Status**: KPI status: `not_started`, `in_progress`, `pending_approval`, `completed`, `approved`, `rejected`, `overdue`
- **Progress**: Tự động tính: `(actual / target) * 100`
- **Notification types**: `assigned`, `submitted`, `approved`, `rejected`, `reminder`, `reward`, `penalty`, `deadline`, `system`

### **Lưu ý:**

1. **Notifications** được tạo tự động từ các CRUD operations và system scheduler, không có UI để tạo trực tiếp
2. **System notifications** được tạo bởi background scheduler (deadline reminders, overdue notifications)
3. **Daily KPI Progress** độc lập với `kpi_records`, dùng để tracking chi tiết
4. Không có UI để **UPDATE** `bonus_penalty_records` (chỉ có CREATE và DELETE)
5. Không có UI để **DELETE** `kpi_records` (chỉ có CREATE và UPDATE)

---

## TÓM TẮT

**Admin có thể:**
- ✅ Quản lý KPI (CRUD)
- ✅ Giao KPI cho employee/department (CREATE)
- ✅ Duyệt/từ chối KPI submission (UPDATE)
- ✅ Nhập tiến độ hàng ngày (CRUD)
- ✅ Quản lý thưởng/phạt (CREATE, READ, DELETE)

**Employee có thể:**
- ✅ Xem danh sách KPI của mình (READ)
- ✅ Nộp báo cáo KPI (UPDATE)
- ✅ Đổi mật khẩu (UPDATE)

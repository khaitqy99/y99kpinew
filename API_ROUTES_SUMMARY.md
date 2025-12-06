# Tổng hợp API Routes - KPI Management System

## 📋 Danh sách đầy đủ các API Routes

### ✅ 1. Employees (`/api/employees`)
- `GET /api/employees` - Lấy danh sách nhân viên
- `POST /api/employees` - Tạo nhân viên mới
- `GET /api/employees/[id]` - Lấy nhân viên theo ID
- `PUT /api/employees/[id]` - Cập nhật nhân viên
- `DELETE /api/employees/[id]` - Xóa nhân viên (soft delete)

**Sử dụng trong:**
- `/settings` (UsersDepartmentsTab)
- `/admin/dashboard` (hiển thị thống kê)

---

### ✅ 2. Departments (`/api/departments`)
- `GET /api/departments` - Lấy danh sách phòng ban
- `POST /api/departments` - Tạo phòng ban mới
- `GET /api/departments/[id]` - Lấy phòng ban theo ID
- `PUT /api/departments/[id]` - Cập nhật phòng ban
- `DELETE /api/departments/[id]` - Xóa phòng ban

**Sử dụng trong:**
- `/settings` (UsersDepartmentsTab)
- `/admin/kpis` (filter theo department)
- `/admin/assign` (assign KPI cho department)

---

### ✅ 3. Branches (`/api/branches`)
- `GET /api/branches` - Lấy danh sách chi nhánh
- `POST /api/branches` - Tạo chi nhánh mới
- `GET /api/branches/[id]` - Lấy chi nhánh theo ID
- `PUT /api/branches/[id]` - Cập nhật chi nhánh
- `DELETE /api/branches/[id]` - Xóa chi nhánh

**Sử dụng trong:**
- `/admin/branches` (quản lý chi nhánh)
- Session context (chọn branch)

---

### ✅ 4. Roles (`/api/roles`)
- `GET /api/roles` - Lấy danh sách vai trò
- `POST /api/roles` - Tạo vai trò mới
- `GET /api/roles/[id]` - Lấy vai trò theo ID
- `PUT /api/roles/[id]` - Cập nhật vai trò
- `DELETE /api/roles/[id]` - Xóa vai trò

**Sử dụng trong:**
- `/settings` (UsersDepartmentsTab - tạo user với role)

---

### ✅ 5. KPIs (`/api/kpis`)
- `GET /api/kpis` - Lấy danh sách KPI
- `POST /api/kpis` - Tạo KPI mới
- `GET /api/kpis/[id]` - Lấy KPI theo ID
- `PUT /api/kpis/[id]` - Cập nhật KPI
- `DELETE /api/kpis/[id]` - Xóa KPI

**Sử dụng trong:**
- `/admin/kpis` (quản lý KPI)
- `/admin/assign` (chọn KPI để assign)
- `/admin/daily-kpi-progress` (chọn KPI)

---

### ✅ 6. KPI Records (`/api/kpi-records`)
- `GET /api/kpi-records?employeeId=X` - Lấy KPI records (có thể filter theo employee)
- `POST /api/kpi-records` - Tạo KPI record mới (assign KPI)
- `GET /api/kpi-records/[id]` - Lấy KPI record theo ID
- `PUT /api/kpi-records/[id]` - Cập nhật KPI record
- `DELETE /api/kpi-records/[id]` - Xóa KPI record
- `PUT /api/kpi-records/[id]/submit` - Submit KPI record để duyệt
- `PUT /api/kpi-records/[id]/update-actual` - Cập nhật giá trị actual
- `PUT /api/kpi-records/[id]/status` - Cập nhật status (approve/reject)

**Sử dụng trong:**
- `/admin/assign` (assign KPI cho employee/department)
- `/admin/approval` (duyệt KPI - dùng status endpoint)
- `/employee/dashboard` (xem và submit KPI)
- `/employee/kpis` (xem và submit KPI)

---

### ✅ 7. Daily KPI Progress (`/api/daily-kpi-progress`)
- `GET /api/daily-kpi-progress?startDate=X&endDate=Y&departmentId=Z&employeeId=W` - Lấy tiến độ (có filter)
- `POST /api/daily-kpi-progress` - Tạo tiến độ mới
- `GET /api/daily-kpi-progress/[id]` - Lấy tiến độ theo ID
- `PUT /api/daily-kpi-progress/[id]` - Cập nhật tiến độ
- `DELETE /api/daily-kpi-progress/[id]` - Xóa tiến độ

**Sử dụng trong:**
- `/admin/daily-kpi-progress` (quản lý tiến độ hàng ngày)

---

### ✅ 8. Notifications (`/api/notifications`)
- `GET /api/notifications?userId=X` - Lấy thông báo (có thể filter theo user)
- `POST /api/notifications` - Tạo thông báo mới
- `GET /api/notifications/[id]` - Lấy thông báo theo ID
- `PUT /api/notifications/[id]` - Cập nhật thông báo
- `DELETE /api/notifications/[id]` - Xóa thông báo
- `PUT /api/notifications/[id]/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all?userId=X` - Đánh dấu tất cả đã đọc

**Sử dụng trong:**
- Notification panel (hiển thị thông báo)
- Tự động tạo khi có events (assign, submit, approve, etc.)

---

### ✅ 9. KPI Submissions (`/api/kpi-submissions`)
- `GET /api/kpi-submissions?employeeId=X` - Lấy submissions (có thể filter theo employee)
- `POST /api/kpi-submissions` - Tạo submission mới (submit nhiều KPI cùng lúc)
- `GET /api/kpi-submissions/[id]` - Lấy submission theo ID
- `PUT /api/kpi-submissions/[id]` - Cập nhật submission
- `DELETE /api/kpi-submissions/[id]` - Xóa submission
- `PUT /api/kpi-submissions/[id]/approve` - Duyệt submission
- `PUT /api/kpi-submissions/[id]/reject` - Từ chối submission

**Sử dụng trong:**
- `/employee/kpis` (submit nhiều KPI cùng lúc)
- `/admin/approval` (có thể dùng để duyệt batch submissions)

---

### ✅ 10. Bonus/Penalty Records (`/api/bonus-penalty`)
- `GET /api/bonus-penalty?period=X&employeeId=Y` - Lấy records (có filter)
- `POST /api/bonus-penalty` - Tạo record mới
- `PUT /api/bonus-penalty/[id]` - Cập nhật record
- `DELETE /api/bonus-penalty/[id]` - Xóa record
- `GET /api/bonus-penalty/summary?period=X` - Lấy tổng hợp
- `GET /api/bonus-penalty/periods` - Lấy danh sách periods

**Sử dụng trong:**
- `/admin/bonus-calculation` (quản lý thưởng/phạt)
- `/employee/kpi-bonus-penalty` (xem thưởng/phạt của mình)
- `/employee/dashboard` (hiển thị summary)

---

### ✅ 11. Auth (`/api/auth`)
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/change-password` - Đổi mật khẩu

**Sử dụng trong:**
- `/login` (đăng nhập)
- `/employee/account` (đổi mật khẩu)
- Session management

---

## 📊 Mapping với các Tab/Trang

### Admin Pages:
| Trang | API Routes sử dụng |
|-------|-------------------|
| `/admin/dashboard` | GET employees, GET kpis, GET kpi-records |
| `/admin/kpis` | GET/POST/PUT/DELETE kpis |
| `/admin/assign` | POST kpi-records, GET kpis, GET employees, GET departments |
| `/admin/approval` | GET kpi-records, PUT kpi-records/[id]/status |
| `/admin/bonus-calculation` | GET/POST/DELETE bonus-penalty, GET bonus-penalty/summary, GET bonus-penalty/periods |
| `/admin/daily-kpi-progress` | GET/POST/PUT/DELETE daily-kpi-progress |
| `/admin/branches` | GET/POST/PUT/DELETE branches |

### Employee Pages:
| Trang | API Routes sử dụng |
|-------|-------------------|
| `/employee/dashboard` | GET kpi-records?employeeId=X, PUT kpi-records/[id]/submit |
| `/employee/kpis` | GET kpi-records?employeeId=X, PUT kpi-records/[id]/submit, PUT kpi-records/[id]/update-actual, POST kpi-submissions |
| `/employee/kpi-bonus-penalty` | GET bonus-penalty?employeeId=X |
| `/employee/account` | PUT auth/change-password |

### Settings:
| Trang | API Routes sử dụng |
|-------|-------------------|
| `/settings` | GET/POST/PUT/DELETE employees, GET/POST/PUT/DELETE departments, GET roles, GET branches |

---

## ✅ Kết luận

**Tất cả các tab/trang đã có API routes tương ứng!**

- ✅ 11 nhóm API routes chính
- ✅ 50+ endpoints
- ✅ Đầy đủ CRUD operations
- ✅ Có các endpoints đặc biệt cho các operations phức tạp
- ✅ Hỗ trợ filtering và query parameters
- ✅ Error handling đầy đủ
- ✅ Response format nhất quán

Tất cả các operations trong các trang đều có thể được thực hiện thông qua API routes!





# HỆ THỐNG QUẢN LÝ KPI - SCHEMA THIẾT KẾ MỚI

## Tổng quan

Hệ thống quản lý KPI được thiết kế lại hoàn toàn với schema database có cấu trúc rõ ràng, không thừa trường và hỗ trợ đầy đủ các chức năng cho cả Admin và Nhân viên.

## Cấu trúc Schema

### 1. **Companies** (`01-companies.sql`)
**Mục đích**: Quản lý thông tin công ty
- `id`: UUID chính
- `name`, `code`: Tên và mã công ty (unique)
- `description`, `email`, `phone`, `address`: Thông tin liên hệ
- `logo_url`, `website`: Thông tin branding
- `tax_code`, `business_license`: Thông tin pháp lý
- `founded_date`: Ngày thành lập
- `is_active`: Trạng thái hoạt động

**Đặc điểm**:
- Hỗ trợ multi-tenant (nhiều công ty)
- Có đầy đủ thông tin pháp lý
- Soft delete với `is_active`

### 2. **Departments** (`02-departments.sql`)
**Mục đích**: Quản lý phòng ban với cấu trúc phân cấp
- `id`: UUID chính
- `company_id`: Liên kết với công ty
- `name`, `code`: Tên và mã phòng ban
- `manager_id`: Trưởng phòng ban
- `parent_department_id`: Phòng ban cha (cấu trúc phân cấp)
- `level`: Cấp độ trong tổ chức
- `budget`, `cost_center`: Thông tin tài chính
- `location`, `phone`, `email`: Thông tin liên hệ

**Đặc điểm**:
- Hỗ trợ cấu trúc phân cấp phòng ban
- Quản lý ngân sách và trung tâm chi phí
- Constraint đảm bảo mã phòng ban unique trong công ty

### 3. **Roles** (`03-roles.sql`)
**Mục đích**: Quản lý vai trò và quyền hạn
- `id`: UUID chính
- `company_id`: Liên kết với công ty
- `name`, `code`: Tên và mã vai trò
- `level`: Cấp độ vai trò (1-10)
- `permissions`: Danh sách quyền hạn (JSON array)
- `is_system_role`: Có phải vai trò hệ thống không

**Đặc điểm**:
- Hệ thống phân quyền linh hoạt với JSON permissions
- Cấp độ vai trò từ 1-10
- Vai trò hệ thống và vai trò tùy chỉnh
- Tự động tạo các vai trò mặc định

### 4. **Employees** (`04-employees.sql`)
**Mục đích**: Quản lý thông tin nhân viên
- `id`: UUID chính
- `company_id`: Liên kết với công ty
- `employee_code`: Mã nhân viên (unique trong công ty)
- `name`, `email`: Thông tin cơ bản
- `role_id`, `department_id`: Liên kết với vai trò và phòng ban
- `manager_id`: Quản lý trực tiếp
- `position`, `level`: Vị trí và cấp độ
- `salary`, `currency`: Thông tin lương
- `hire_date`, `contract_type`: Thông tin hợp đồng
- `status`: Trạng thái nhân viên
- `password_hash`: Bảo mật đăng nhập
- `last_login`, `login_attempts`, `locked_until`: Bảo mật tài khoản

**Đặc điểm**:
- Hệ thống bảo mật đầy đủ với khóa tài khoản
- Quản lý hợp đồng và trạng thái nhân viên
- Constraint đảm bảo mã nhân viên unique trong công ty
- Soft delete với `is_active`

### 5. **KPIs** (`05-kpis.sql`)
**Mục đích**: Quản lý các chỉ số KPI
- `id`: UUID chính
- `company_id`: Liên kết với công ty
- `name`, `description`: Tên và mô tả KPI
- `department_id`: Phòng ban chịu trách nhiệm
- `target`: Mục tiêu KPI
- `unit`: Đơn vị đo lường
- `frequency`: Tần suất đánh giá (daily, weekly, monthly, quarterly, yearly)
- `category`: Danh mục KPI (performance, quality, efficiency, compliance, growth, financial, customer, innovation)
- `weight`: Trọng số KPI (%)
- `status`: Trạng thái KPI
- `reward_penalty_config`: Cấu hình thưởng phạt (JSON)
- `created_by`: Người tạo KPI

**Đặc điểm**:
- Hỗ trợ nhiều tần suất đánh giá
- Danh mục KPI đa dạng
- Cấu hình thưởng phạt linh hoạt với JSON
- Trọng số để tính điểm tổng hợp

### 6. **KPI Records** (`06-kpi-records.sql`)
**Mục đích**: Quản lý bản ghi thực hiện KPI
- `id`: UUID chính
- `kpi_id`: Liên kết với KPI
- `employee_id` hoặc `department_id`: Giao cho cá nhân hoặc phòng ban
- `period`: Kỳ đánh giá (YYYY-MM, YYYY-Q1, YYYY)
- `target`, `actual`: Mục tiêu và kết quả thực tế
- `progress`: Tiến độ tự động tính (%)
- `status`: Trạng thái (not_started, in_progress, completed, pending_approval, approved, rejected, overdue)
- `start_date`, `end_date`: Thời gian thực hiện
- `submission_date`, `approval_date`: Thời gian nộp và duyệt
- `approved_by`: Người duyệt
- `submission_details`, `attachment`: Chi tiết nộp và file đính kèm
- `bonus_amount`, `penalty_amount`: Số tiền thưởng phạt
- `score`: Điểm số

**Đặc điểm**:
- Tự động tính progress khi cập nhật actual
- Hỗ trợ giao KPI cho cá nhân hoặc phòng ban
- Quy trình duyệt đầy đủ với timestamp
- Tính toán thưởng phạt tự động

### 7. **Daily KPI Progress** (`07-daily-kpi-progress.sql`)
**Mục đích**: Quản lý tiến độ KPI hàng ngày
- `id`: UUID chính
- `date`: Ngày
- `department_id` hoặc `employee_id`: Phòng ban hoặc nhân viên
- `department_name`, `responsible_person`: Tên phòng ban và người chịu trách nhiệm
- `kpi_id`, `kpi_name`: Liên kết với KPI
- `actual_result`, `target_result`: Kết quả thực tế và mục tiêu
- `progress_percentage`: Phần trăm tiến độ tự động tính
- `notes`: Ghi chú
- `created_by`: Người tạo

**Đặc điểm**:
- Theo dõi tiến độ hàng ngày
- Tự động tính progress percentage
- Hỗ trợ cả cá nhân và phòng ban

### 8. **Notifications** (`08-notifications.sql`)
**Mục đích**: Hệ thống thông báo
- `id`: UUID chính
- `user_id`: Người nhận thông báo
- `type`: Loại thông báo (assigned, reminder, approved, rejected, reward, penalty, deadline, system, kpi_update, bonus_calculation)
- `priority`: Mức độ ưu tiên (low, medium, high, urgent)
- `category`: Danh mục (kpi, bonus, penalty, system, deadline, approval, reminder, announcement, warning)
- `title`, `message`: Tiêu đề và nội dung
- `read`, `read_at`: Trạng thái đọc
- `action_url`: URL hành động
- `metadata`: Dữ liệu bổ sung (JSON)
- `sender_id`: Người gửi
- `expires_at`: Thời gian hết hạn

**Đặc điểm**:
- Hệ thống thông báo đa dạng với nhiều loại
- Tự động set read_at khi đánh dấu đã đọc
- Metadata JSON để lưu thông tin bổ sung
- Hỗ trợ thông báo có thời hạn

### 9. **Bonus Configs** (`09-bonus-configs.sql`)
**Mục đích**: Cấu hình thưởng
- `id`: UUID chính
- `company_id`: Liên kết với công ty
- `name`, `description`: Tên và mô tả
- `amount`: Số tiền thưởng
- `currency`: Đơn vị tiền tệ
- `frequency`: Tần suất thưởng (monthly, quarterly, annually, one_time)
- `conditions`: Điều kiện thưởng (JSON array)
- `created_by`: Người tạo

**Đặc điểm**:
- Cấu hình thưởng linh hoạt với điều kiện JSON
- Hỗ trợ nhiều tần suất thưởng
- Soft delete với `is_active`

### 10. **Penalty Configs** (`10-penalty-configs.sql`)
**Mục đích**: Cấu hình phạt
- `id`: UUID chính
- `company_id`: Liên kết với công ty
- `name`, `description`: Tên và mô tả
- `amount`: Số tiền phạt
- `currency`: Đơn vị tiền tệ
- `conditions`: Điều kiện phạt (JSON array)
- `created_by`: Người tạo

**Đặc điểm**:
- Cấu hình phạt linh hoạt với điều kiện JSON
- Soft delete với `is_active`

### 11. **Feedback** (`11-feedback.sql`)
**Mục đích**: Phản hồi và đánh giá
- `id`: UUID chính
- `kpi_record_id`: Liên kết với bản ghi KPI
- `author_id`, `author_name`: Người viết phản hồi
- `comment`: Nội dung phản hồi
- `type`: Loại phản hồi (approval, rejection, suggestion, praise, improvement)
- `rating`: Đánh giá 1-5 sao
- `is_visible_to_employee`: Có hiển thị cho nhân viên không

**Đặc điểm**:
- Hệ thống phản hồi đa dạng
- Đánh giá sao từ 1-5
- Kiểm soát quyền xem phản hồi

### 12. **Bonus Penalty Records** (`12-bonus-penalty-records.sql`)
**Mục đích**: Lịch sử thưởng phạt
- `id`: UUID chính
- `employee_id`: Nhân viên
- `kpi_record_id`: Bản ghi KPI liên quan
- `bonus_config_id` hoặc `penalty_config_id`: Cấu hình thưởng hoặc phạt
- `amount`: Số tiền
- `type`: Loại (bonus hoặc penalty)
- `reason`: Lý do
- `period`: Kỳ
- `status`: Trạng thái (pending, approved, rejected, paid)
- `approved_by`, `approved_at`: Người duyệt và thời gian duyệt
- `paid_at`: Thời gian thanh toán

**Đặc điểm**:
- Quản lý toàn bộ quy trình thưởng phạt
- Constraint đảm bảo chỉ có bonus hoặc penalty
- Theo dõi trạng thái từ pending đến paid

## Views và Functions

### Views
1. **employee_summary**: Tóm tắt thông tin nhân viên với phòng ban, vai trò, quản lý
2. **kpi_performance_summary**: Tóm tắt hiệu suất KPI với thông tin chi tiết
3. **notification_summary**: Tóm tắt thông báo với người nhận và người gửi

### Functions
1. **get_employee_kpi_summary(emp_id, period_filter)**: Lấy tóm tắt KPI của nhân viên
2. **get_department_kpi_summary(dept_id, period_filter)**: Lấy tóm tắt KPI của phòng ban

## Đặc điểm nổi bật

### 1. **Không thừa trường**
- Mỗi trường đều có mục đích rõ ràng
- Loại bỏ các trường không sử dụng
- Tối ưu hóa storage

### 2. **Hỗ trợ đầy đủ cho Admin và Nhân viên**
- **Admin**: Quản lý toàn bộ hệ thống, tạo KPI, duyệt, cấu hình thưởng phạt
- **Nhân viên**: Xem KPI được giao, cập nhật tiến độ, nộp báo cáo, xem thông báo

### 3. **Tính năng tự động**
- Tự động tính progress khi cập nhật actual
- Tự động set read_at khi đánh dấu thông báo đã đọc
- Tự động tính progress percentage cho daily progress

### 4. **Bảo mật và kiểm soát**
- Hệ thống phân quyền với JSON permissions
- Bảo mật tài khoản với khóa tài khoản
- Soft delete để bảo toàn dữ liệu
- Constraint đảm bảo tính toàn vẹn dữ liệu

### 5. **Hiệu suất**
- Index đầy đủ cho các truy vấn thường dùng
- Composite index cho các query phức tạp
- Triggers tự động cập nhật timestamp

### 6. **Linh hoạt**
- JSON cho permissions, conditions, metadata
- Hỗ trợ multi-tenant
- Cấu trúc phân cấp phòng ban
- Nhiều loại KPI và thông báo

## Cách sử dụng

1. **Chạy migration**: `psql -f src/schemas/00-complete-migration.sql`
2. **Cập nhật types**: Sử dụng `src/schemas/13-complete-database-types.ts`
3. **Cập nhật services**: Cập nhật các service để sử dụng schema mới

## Lưu ý

- Tất cả bảng đều có `is_active` để soft delete
- Tất cả bảng đều có `created_at` và `updated_at`
- Sử dụng UUID cho tất cả primary key
- Constraint đảm bảo tính toàn vẹn dữ liệu
- Index được tối ưu cho các truy vấn thường dùng

# Hệ thống Thông báo KPI Central

## Tổng quan

Hệ thống thông báo đã được hoàn thiện với đầy đủ các tính năng cho cả admin và nhân viên. Hệ thống tự động gửi thông báo khi có các sự kiện quan trọng trong quy trình KPI.

## Tính năng chính

### 1. Thông báo tự động

#### Khi giao KPI
- **Người nhận**: Nhân viên/phòng ban được giao KPI
- **Nội dung**: Thông báo về KPI mới được giao với mục tiêu và thời hạn
- **Hành động**: Chuyển đến trang quản lý KPI của nhân viên

#### Khi submit KPI
- **Người nhận**: Admin/Quản lý
- **Nội dung**: Thông báo về KPI đã được submit với kết quả thực tế
- **Hành động**: Chuyển đến trang duyệt KPI

#### Khi approve/reject KPI
- **Người nhận**: Nhân viên
- **Nội dung**: Thông báo về kết quả phê duyệt với điểm số hoặc phản hồi
- **Hành động**: Chuyển đến trang quản lý KPI

#### Thông báo nhắc nhở deadline
- **Tự động**: Kiểm tra mỗi 30 phút
- **Thời điểm**: 3 ngày, 1 ngày trước deadline
- **Mức độ ưu tiên**: Cao/Khẩn cấp tùy theo thời gian còn lại

#### Thông báo bonus/penalty
- **Tự động**: Khi KPI được approve
- **Tính toán**: Dựa trên config reward/penalty của KPI
- **Nội dung**: Số tiền thưởng/phạt cụ thể

### 2. Giao diện người dùng

#### NotificationPanel (Header)
- **Vị trí**: Góc phải header, hiển thị trên tất cả trang
- **Tính năng**:
  - Hiển thị số thông báo chưa đọc
  - Lọc theo danh mục (KPI, Thưởng phạt, Hệ thống, Nhắc nhở)
  - Đánh dấu đã đọc/tất cả đã đọc
  - Click để chuyển đến trang liên quan

#### EmployeeNotificationSummary (Dashboard nhân viên)
- **Vị trí**: Dashboard chính của nhân viên
- **Tính năng**:
  - Hiển thị 5 thông báo gần nhất
  - Thống kê số thông báo chưa đọc
  - Click để xem chi tiết và chuyển trang

#### Admin Notification Management
- **Vị trí**: `/admin/notifications`
- **Tính năng**:
  - Xem tất cả thông báo trong hệ thống
  - Lọc theo loại, mức độ ưu tiên, danh mục, người nhận
  - Tìm kiếm thông báo
  - Đánh dấu đã đọc/xóa thông báo
  - Gửi thông báo hệ thống (placeholder)

### 3. Cấu trúc dữ liệu

#### Notification Interface
```typescript
interface Notification {
  id: string;
  user_id: string; // 'all' cho thông báo toàn hệ thống
  type: 'assigned' | 'submitted' | 'approved' | 'rejected' | 'reminder' | 'reward' | 'penalty' | 'deadline';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'kpi' | 'bonus' | 'system' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  actor: {
    id: string;
    name: string;
    avatar: string;
  };
  target: string;
  action: string;
  actionUrl?: string;
  metadata?: {
    kpiId?: string;
    recordId?: string;
    bonusAmount?: number;
    penaltyAmount?: number;
    deadline?: string;
    period?: string;
  };
}
```

### 4. Services

#### NotificationManager
- **Singleton pattern**: Quản lý tất cả thông báo
- **Methods**:
  - `notifyKpiAssigned()`: Thông báo giao KPI
  - `notifyKpiSubmitted()`: Thông báo submit KPI
  - `notifyKpiApproved()`: Thông báo approve/reject
  - `notifyDeadlineReminder()`: Thông báo nhắc nhở
  - `notifyBonusPenalty()`: Thông báo thưởng/phạt
  - `notifySystem()`: Thông báo hệ thống

#### NotificationScheduler
- **Auto-scheduler**: Chạy background để kiểm tra deadline
- **Methods**:
  - `startScheduler()`: Khởi động scheduler
  - `stopScheduler()`: Dừng scheduler
  - `checkDeadlines()`: Kiểm tra deadline và gửi thông báo
  - `calculateBonusPenalty()`: Tính toán thưởng/phạt

### 5. Tích hợp

#### SupabaseDataContext
- Tích hợp notification manager vào các action chính
- Tự động gửi thông báo khi:
  - Giao KPI (`assignKpi`)
  - Submit KPI (`submitKpiRecord`)
  - Approve/reject KPI (`updateKpiRecordStatus`)

#### Layout Integration
- NotificationPanel được tích hợp vào AppShellContent
- Hiển thị trên cả desktop và mobile
- Responsive design

### 6. Cấu hình

#### Database Schema
- Bảng `notifications` với đầy đủ các trường cần thiết
- Index trên `user_id`, `created_at`, `read` để tối ưu performance
- Soft delete với `is_active` field

#### Environment Variables
- Không cần cấu hình thêm
- Sử dụng Supabase connection hiện có

### 7. Sử dụng

#### Cho Admin
1. Truy cập `/admin/notifications` để quản lý thông báo
2. Sử dụng bộ lọc để tìm thông báo cụ thể
3. Click vào thông báo để đánh dấu đã đọc
4. Sử dụng NotificationPanel ở header để xem thông báo nhanh

#### Cho Nhân viên
1. Xem thông báo trong NotificationPanel (header)
2. Xem tóm tắt thông báo trong dashboard chính
3. Click vào thông báo để chuyển đến trang liên quan
4. Thông báo sẽ tự động cập nhật khi có sự kiện mới

### 8. Tùy chỉnh

#### Thêm loại thông báo mới
1. Thêm type mới vào `NotificationData` interface
2. Thêm icon vào `notificationIcons` object
3. Tạo method mới trong `NotificationManager`
4. Tích hợp vào các action cần thiết

#### Thay đổi thời gian nhắc nhở
- Sửa trong `NotificationScheduler.checkDeadlines()`
- Thay đổi logic kiểm tra `daysUntilDeadline`

#### Tùy chỉnh giao diện
- Sửa màu sắc trong `priorityColors` và `categoryColors`
- Thay đổi layout trong các component UI

## Kết luận

Hệ thống thông báo đã được hoàn thiện với đầy đủ tính năng tự động hóa và giao diện thân thiện. Hệ thống sẽ giúp cải thiện trải nghiệm người dùng và đảm bảo không bỏ lỡ các sự kiện quan trọng trong quy trình KPI.

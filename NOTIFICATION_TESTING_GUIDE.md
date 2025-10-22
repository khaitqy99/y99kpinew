# Hướng dẫn kiểm tra hệ thống thông báo

## 🔍 Vấn đề đã phát hiện:

1. **Database Schema**: Bảng `notifications` hiện tại yêu cầu `user_id` phải là UUID và reference đến bảng `employees`
2. **NotificationService**: Tạo thông báo với `user_id` đặc biệt như 'admin', 'employee', 'all' 
3. **NotificationPanel**: Đã được cập nhật để filter theo role của user

## 🚀 Các bước để sửa và test:

### Bước 1: Chạy Migration Database
```sql
-- Chạy file fix-notifications-schema.sql trong Supabase SQL Editor
-- File này sẽ:
-- 1. Xóa foreign key constraint
-- 2. Đổi user_id từ UUID sang TEXT
-- 3. Thêm constraint để chấp nhận UUID hoặc giá trị đặc biệt
-- 4. Tạo test data
```

### Bước 2: Kiểm tra trong UI
1. Truy cập `/test-upload` 
2. Sử dụng **NotificationTestPanel** để:
   - Tạo thông báo test với UUID thực
   - Tạo thông báo test với user_id = 'admin'
   - Xem kết quả và lỗi (nếu có)

3. Sử dụng **NotificationDebugPanel** để:
   - Xem tất cả thông báo trong hệ thống
   - Xem thông báo được filter cho user hiện tại

### Bước 3: Test NotificationPanel thực tế
1. Đăng nhập với tài khoản admin
2. Click vào icon chuông (bell) để mở notification panel
3. Kiểm tra xem có hiển thị thông báo không

## 📋 Các thay đổi đã thực hiện:

### 1. NotificationPanel (`src/components/notification-panel.tsx`)
```typescript
// Logic filter mới:
const userNotifications = useMemo(() => {
  if (!user || !notifications) return [];
  
  return notifications.filter(n => {
    // Thông báo cá nhân cho user này
    if (n.user_id === user.id) return true;
    
    // Thông báo cho admin (nếu user là admin)
    if (user.role === 'admin' && n.user_id === 'admin') return true;
    
    // Thông báo cho employee (nếu user là employee)
    if (user.role === 'employee' && n.user_id === 'employee') return true;
    
    // Thông báo cho tất cả
    if (n.user_id === 'all') return true;
    
    return false;
  });
}, [notifications, user]);
```

### 2. NotificationService (`src/services/notification-service.ts`)
```typescript
// Bỏ logic bỏ qua thông báo với user_id đặc biệt
async createNotification(notificationData) {
  // Giữ nguyên user_id để có thể filter theo role
  let userId = notificationData.user_id;
  
  const dbNotification = {
    user_id: userId, // Có thể là UUID hoặc 'admin', 'employee', 'all'
    // ... other fields
  };
  
  return await notificationService.create(dbNotification);
}
```

### 3. Database Migration (`fix-notifications-schema.sql`)
```sql
-- Xóa foreign key constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Đổi user_id sang TEXT
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;

-- Thêm constraint
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_check 
CHECK (
  user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' OR 
  user_id IN ('admin', 'employee', 'all')
);
```

## 🧪 Test Cases:

### Test Case 1: Admin User
- **Expected**: Thấy thông báo có `user_id = 'admin'` và `'all'`
- **Action**: Đăng nhập với admin account, kiểm tra notification panel

### Test Case 2: Employee User  
- **Expected**: Thấy thông báo có `user_id = 'employee'` và `'all'`
- **Action**: Đăng nhập với employee account, kiểm tra notification panel

### Test Case 3: Tạo thông báo mới
- **Expected**: Thông báo được tạo thành công và hiển thị đúng
- **Action**: Sử dụng NotificationTestPanel để tạo thông báo test

## 🔧 Troubleshooting:

### Nếu vẫn không hiển thị thông báo:
1. Kiểm tra console browser có lỗi không
2. Kiểm tra Network tab xem API call có thành công không
3. Kiểm tra database có thông báo không:
   ```sql
   SELECT * FROM notifications WHERE is_active = true ORDER BY created_at DESC;
   ```

### Nếu có lỗi khi tạo thông báo:
1. Kiểm tra migration đã chạy chưa
2. Kiểm tra constraint trong database
3. Kiểm tra user_id có đúng format không

## 📊 Kết quả mong đợi:

Sau khi hoàn thành các bước trên:
- ✅ Admin sẽ thấy thông báo dành cho admin và thông báo chung
- ✅ Employee sẽ thấy thông báo dành cho employee và thông báo chung  
- ✅ Thông báo cá nhân (UUID) sẽ hiển thị cho đúng user
- ✅ Có thể tạo và hiển thị thông báo mới thành công

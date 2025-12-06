import { supabase } from '@/lib/supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
  department_id: string;
  avatar: string;
  position: string;
  employee_code: string;
  branch_name?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  error?: string;
}

export class AuthService {
  /**
   * Đăng nhập với email và password
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { email, password } = credentials;

      // Normalize email to lowercase for comparison
      const normalizedEmail = email.toLowerCase().trim();

      // Tìm employee với email (simple query)
      const { data: employee, error: findError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          email,
          avatar_url,
          position,
          employee_code,
          status,
          is_active,
          password_hash,
          login_attempts,
          locked_until,
          role_id,
          department_id,
          level
        `)
        .eq('email', normalizedEmail)
        .eq('is_active', true)
        .single();

      if (findError) {
        // Check if error is an HTML response (network/Cloudflare error)
        const errorMessage = typeof findError === 'object' && findError !== null
          ? (findError as any).message || JSON.stringify(findError)
          : String(findError);
        
        if (errorMessage.includes('<html>') || errorMessage.includes('500 Internal Server Error')) {
          console.error('Login error - Supabase connection failed:', {
            code: (findError as any)?.code,
            details: (findError as any)?.details,
            hint: (findError as any)?.hint,
            message: 'Network or Supabase service error'
          });
          return {
            success: false,
            error: 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại sau.'
          };
        }
        
        console.error('Login error - Employee not found:', {
          code: (findError as any)?.code,
          message: (findError as any)?.message,
          details: (findError as any)?.details,
          hint: (findError as any)?.hint
        });
        return {
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        };
      }

      if (!employee) {
        console.error('Login error - Employee not found: No employee data returned');
        return {
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        };
      }

      // Kiểm tra status của employee
      if (employee.status !== 'active') {
        return {
          success: false,
          error: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
        };
      }

      // Kiểm tra tài khoản có bị khóa không
      if (employee.locked_until && new Date(employee.locked_until) > new Date()) {
        return {
          success: false,
          error: 'Tài khoản đã bị khóa. Vui lòng thử lại sau.'
        };
      }

      // Kiểm tra mật khẩu (đơn giản cho demo)
      if (employee.password_hash !== password) {
        // Tăng số lần đăng nhập sai
        const newAttempts = (employee.login_attempts || 0) + 1;
        const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Khóa 30 phút

        await supabase
          .from('employees')
          .update({
            login_attempts: newAttempts,
            locked_until: lockedUntil
          })
          .eq('id', employee.id);

        return {
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        };
      }

      // Reset số lần đăng nhập sai và cập nhật lần đăng nhập cuối
      await supabase
        .from('employees')
        .update({
          login_attempts: 0,
          locked_until: null,
          last_login: new Date().toISOString()
        })
        .eq('id', employee.id);

      // Lấy thông tin department
      const { data: department } = await supabase
        .from('departments')
        .select('id, name, branch_id')
        .eq('id', employee.department_id)
        .single();

      // Lấy tên branch từ department nếu có branch_id
      let branchName: string | undefined;
      if (department?.branch_id) {
        try {
          const { data: branch } = await supabase
            .from('branches')
            .select('id, name')
            .eq('id', department.branch_id)
            .eq('is_active', true)
            .single();
          branchName = branch?.name;
        } catch (error) {
          // Nếu bảng branches chưa tồn tại hoặc có lỗi, bỏ qua
          console.warn('Could not fetch branch:', error);
        }
      }

      // Xác định role dựa trên level
      let role: 'admin' | 'manager' | 'employee' = 'employee';
      if (employee.level >= 4) {
        role = 'admin';
      } else if (employee.level >= 2) {
        role = 'manager';
      }

      const user: User = {
        id: String(employee.id),
        name: employee.name,
        email: employee.email,
        role,
        department: department?.name || 'Unknown',
        department_id: String(employee.department_id),
        avatar: employee.avatar_url || 'https://picsum.photos/seed/default/40/40',
        position: employee.position,
        employee_code: employee.employee_code,
        branch_name: branchName
      };

      return {
        success: true,
        user
      };

    } catch (error: any) {
      console.error('Login error - Exception:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      // Check if it's a network error
      if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại sau.'
        };
      }
      
      return {
        success: false,
        error: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.'
      };
    }
  }

  /**
   * Đăng xuất
   */
  static async logout(): Promise<void> {
    // Xóa session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user');
    }
  }

  /**
   * Kiểm tra session hiện tại
   */
  static async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;

    try {
      const storedUser = sessionStorage.getItem('user');
      if (!storedUser) return null;

      const user = JSON.parse(storedUser);
      
      // Kiểm tra user có còn tồn tại trong DB không
      // Convert user.id (string) to number for database query
      const employeeId = parseInt(user.id, 10);
      if (isNaN(employeeId)) {
        sessionStorage.removeItem('user');
        return null;
      }
      
      const { data: employee, error } = await supabase
        .from('employees')
        .select('id, is_active, status')
        .eq('id', employeeId)
        .eq('is_active', true)
        .single();

      if (error || !employee) {
        sessionStorage.removeItem('user');
        return null;
      }

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      sessionStorage.removeItem('user');
      return null;
    }
  }

  /**
   * Tạo tài khoản admin mặc định nếu chưa có
   */
  static async ensureAdminExists(): Promise<void> {
    try {
      const { data: existingAdmin } = await supabase
        .from('employees')
        .select('id')
        .eq('email', 'db@y99.vn')
        .single();

      if (existingAdmin) {
        console.log('✅ Admin account already exists');
        return;
      }

      console.log('⚠️ Admin account not found. Please run the SQL script in Supabase to create admin data.');
      console.log('📄 Run the SQL script: supabase-admin-setup.sql');
      
    } catch (error) {
      console.error('Error ensuring admin exists:', error);
      console.log('⚠️ Please run the SQL script in Supabase to create admin data.');
      console.log('📄 Run the SQL script: supabase-admin-setup.sql');
    }
  }

  /**
   * Đổi mật khẩu cho user hiện tại
   */
  static async changePassword(
    userId: string, 
    request: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    try {
      const { currentPassword, newPassword, confirmPassword } = request;

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return {
          success: false,
          error: 'Vui lòng điền đầy đủ thông tin'
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          success: false,
          error: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        };
      }

      // Lấy thông tin user hiện tại
      // Convert userId (string) to number for database query
      const employeeId = parseInt(userId, 10);
      if (isNaN(employeeId)) {
        return {
          success: false,
          error: 'ID người dùng không hợp lệ'
        };
      }
      
      const { data: employee, error: findError } = await supabase
        .from('employees')
        .select('id, password_hash')
        .eq('id', employeeId)
        .single();

      if (findError || !employee) {
        return {
          success: false,
          error: 'Không tìm thấy thông tin người dùng'
        };
      }

      // Kiểm tra mật khẩu hiện tại
      if (employee.password_hash !== currentPassword) {
        return {
          success: false,
          error: 'Mật khẩu hiện tại không đúng'
        };
      }

      // Cập nhật mật khẩu mới
      const { error: updateError } = await supabase
        .from('employees')
        .update({ 
          password_hash: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (updateError) {
        return {
          success: false,
          error: 'Có lỗi xảy ra khi cập nhật mật khẩu'
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Có lỗi xảy ra khi đổi mật khẩu'
      };
    }
  }
}


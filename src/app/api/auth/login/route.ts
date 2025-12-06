import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth-service';

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await AuthService.login({ email, password });
    
    if (!result.success) {
      // Use 500 for connection/system errors, 401 for authentication errors
      const statusCode = result.error?.includes('kết nối') || result.error?.includes('hệ thống') 
        ? 500 
        : 401;
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.user });
  } catch (error: any) {
    console.error('Error during login API:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Check if it's a JSON parse error
    if (error instanceof SyntaxError || error?.message?.includes('JSON')) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu yêu cầu không hợp lệ' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error?.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}



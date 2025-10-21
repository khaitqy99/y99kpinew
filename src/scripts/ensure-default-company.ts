import { supabase } from '@/lib/supabase';

// Script để đảm bảo có company mặc định
export async function ensureDefaultCompany() {
  try {
    console.log('🔍 Kiểm tra company mặc định...');

    // Kiểm tra xem đã có company chưa
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('is_active', true)
      .single();

    if (existingCompany) {
      console.log('✅ Company đã tồn tại:', existingCompany.name);
      return existingCompany;
    }

    // Nếu chưa có, tạo company mặc định
    console.log('📝 Tạo company mặc định...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Y99 Company',
        code: 'Y99',
        description: 'Công ty Y99',
        email: 'contact@y99.vn',
        is_active: true
      })
      .select()
      .single();

    if (companyError) {
      console.error('❌ Lỗi tạo company:', companyError);
      throw companyError;
    }

    console.log('✅ Company đã được tạo:', company.name);
    return company;
  } catch (error) {
    console.error('❌ Lỗi trong ensureDefaultCompany:', error);
    throw error;
  }
}

// Chạy script nếu được gọi trực tiếp
if (typeof window === 'undefined') {
  ensureDefaultCompany()
    .then(() => {
      console.log('🎉 Hoàn thành!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Lỗi:', error);
      process.exit(1);
    });
}

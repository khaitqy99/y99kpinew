-- =====================================================
-- COMPANIES SCHEMA
-- Quản lý thông tin công ty
-- =====================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    tax_code VARCHAR(50),
    business_license VARCHAR(100),
    founded_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_companies_code ON companies(code);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Triggers
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Comments
COMMENT ON TABLE companies IS 'Bảng quản lý thông tin công ty';
COMMENT ON COLUMN companies.id IS 'ID duy nhất của công ty';
COMMENT ON COLUMN companies.name IS 'Tên công ty';
COMMENT ON COLUMN companies.code IS 'Mã công ty (duy nhất)';
COMMENT ON COLUMN companies.description IS 'Mô tả công ty';
COMMENT ON COLUMN companies.email IS 'Email liên hệ';
COMMENT ON COLUMN companies.phone IS 'Số điện thoại';
COMMENT ON COLUMN companies.address IS 'Địa chỉ';
COMMENT ON COLUMN companies.logo_url IS 'URL logo công ty';
COMMENT ON COLUMN companies.website IS 'Website công ty';
COMMENT ON COLUMN companies.tax_code IS 'Mã số thuế';
COMMENT ON COLUMN companies.business_license IS 'Giấy phép kinh doanh';
COMMENT ON COLUMN companies.founded_date IS 'Ngày thành lập';
COMMENT ON COLUMN companies.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN companies.created_at IS 'Thời gian tạo';
COMMENT ON COLUMN companies.updated_at IS 'Thời gian cập nhật cuối';

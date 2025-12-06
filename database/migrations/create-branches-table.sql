-- =====================================================
-- CREATE BRANCHES TABLE
-- Chi nhánh (Branches) - địa điểm/office khác nhau
-- Phòng ban (Departments) sẽ thuộc về chi nhánh
-- =====================================================

-- Tạo bảng branches
CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  manager_id BIGINT,  -- Sẽ thêm constraint sau khi tạo bảng employees
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm cột branch_id vào bảng departments
ALTER TABLE departments 
  ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;

-- Thêm cột branch_id vào bảng employees (nếu cần)
-- ALTER TABLE employees 
--   ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_departments_branch_id ON departments(branch_id) WHERE branch_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Foreign key constraint cho manager_id (sau khi employees đã được tạo)
-- Sử dụng DO block để kiểm tra constraint đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_branches_manager'
  ) THEN
    ALTER TABLE branches 
      ADD CONSTRAINT fk_branches_manager 
      FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Comments
COMMENT ON TABLE branches IS 'Bảng lưu thông tin chi nhánh (địa điểm/office)';
COMMENT ON COLUMN departments.branch_id IS 'Chi nhánh mà phòng ban này thuộc về';

-- Enable Realtime for branches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'branches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE branches;
    END IF;
END $$;


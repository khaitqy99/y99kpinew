-- =====================================================
-- CREATE EMPLOYEE_DEPARTMENTS JUNCTION TABLE
-- Cho phép một người dùng thuộc nhiều phòng ban trong chi nhánh
-- =====================================================

-- Tạo bảng junction employee_departments
CREATE TABLE IF NOT EXISTS employee_departments (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,  -- Phòng ban chính (primary department)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Mỗi employee chỉ có thể có một primary department
  CONSTRAINT unique_primary_department UNIQUE(employee_id, is_primary) DEFERRABLE INITIALLY DEFERRED,
  -- Mỗi employee chỉ có thể có một bản ghi cho mỗi department
  CONSTRAINT unique_employee_department UNIQUE(employee_id, department_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_departments_employee_id ON employee_departments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_departments_department_id ON employee_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_departments_is_primary ON employee_departments(is_primary) WHERE is_primary = true;

-- Trigger for updated_at
CREATE TRIGGER update_employee_departments_updated_at BEFORE UPDATE ON employee_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate dữ liệu hiện tại từ employees.department_id sang employee_departments
-- Chuyển tất cả department_id hiện tại thành primary department
INSERT INTO employee_departments (employee_id, department_id, is_primary)
SELECT 
  id as employee_id,
  department_id,
  true as is_primary
FROM employees
WHERE department_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM employee_departments ed 
    WHERE ed.employee_id = employees.id AND ed.department_id = employees.department_id
  )
ON CONFLICT (employee_id, department_id) DO NOTHING;

-- Function để đảm bảo mỗi employee có đúng một primary department
CREATE OR REPLACE FUNCTION ensure_primary_department()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu set is_primary = true, set tất cả các bản ghi khác của employee này thành false
  IF NEW.is_primary = true THEN
    UPDATE employee_departments
    SET is_primary = false
    WHERE employee_id = NEW.employee_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  
  -- Nếu đây là bản ghi đầu tiên của employee và chưa có primary, set làm primary
  IF NOT EXISTS (
    SELECT 1 FROM employee_departments 
    WHERE employee_id = NEW.employee_id AND is_primary = true
  ) THEN
    NEW.is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để đảm bảo mỗi employee có đúng một primary department
CREATE TRIGGER ensure_primary_department_trigger
  BEFORE INSERT OR UPDATE ON employee_departments
  FOR EACH ROW
  EXECUTE FUNCTION ensure_primary_department();

-- Comments
COMMENT ON TABLE employee_departments IS 'Bảng junction lưu quan hệ nhiều-nhiều giữa employees và departments';
COMMENT ON COLUMN employee_departments.is_primary IS 'Phòng ban chính của nhân viên (mỗi nhân viên chỉ có một primary department)';

-- Enable Realtime replication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'employee_departments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE employee_departments;
    END IF;
END $$;

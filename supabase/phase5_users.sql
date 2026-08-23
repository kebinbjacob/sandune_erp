-- ==========================================
-- Phase 5: User Management (App Users)
-- ==========================================

CREATE TABLE IF NOT EXISTS app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password text,
  department text,
  role text NOT NULL DEFAULT 'Viewer',
  status text NOT NULL DEFAULT 'Active',
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Policies for app_users
CREATE POLICY "Allow public select on app_users" ON app_users FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on app_users" ON app_users FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on app_users" ON app_users FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on app_users" ON app_users FOR DELETE TO public USING (true);

-- Insert dummy data (link to existing employees)
-- We'll just link the first 3 employees as examples
DO $$
DECLARE
  emp1 uuid;
  emp2 uuid;
  emp3 uuid;
  email1 text;
  email2 text;
  email3 text;
BEGIN
  -- Grab some employees
  SELECT id, email INTO emp1, email1 FROM employees ORDER BY created_at ASC LIMIT 1;
  SELECT id, email INTO emp2, email2 FROM employees ORDER BY created_at ASC OFFSET 1 LIMIT 1;
  SELECT id, email INTO emp3, email3 FROM employees ORDER BY created_at ASC OFFSET 2 LIMIT 1;

  IF emp1 IS NOT NULL THEN
    INSERT INTO app_users (employee_id, email, role, status) VALUES (emp1, email1, 'Admin', 'Active') ON CONFLICT DO NOTHING;
  END IF;

  IF emp2 IS NOT NULL THEN
    INSERT INTO app_users (employee_id, email, role, status) VALUES (emp2, email2, 'Project Manager', 'Active') ON CONFLICT DO NOTHING;
  END IF;

  IF emp3 IS NOT NULL THEN
    INSERT INTO app_users (employee_id, email, role, status) VALUES (emp3, email3, 'HR Manager', 'Active') ON CONFLICT DO NOTHING;
  END IF;
END $$;

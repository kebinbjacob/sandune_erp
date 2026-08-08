-- ==========================================
-- Projects & Tasks Schema
-- ==========================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_code text UNIQUE,
  name text NOT NULL,
  client text,
  description text,
  status text NOT NULL DEFAULT 'Planning',
  completion_pct integer DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  start_date date,
  end_date date,
  budget numeric,
  spent numeric DEFAULT 0,
  location text,
  manager_id uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES employees(id),
  status text NOT NULL DEFAULT 'To Do',
  priority text NOT NULL DEFAULT 'Medium',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- Payroll Schema
-- ==========================================

CREATE TABLE IF NOT EXISTS payroll_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL,
  working_days integer DEFAULT 26,
  present_days integer DEFAULT 0,
  absent_days integer DEFAULT 0,
  leave_days integer DEFAULT 0,
  half_days integer DEFAULT 0,
  on_duty_days integer DEFAULT 0,
  gross_salary numeric DEFAULT 0,
  absent_deduction numeric DEFAULT 0,
  half_day_deduction numeric DEFAULT 0,
  net_salary numeric DEFAULT 0,
  status text DEFAULT 'Draft',
  remarks text,
  generated_by text DEFAULT 'Admin',
  generated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, period_month, period_year)
);

-- ==========================================
-- RLS Policies
-- ==========================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert on projects" ON projects;
DROP POLICY IF EXISTS "Allow public update on projects" ON projects;
DROP POLICY IF EXISTS "Allow public delete on projects" ON projects;

CREATE POLICY "Allow public select on projects" ON projects FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on projects" ON projects FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on projects" ON projects FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on projects" ON projects FOR DELETE TO public USING (true);

DROP POLICY IF EXISTS "Allow public select on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public insert on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public update on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public delete on tasks" ON tasks;

CREATE POLICY "Allow public select on tasks" ON tasks FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on tasks" ON tasks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on tasks" ON tasks FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on tasks" ON tasks FOR DELETE TO public USING (true);

DROP POLICY IF EXISTS "Allow public select on payroll_runs" ON payroll_runs;
DROP POLICY IF EXISTS "Allow public insert on payroll_runs" ON payroll_runs;
DROP POLICY IF EXISTS "Allow public update on payroll_runs" ON payroll_runs;

CREATE POLICY "Allow public select on payroll_runs" ON payroll_runs FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on payroll_runs" ON payroll_runs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on payroll_runs" ON payroll_runs FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ==========================================
-- Seed Data
-- ==========================================

INSERT INTO projects (project_code, name, client, description, status, completion_pct, start_date, end_date, budget, location)
VALUES
  ('PRJ-001', 'Skyline Tower', 'Apex Developers', '32-floor residential tower in downtown', 'Active', 45, '2025-01-10', '2027-06-30', 12500000, 'Downtown City Center'),
  ('PRJ-002', 'Ocean View Residences', 'BlueWater Co', 'Luxury beachfront villa complex', 'Planning', 5, '2026-03-01', '2028-12-31', 8700000, 'Coastal District'),
  ('PRJ-003', 'Metro Station Renovation', 'City Transit Authority', 'Full renovation of 3 metro stations', 'Delayed', 78, '2024-06-15', '2026-09-30', 5200000, 'Central Metro Line')
ON CONFLICT DO NOTHING;

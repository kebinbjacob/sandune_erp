-- ==========================================
-- Phase 3: Finance & Operations
-- ==========================================

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  date date NOT NULL,
  status text DEFAULT 'Pending',
  submitted_by uuid REFERENCES employees(id),
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Site Reports
CREATE TABLE IF NOT EXISTS site_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  submitted_by uuid REFERENCES employees(id),
  weather text,
  work_completed text,
  issues_faced text,
  materials_used text,
  created_at timestamptz DEFAULT now()
);

-- Safety Incidents
CREATE TABLE IF NOT EXISTS safety_incidents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  incident_date date NOT NULL,
  reported_by uuid REFERENCES employees(id),
  severity text NOT NULL,
  description text NOT NULL,
  action_taken text,
  status text DEFAULT 'Open',
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- Phase 4: HR Additions & Settings
-- ==========================================

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Shift Assignments
CREATE TABLE IF NOT EXISTS employee_shifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE,
  effective_from date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  year integer NOT NULL,
  annual_total integer DEFAULT 14,
  annual_used integer DEFAULT 0,
  sick_total integer DEFAULT 7,
  sick_used integer DEFAULT 0,
  casual_total integer DEFAULT 7,
  casual_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, year)
);

-- ==========================================
-- RLS Policies
-- ==========================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on expenses" ON expenses FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on expenses" ON expenses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on expenses" ON expenses FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public select on site_reports" ON site_reports FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on site_reports" ON site_reports FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on safety_incidents" ON safety_incidents FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on safety_incidents" ON safety_incidents FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on safety_incidents" ON safety_incidents FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public select on shifts" ON shifts FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on shifts" ON shifts FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on employee_shifts" ON employee_shifts FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on employee_shifts" ON employee_shifts FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on leave_balances" ON leave_balances FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on leave_balances" ON leave_balances FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on leave_balances" ON leave_balances FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Seed some shifts
INSERT INTO shifts (name, start_time, end_time) VALUES 
('Morning Shift', '08:00', '17:00'),
('Evening Shift', '16:00', '01:00'),
('Night Shift', '00:00', '09:00')
ON CONFLICT DO NOTHING;

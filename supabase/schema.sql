-- Sandune Core HR & Supabase Integration Schema Definition

-- 1. Table Definitions

-- Table: employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id text,
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL,
  department text,
  project text,
  status text NOT NULL DEFAULT 'Active',
  joining_date date DEFAULT current_date,
  salary numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  date date DEFAULT current_date,
  check_in text,
  check_out text,
  status text NOT NULL DEFAULT 'Present',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table: leave_requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  reason text,
  approved_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies permitting public/anon and authenticated users to SELECT, INSERT, UPDATE, DELETE

-- Policies for employees table
DROP POLICY IF EXISTS "Allow public select on employees" ON employees;
DROP POLICY IF EXISTS "Allow public insert on employees" ON employees;
DROP POLICY IF EXISTS "Allow public update on employees" ON employees;
DROP POLICY IF EXISTS "Allow public delete on employees" ON employees;

CREATE POLICY "Allow public select on employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow public insert on employees" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on employees" ON employees FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on employees" ON employees FOR DELETE USING (true);

-- Policies for attendance table
DROP POLICY IF EXISTS "Allow public select on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public insert on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public update on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public delete on attendance" ON attendance;

CREATE POLICY "Allow public select on attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert on attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on attendance" ON attendance FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on attendance" ON attendance FOR DELETE USING (true);

-- Policies for leave_requests table
DROP POLICY IF EXISTS "Allow public select on leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow public insert on leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow public update on leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow public delete on leave_requests" ON leave_requests;

CREATE POLICY "Allow public select on leave_requests" ON leave_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert on leave_requests" ON leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on leave_requests" ON leave_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on leave_requests" ON leave_requests FOR DELETE USING (true);

-- 4. Seed Data INSERT statements for initial employees
INSERT INTO employees (employee_id, name, email, phone, role, department, project, status, salary)
VALUES 
  ('EMP-001', 'John Doe', 'john.doe@sandune.com', '+1-555-0101', 'Site Engineer', 'Engineering', 'Skyline Tower', 'Active', 85000),
  ('EMP-002', 'Sarah Smith', 'sarah.smith@sandune.com', '+1-555-0102', 'Project Manager', 'Management', 'Ocean View Residences', 'Active', 95000),
  ('EMP-003', 'Mike Johnson', 'mike.johnson@sandune.com', '+1-555-0103', 'Safety Officer', 'Safety', 'Skyline Tower', 'On Leave', 75000),
  ('EMP-004', 'Emily Chen', 'emily.chen@sandune.com', '+1-555-0104', 'Architect', 'Design', 'Metro Station', 'Active', 90000)
ON CONFLICT DO NOTHING;

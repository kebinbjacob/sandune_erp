-- Sandune Core HR & Supabase Integration Schema Definition

-- ==========================================
-- 1. Table Definitions
-- ==========================================

-- Table: employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id text UNIQUE,
  name text NOT NULL,
  email text UNIQUE,
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
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_employee_date UNIQUE(employee_id, date)
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

-- ==========================================
-- 2. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. RLS Policies (public/anon & authenticated)
-- ==========================================

-- Policies for employees table
DROP POLICY IF EXISTS "Allow public and authenticated select on employees" ON employees;
DROP POLICY IF EXISTS "Allow public and authenticated insert on employees" ON employees;
DROP POLICY IF EXISTS "Allow public and authenticated update on employees" ON employees;
DROP POLICY IF EXISTS "Allow public and authenticated delete on employees" ON employees;

CREATE POLICY "Allow public and authenticated select on employees" ON employees FOR SELECT TO public USING (true);
CREATE POLICY "Allow public and authenticated insert on employees" ON employees FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public and authenticated update on employees" ON employees FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public and authenticated delete on employees" ON employees FOR DELETE TO public USING (true);

-- Policies for attendance table
DROP POLICY IF EXISTS "Allow public and authenticated select on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public and authenticated insert on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public and authenticated update on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public and authenticated delete on attendance" ON attendance;

CREATE POLICY "Allow public and authenticated select on attendance" ON attendance FOR SELECT TO public USING (true);
CREATE POLICY "Allow public and authenticated insert on attendance" ON attendance FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public and authenticated update on attendance" ON attendance FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public and authenticated delete on attendance" ON attendance FOR DELETE TO public USING (true);

-- Policies for leave_requests table
DROP POLICY IF EXISTS "Allow public and authenticated select on leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow public and authenticated insert on leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow public and authenticated update on leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow public and authenticated delete on leave_requests" ON leave_requests;

CREATE POLICY "Allow public and authenticated select on leave_requests" ON leave_requests FOR SELECT TO public USING (true);
CREATE POLICY "Allow public and authenticated insert on leave_requests" ON leave_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public and authenticated update on leave_requests" ON leave_requests FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public and authenticated delete on leave_requests" ON leave_requests FOR DELETE TO public USING (true);


-- ==========================================
-- 4. Seed Data
-- ==========================================
-- No seed data. All data is managed via the application and admin panel.
-- Use setup_superadmin.sql to create the initial SUPER_ADMIN account.


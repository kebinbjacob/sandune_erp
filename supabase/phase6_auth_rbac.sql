-- ==========================================
-- Phase 6: Auth, RBAC & Audit Logging Refactoring
-- ==========================================

-- 1. CLEANUP DUMMY DATA
-- ==========================================
-- Delete all existing data safely (respecting foreign key cascades).
-- WARNING: This wipes existing prototype data to prepare for production.
TRUNCATE TABLE employees CASCADE;

-- 2. EMPLOYEE ID AUTO-GENERATION
-- ==========================================
CREATE SEQUENCE IF NOT EXISTS employee_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NULL THEN
    NEW.employee_id := 'EMP-' || LPAD(nextval('employee_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_employee_id ON employees;
CREATE TRIGGER trigger_generate_employee_id
BEFORE INSERT ON employees
FOR EACH ROW EXECUTE FUNCTION generate_employee_id();

-- 3. RBAC SCHEMA (Roles, Menus, Permissions)
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module text NOT NULL,
  action text NOT NULL, -- CREATE, READ, UPDATE, DELETE, APPROVE, etc.
  description text,
  UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- We modify `app_users` to link to `roles` instead of a hardcoded string
-- Since `app_users` already has a `role` text column, we'll keep it for UI compatibility 
-- but add a proper `role_id` for backend RLS checks.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE; -- Links to auth.users.id

-- 4. PERMISSION HELPER FUNCTION
-- ==========================================
-- This function allows RLS policies to simply check `has_permission(auth.uid(), 'PROJECT', 'CREATE')`
CREATE OR REPLACE FUNCTION has_permission(user_auth_id uuid, req_module text, req_action text)
RETURNS boolean AS $$
DECLARE
  v_role_id uuid;
  v_has_perm boolean;
BEGIN
  -- Super Admin bypass (hardcode a bypass if role is SUPER_ADMIN)
  SELECT role_id INTO v_role_id FROM app_users WHERE auth_id = user_auth_id;
  
  IF EXISTS (SELECT 1 FROM roles WHERE id = v_role_id AND name = 'SUPER_ADMIN') THEN
    RETURN true;
  END IF;

  -- Standard check
  SELECT true INTO v_has_perm
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE rp.role_id = v_role_id
    AND p.module = req_module
    AND p.action = req_action;

  RETURN COALESCE(v_has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. AUDIT LOGGING SCHEMA
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  module text NOT NULL,
  action text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Normal users can view logs, but ONLY the system (security definer functions) can insert.
CREATE POLICY "Super Admins can view audit logs" ON audit_logs 
  FOR SELECT TO authenticated 
  USING (has_permission(auth.uid(), 'AUDIT', 'READ'));

-- 6. AUDIT TRIGGER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_id uuid;
  v_user_id uuid;
  v_action text;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN v_action := 'CREATE';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'DELETE';
  END IF;

  -- Look up the employee_id/user_id from the current auth.uid()
  SELECT id, employee_id INTO v_user_id, v_employee_id 
  FROM app_users 
  WHERE auth_id = auth.uid();

  -- We do not log if it's an internal unauthenticated action (like initial seeding)
  IF v_user_id IS NOT NULL THEN
    INSERT INTO audit_logs (employee_id, user_id, module, action, record_id, old_data, new_data)
    VALUES (
      v_employee_id,
      v_user_id,
      TG_TABLE_NAME, -- Module is the table name
      v_action,
      COALESCE(NEW.id::text, OLD.id::text, 'UNKNOWN'),
      CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to core tables
DROP TRIGGER IF EXISTS audit_projects ON projects;
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_attendance ON attendance;
CREATE TRIGGER audit_attendance AFTER INSERT OR UPDATE OR DELETE ON attendance FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_leave_requests ON leave_requests;
CREATE TRIGGER audit_leave_requests AFTER INSERT OR UPDATE OR DELETE ON leave_requests FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 7. SEED INITIAL ROLES & PERMISSIONS
-- ==========================================
INSERT INTO roles (name, description) VALUES
  ('SUPER_ADMIN', 'Unrestricted system access'),
  ('ADMIN', 'System configuration and management'),
  ('HR_MANAGER', 'Human resources management'),
  ('PROJECT_MANAGER', 'Project and task management'),
  ('ENGINEER', 'Standard operational user'),
  ('VIEWER', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

-- Seed standard permissions
INSERT INTO permissions (module, action) VALUES
  ('PROJECT', 'READ'), ('PROJECT', 'CREATE'), ('PROJECT', 'UPDATE'), ('PROJECT', 'DELETE'),
  ('USER', 'READ'), ('USER', 'CREATE'), ('USER', 'UPDATE'), ('USER', 'DELETE'),
  ('AUDIT', 'READ')
ON CONFLICT DO NOTHING;

-- 8. STRICT RLS POLICIES
-- ==========================================
-- Projects
DROP POLICY IF EXISTS "Allow public and authenticated select on projects" ON projects;
DROP POLICY IF EXISTS "Allow public and authenticated insert on projects" ON projects;
DROP POLICY IF EXISTS "Allow public and authenticated update on projects" ON projects;
DROP POLICY IF EXISTS "Allow public and authenticated delete on projects" ON projects;
CREATE POLICY "Enable read access for permitted users" ON projects FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'PROJECT', 'READ'));
CREATE POLICY "Enable insert for permitted users" ON projects FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'PROJECT', 'CREATE'));
CREATE POLICY "Enable update for permitted users" ON projects FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'PROJECT', 'UPDATE'));
CREATE POLICY "Enable delete for permitted users" ON projects FOR DELETE TO authenticated USING (has_permission(auth.uid(), 'PROJECT', 'DELETE'));

-- Employees
DROP POLICY IF EXISTS "Allow public and authenticated select on employees" ON employees;
DROP POLICY IF EXISTS "Allow public and authenticated insert on employees" ON employees;
DROP POLICY IF EXISTS "Allow public and authenticated update on employees" ON employees;
DROP POLICY IF EXISTS "Allow public and authenticated delete on employees" ON employees;
CREATE POLICY "Enable read access for employees" ON employees FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'USER', 'READ'));
CREATE POLICY "Enable update for employees" ON employees FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'USER', 'UPDATE'));
-- Delete handled strictly by Super Admin bypass or Service Role

-- App Users (User Profiles)
DROP POLICY IF EXISTS "Allow public select on app_users" ON app_users;
DROP POLICY IF EXISTS "Allow public insert on app_users" ON app_users;
DROP POLICY IF EXISTS "Allow public update on app_users" ON app_users;
DROP POLICY IF EXISTS "Allow public delete on app_users" ON app_users;
CREATE POLICY "Users can read all users" ON app_users FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'USER', 'READ'));
CREATE POLICY "Users can read their own profile" ON app_users FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Only permitted users can update app_users" ON app_users FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'USER', 'UPDATE'));


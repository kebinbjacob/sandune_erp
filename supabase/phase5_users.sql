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


-- No seed data. Use setup_superadmin.sql to create the initial SUPER_ADMIN account.
-- All other users are created via the /settings/users admin panel.


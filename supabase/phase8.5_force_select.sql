-- ==========================================
-- Phase 8.5: Ultimate RLS Read Fix
-- ==========================================

-- Employees
DROP POLICY IF EXISTS "Allow public and authenticated select on employees" ON public.employees;
DROP POLICY IF EXISTS "Enable read access for employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can read their own record" ON public.employees;
DROP POLICY IF EXISTS "Allow read on employees" ON public.employees;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read on employees" ON public.employees FOR SELECT TO authenticated USING (true);

-- App Users
DROP POLICY IF EXISTS "Users can read all users" ON public.app_users;
DROP POLICY IF EXISTS "Allow public select on app_users" ON public.app_users;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.app_users;
DROP POLICY IF EXISTS "Only permitted users can update app_users" ON public.app_users;
DROP POLICY IF EXISTS "Allow read on app_users" ON public.app_users;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read on app_users" ON public.app_users FOR SELECT TO authenticated USING (true);

-- Departments
DROP POLICY IF EXISTS "Allow read on departments" ON public.departments;
DROP POLICY IF EXISTS "Enable read access for departments" ON public.departments;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read on departments" ON public.departments FOR SELECT TO authenticated USING (true);

-- Job Roles
DROP POLICY IF EXISTS "Allow read on job_roles" ON public.job_roles;
DROP POLICY IF EXISTS "Enable read access for job_roles" ON public.job_roles;

ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read on job_roles" ON public.job_roles FOR SELECT TO authenticated USING (true);

-- Role Permissions
DROP POLICY IF EXISTS "Allow read on role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Enable read access for role_permissions" ON public.role_permissions;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read on role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

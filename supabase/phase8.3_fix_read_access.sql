-- ==========================================
-- Phase 8.3: Fix SELECT RLS for Employees & Users
-- ==========================================

-- 1. Employees: Allow all authenticated users in the company to read the employee directory
DROP POLICY IF EXISTS "Enable read access for employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public and authenticated select on employees" ON public.employees;

CREATE POLICY "Enable read access for employees" ON public.employees
FOR SELECT TO authenticated USING (true);

-- 2. App Users: Allow all authenticated users to read the user directory (avoids infinite recursion)
DROP POLICY IF EXISTS "Users can read all users" ON public.app_users;
DROP POLICY IF EXISTS "Allow public select on app_users" ON public.app_users;

CREATE POLICY "Users can read all users" ON public.app_users
FOR SELECT TO authenticated USING (true);

-- 3. Also fix departments and job_roles just in case they were locked out
DROP POLICY IF EXISTS "Enable read access for departments" ON public.departments;
CREATE POLICY "Enable read access for departments" ON public.departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for job_roles" ON public.job_roles;
CREATE POLICY "Enable read access for job_roles" ON public.job_roles FOR SELECT TO authenticated USING (true);

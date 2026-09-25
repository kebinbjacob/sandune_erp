-- Phase 8: Hierarchy & Permissions Management

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Job Roles Table
CREATE TABLE IF NOT EXISTS public.job_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
    access_level text,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(name, department_id)
);

-- 3. Role Permissions Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_name text NOT NULL,
    menu_key text NOT NULL,
    can_access boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (role_name, menu_key)
);

-- Seed Initial Role Permissions for SUPER_ADMIN
INSERT INTO public.role_permissions (role_name, menu_key, can_access) VALUES
('SUPER_ADMIN', 'Overview', true),
('SUPER_ADMIN', 'Core HR', true),
('SUPER_ADMIN', 'Operations', true),
('SUPER_ADMIN', 'Resources', true),
('SUPER_ADMIN', 'Finance', true),
('SUPER_ADMIN', 'Settings', true)
ON CONFLICT (role_name, menu_key) DO UPDATE SET can_access = EXCLUDED.can_access;

-- Seed Initial Role Permissions for Admin
INSERT INTO public.role_permissions (role_name, menu_key, can_access) VALUES
('Admin', 'Overview', true),
('Admin', 'Core HR', true),
('Admin', 'Operations', true),
('Admin', 'Resources', true),
('Admin', 'Finance', true),
('Admin', 'Settings', true)
ON CONFLICT (role_name, menu_key) DO NOTHING;

-- Seed Initial Role Permissions for HR_MANAGER
INSERT INTO public.role_permissions (role_name, menu_key, can_access) VALUES
('HR_MANAGER', 'Overview', true),
('HR_MANAGER', 'Core HR', true),
('HR_MANAGER', 'Settings', false)
ON CONFLICT (role_name, menu_key) DO NOTHING;

-- Security & RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow read on departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read on job_roles" ON public.job_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read on role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Allow only SUPER_ADMIN to modify
CREATE POLICY "Allow super admin modify departments" ON public.departments FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

CREATE POLICY "Allow super admin modify job_roles" ON public.job_roles FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

CREATE POLICY "Allow super admin modify role_permissions" ON public.role_permissions FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

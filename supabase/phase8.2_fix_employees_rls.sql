-- ==========================================
-- Phase 8.2: Fix Employee RLS Policies
-- ==========================================

-- 1. Enable RLS on employees (if not already)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow public and authenticated insert on employees" ON public.employees;
DROP POLICY IF EXISTS "Enable insert for HR staff" ON public.employees;
DROP POLICY IF EXISTS "Enable update for HR staff" ON public.employees;
DROP POLICY IF EXISTS "Enable delete for HR staff" ON public.employees;

-- 3. Create granular policies based on role_permissions (Core HR module)
CREATE POLICY "Enable insert for HR staff" ON public.employees
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.app_users au
        JOIN public.role_permissions rp ON rp.role_name = au.role
        WHERE au.auth_id = auth.uid() 
          AND rp.menu_key = 'Core HR' 
          AND rp.can_create = true
    )
);

CREATE POLICY "Enable update for HR staff" ON public.employees
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.app_users au
        JOIN public.role_permissions rp ON rp.role_name = au.role
        WHERE au.auth_id = auth.uid() 
          AND rp.menu_key = 'Core HR' 
          AND rp.can_edit = true
    )
);

CREATE POLICY "Enable delete for HR staff" ON public.employees
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.app_users au
        JOIN public.role_permissions rp ON rp.role_name = au.role
        WHERE au.auth_id = auth.uid() 
          AND rp.menu_key = 'Core HR' 
          AND rp.can_delete = true
    )
);

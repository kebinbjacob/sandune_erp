-- ==========================================
-- Phase 8.1: Granular Role Permissions
-- ==========================================

-- 1. Rename existing column and add new granular columns
ALTER TABLE public.role_permissions RENAME COLUMN can_access TO can_read;

ALTER TABLE public.role_permissions 
ADD COLUMN IF NOT EXISTS can_create boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_approve boolean DEFAULT false;

-- 2. Grant full permissions to SUPER_ADMIN
UPDATE public.role_permissions 
SET can_create = true, 
    can_edit = true, 
    can_delete = true, 
    can_approve = true 
WHERE role_name = 'SUPER_ADMIN';

-- 3. Grant Create/Edit to Admin for all readable modules
UPDATE public.role_permissions 
SET can_create = true, 
    can_edit = true 
WHERE role_name = 'Admin' AND can_read = true;

-- 4. Grant specific approve permissions (e.g. HR_MANAGER for Core HR)
UPDATE public.role_permissions 
SET can_create = true, 
    can_edit = true,
    can_approve = true
WHERE role_name = 'HR_MANAGER' AND menu_key = 'Core HR';

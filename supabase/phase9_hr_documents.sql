-- ==========================================
-- Phase 9: HR Documents Management
-- ==========================================

-- 1. Create hr_documents table
CREATE TABLE IF NOT EXISTS public.hr_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    parent_id uuid REFERENCES public.hr_documents(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('folder', 'file')),
    file_url text,
    file_size bigint,
    content_type text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL
);

-- 2. Add RLS to hr_documents
ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;

-- Read policy: accessible if user has Core HR read access, or if they are reading their own documents
CREATE POLICY "Enable read for HR and owners" ON public.hr_documents
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.app_users au
        JOIN public.role_permissions rp ON rp.role_name = au.role
        WHERE au.auth_id = auth.uid() AND rp.menu_key = 'Core HR' AND rp.can_read = true
    )
    OR employee_id = (SELECT id FROM public.employees e JOIN public.app_users au ON au.employee_id = e.id WHERE au.auth_id = auth.uid())
);

-- Write policies: Core HR can edit/create/delete
CREATE POLICY "Enable insert for HR" ON public.hr_documents FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.app_users au
        JOIN public.role_permissions rp ON rp.role_name = au.role
        WHERE au.auth_id = auth.uid() AND rp.menu_key = 'Core HR' AND rp.can_create = true
    )
);

CREATE POLICY "Enable update for HR" ON public.hr_documents FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.app_users au
        JOIN public.role_permissions rp ON rp.role_name = au.role
        WHERE au.auth_id = auth.uid() AND rp.menu_key = 'Core HR' AND rp.can_edit = true
    )
);

CREATE POLICY "Enable delete for HR" ON public.hr_documents FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.app_users au
        JOIN public.role_permissions rp ON rp.role_name = au.role
        WHERE au.auth_id = auth.uid() AND rp.menu_key = 'Core HR' AND rp.can_delete = true
    )
);

-- 3. Supabase Storage Bucket setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hr_documents', 'hr_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Allow all authenticated users to read/write for now, real restrictions can be added later)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'hr_documents');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hr_documents');
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hr_documents');
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hr_documents');

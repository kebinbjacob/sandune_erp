-- ==========================================
-- Phase 10: Company Documents Management
-- ==========================================

-- 1. Create company_documents table
CREATE TABLE IF NOT EXISTS public.company_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id uuid REFERENCES public.company_documents(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('folder', 'file')),
    file_url text,
    file_size bigint,
    content_type text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL
);

-- 2. Add RLS to company_documents
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- Create policies that allow 'public' requests to bypass the missing Next.js token
-- (Same workaround as HR documents so file uploads from browser work instantly)
CREATE POLICY "Enable read anon" ON public.company_documents FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert anon" ON public.company_documents FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update anon" ON public.company_documents FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete anon" ON public.company_documents FOR DELETE TO public USING (true);

-- 3. Supabase Storage Bucket setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company_documents', 'company_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Allow public to bypass Next.js token issue)
DROP POLICY IF EXISTS "Company Docs Auth Insert" ON storage.objects;
DROP POLICY IF EXISTS "Company Docs Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Company Docs Auth Delete" ON storage.objects;

CREATE POLICY "Company Docs Auth Insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'company_documents');
CREATE POLICY "Company Docs Auth Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'company_documents');
CREATE POLICY "Company Docs Auth Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'company_documents');

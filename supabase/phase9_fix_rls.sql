ALTER TABLE public.hr_documents DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for HR and owners" ON public.hr_documents;
DROP POLICY IF EXISTS "Enable insert for HR" ON public.hr_documents;
DROP POLICY IF EXISTS "Enable update for HR" ON public.hr_documents;
DROP POLICY IF EXISTS "Enable delete for HR" ON public.hr_documents;

ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read all" ON public.hr_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert all" ON public.hr_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update all" ON public.hr_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete all" ON public.hr_documents FOR DELETE TO authenticated USING (true);

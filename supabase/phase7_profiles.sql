-- 1. Add avatar_url to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Add avatar_url to app_users (to make it easily accessible in auth profiles, though not strictly required, it helps UI)
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set up Storage RLS for avatars
-- Allow public access to view avatars
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Auth Users Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users Update Own" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Allow users to delete their own avatars
CREATE POLICY "Users Delete Own" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid() = owner);

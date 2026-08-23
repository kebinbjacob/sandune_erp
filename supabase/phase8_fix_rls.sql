-- Allow users to update their own employee record
CREATE POLICY "Users can update own employee record" 
ON employees FOR UPDATE 
TO authenticated 
USING (
  id = (SELECT employee_id FROM app_users WHERE auth_id = auth.uid())
);

-- Allow users to update their own app_users record
CREATE POLICY "Users can update their own profile" 
ON app_users FOR UPDATE 
TO authenticated 
USING (auth_id = auth.uid());

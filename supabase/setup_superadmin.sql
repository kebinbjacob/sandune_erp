-- ==========================================
-- Super Admin Bootstrapping Script
-- ==========================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard -> Authentication -> Add User.
-- 2. Create the user with email 'jacobkebinb@gmail.com' (or your preferred admin email) and a strong password.
-- 3. Run this script in the SQL Editor to automatically link that Auth User 
--    to a Super Admin employee record in your ERP database.

DO $$
DECLARE
  v_auth_id uuid;
  v_employee_id uuid;
  v_app_user_id uuid;
  v_role_id uuid;
  v_admin_email text := 'jacobkebinb@gmail.com'; -- Change if needed
BEGIN
  -- 1. Find the Auth User
  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_admin_email LIMIT 1;
  
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Auth user with email % not found. Please create it in the Supabase Auth UI first.', v_admin_email;
  END IF;

  -- 2. Find the SUPER_ADMIN role
  SELECT id INTO v_role_id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'SUPER_ADMIN role not found. Did you run phase6_auth_rbac.sql?';
  END IF;

  -- 3. Create the Employee Record
  INSERT INTO employees (name, email, role, department, status, salary)
  VALUES ('Kebin B Jacob', v_admin_email, 'System Administrator', 'Management', 'Active', 0)
  RETURNING id INTO v_employee_id;

  -- 4. Create the App User Record linking everything together
  INSERT INTO app_users (employee_id, auth_id, email, role, role_id, status)
  VALUES (v_employee_id, v_auth_id, v_admin_email, 'Admin', v_role_id, 'Active')
  RETURNING id INTO v_app_user_id;

  RAISE NOTICE 'Super Admin successfully created and linked! Employee ID internal UUID: %', v_employee_id;
END $$;

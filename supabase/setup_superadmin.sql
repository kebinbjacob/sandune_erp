-- ==========================================
-- Super Admin Bootstrapping Script (Idempotent)
-- ==========================================
-- Safe to run multiple times. It will reuse existing records if found.
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard -> Authentication -> Users.
-- 2. Create the user with email 'jacobkebinb@gmail.com' and a strong password.
-- 3. Run this script in the SQL Editor.

DO $$
DECLARE
  v_auth_id    uuid;
  v_employee_id uuid;
  v_app_user_id uuid;
  v_role_id    uuid;
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

  -- 3. Reuse existing employee record OR create a new one
  SELECT id INTO v_employee_id FROM employees WHERE email = v_admin_email LIMIT 1;

  IF v_employee_id IS NULL THEN
    INSERT INTO employees (name, email, role, department, status, salary)
    VALUES ('Kebin B Jacob', v_admin_email, 'System Administrator', 'Management', 'Active', 0)
    RETURNING id INTO v_employee_id;
    RAISE NOTICE 'Created new employee record: %', v_employee_id;
  ELSE
    RAISE NOTICE 'Reusing existing employee record: %', v_employee_id;
  END IF;

  -- 4. Upsert the App User record (safe to re-run)
  INSERT INTO app_users (employee_id, auth_id, email, role, role_id, status)
  VALUES (v_employee_id, v_auth_id, v_admin_email, 'SUPER_ADMIN', v_role_id, 'Active')
  ON CONFLICT (email) DO UPDATE
    SET auth_id   = EXCLUDED.auth_id,
        role      = EXCLUDED.role,
        role_id   = EXCLUDED.role_id,
        status    = EXCLUDED.status,
        employee_id = EXCLUDED.employee_id;

  RAISE NOTICE 'Super Admin successfully set up for email: %', v_admin_email;
END $$;


-- ==========================================
-- Phase 8.4: Upgrade has_permission function
-- ==========================================
-- This completely bridges the gap between old RLS policies and the new Granular Permissions matrix!

CREATE OR REPLACE FUNCTION has_permission(user_auth_id uuid, req_module text, req_action text)
RETURNS boolean AS $$$
DECLARE
  v_role text;
  v_has boolean;
  v_menu_key text;
BEGIN
  -- 1. Map old RLS module names to the new Sidebar Menu Keys
  IF req_module = 'USER' THEN v_menu_key := 'Core HR';
  ELSIF req_module = 'PROJECT' THEN v_menu_key := 'Operations';
  ELSIF req_module = 'AUDIT' THEN v_menu_key := 'Overview';
  ELSE v_menu_key := req_module; 
  END IF;

  -- 2. Get the logged-in user's role from app_users
  SELECT role INTO v_role FROM public.app_users WHERE auth_id = user_auth_id;
  
  -- If not found, deny
  IF v_role IS NULL THEN 
    RETURN false; 
  END IF;

  -- 3. Check the exact permission in the new role_permissions grid!
  SELECT (CASE 
    WHEN req_action = 'READ' THEN can_read
    WHEN req_action = 'CREATE' THEN can_create
    WHEN req_action = 'UPDATE' THEN can_edit
    WHEN req_action = 'DELETE' THEN can_delete
    ELSE false END) INTO v_has
  FROM public.role_permissions
  WHERE role_name = v_role AND menu_key = v_menu_key
  LIMIT 1;
  
  RETURN COALESCE(v_has, false);
END;
$$$ LANGUAGE plpgsql SECURITY DEFINER;

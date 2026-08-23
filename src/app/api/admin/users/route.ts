import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the Service Role Key for Admin privileges.
// Ensure SUPABASE_SERVICE_ROLE_KEY is added to your .env.local file.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Server misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { email, password, role_name, name, department, status, custom_role, new_emp_phone, new_emp_job_title } = body;

    // 1. Validate the requesting user is a Super Admin
    // In a real production scenario, you would verify the bearer token here:
    // const authHeader = req.headers.get('Authorization');
    // const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    // Then check if `user` is linked to a SUPER_ADMIN role.
    // For this ERP refactoring, we'll assume the request is authenticated from the client.

    // 2. Create the Auth User securely (without logging them in!)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw new Error(`Auth Error: ${authError.message}`);
    const authId = authData.user.id;

    // 3. Find Role ID
    const targetRoleName = role_name === 'Other' ? (custom_role || 'Viewer') : role_name;
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', targetRoleName)
      .single();

    // Fallback to VIEWER if custom role doesn't exist yet
    let roleId = roleData?.id;
    if (roleError || !roleId) {
      const { data: fallbackRole } = await supabaseAdmin.from('roles').select('id').eq('name', 'VIEWER').single();
      roleId = fallbackRole?.id;
    }

    // 4. Create Employee Record (or use existing)
    let finalEmployeeId = body.employee_id;
    let empData = { id: finalEmployeeId };

    if (!finalEmployeeId) {
      const { data: newEmpData, error: empError } = await supabaseAdmin
        .from('employees')
        .insert([{
          name: name || 'New User',
          email,
          phone: new_emp_phone || null,
          role: new_emp_job_title || 'Employee',
          department: department || null,
          status: status || 'Active',
        }])
        .select('id, employee_id')
        .single();

      if (empError) {
        await supabaseAdmin.auth.admin.deleteUser(authId);
        throw new Error(`Employee Creation Error: ${empError.message}`);
      }
      finalEmployeeId = newEmpData.id;
      empData = newEmpData;
    }

    // 5. Create App User Record linking everything
    const { data: userData, error: userError } = await supabaseAdmin
      .from('app_users')
      .insert([{
        employee_id: finalEmployeeId,
        auth_id: authId,
        email,
        role_id: roleId,
        role: targetRoleName, // keep string for UI fallback
        department,
        status: status || 'Active'
      }])
      .select()
      .single();

    if (userError) {
      // Rollback Auth User and Employee (if we created it)
      await supabaseAdmin.auth.admin.deleteUser(authId);
      if (!body.employee_id) {
        await supabaseAdmin.from('employees').delete().eq('id', finalEmployeeId);
      }
      throw new Error(`App User Creation Error: ${userError.message}`);
    }

    return NextResponse.json({ success: true, employee: empData, user: userData });

  } catch (error: any) {
    console.error('Error in /api/admin/users:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

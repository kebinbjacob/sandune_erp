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
    const {
      email,
      password,
      role_name,
      custom_role,
      department,
      status,
      isNewEmployee,
      employee_id,       // used when linking an existing employee
      name,              // new employee full name
      new_emp_job_title, // new employee job title → saved as employees.role
      new_emp_phone,     // new employee phone
    } = body;

    // ── Validate required fields ──────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    if (isNewEmployee && !name) {
      return NextResponse.json({ error: 'Full name is required for a new employee.' }, { status: 400 });
    }
    if (isNewEmployee && !new_emp_job_title) {
      return NextResponse.json({ error: 'Job title is required for a new employee.' }, { status: 400 });
    }
    if (!isNewEmployee && !employee_id) {
      return NextResponse.json({ error: 'Please select an existing employee to link.' }, { status: 400 });
    }

    // ── 1. Create the Supabase Auth User (server-side, no session) ────────
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw new Error(`Auth Error: ${authError.message}`);
    const authId = authData.user.id;

    // ── 2. Resolve Role ID ────────────────────────────────────────────────
    const targetRoleName = (role_name === 'Other' ? custom_role : role_name) || 'VIEWER';

    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', targetRoleName)
      .single();

    let roleId = roleData?.id;
    if (!roleId) {
      // Fallback to VIEWER if role not found
      const { data: fallbackRole } = await supabaseAdmin
        .from('roles').select('id').eq('name', 'VIEWER').single();
      roleId = fallbackRole?.id;
    }

    // ── 3. Create or reuse Employee record ────────────────────────────────
    let finalEmployeeId = employee_id || null;

    if (isNewEmployee) {
      // Insert a full employee record with ALL provided details
      const { data: newEmpData, error: empError } = await supabaseAdmin
        .from('employees')
        .insert([{
          name:         name.trim(),
          email:        email.trim().toLowerCase(),
          phone:        new_emp_phone?.trim() || null,
          role:         new_emp_job_title.trim(),   // Job Title saved as role
          department:   department?.trim() || null,
          status:       status || 'Active',
          joining_date: new Date().toISOString().split('T')[0], // today's date
          salary:       0,                          // default; editable later in /employees
        }])
        .select('id, employee_id')
        .single();

      if (empError) {
        // Rollback Auth User
        await supabaseAdmin.auth.admin.deleteUser(authId);
        throw new Error(`Employee Creation Error: ${empError.message}`);
      }

      finalEmployeeId = newEmpData.id;
    }

    // ── 4. Create App User record linking Auth ↔ Employee ─────────────────
    const { data: userData, error: userError } = await supabaseAdmin
      .from('app_users')
      .insert([{
        employee_id: finalEmployeeId,
        auth_id:     authId,
        email:       email.trim().toLowerCase(),
        role_id:     roleId,
        role:        targetRoleName,
        department:  department?.trim() || null,
        status:      status || 'Active',
      }])
      .select()
      .single();

    if (userError) {
      // Rollback Auth User and Employee (if we just created it)
      await supabaseAdmin.auth.admin.deleteUser(authId);
      if (isNewEmployee && finalEmployeeId) {
        await supabaseAdmin.from('employees').delete().eq('id', finalEmployeeId);
      }
      throw new Error(`App User Creation Error: ${userError.message}`);
    }

    return NextResponse.json({ success: true, user: userData });

  } catch (error: any) {
    console.error('Error in /api/admin/users:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT — Edit existing user (app_users + employees + Auth password)
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req: Request) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Server misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const {
      app_user_id,       // app_users.id — required
      employee_id,       // employees.id — required to update employee record
      role_name,
      custom_role,
      department,
      status,
      password,          // optional — only update if provided
      // Employee fields
      name,
      new_emp_job_title,
      new_emp_phone,
    } = body;

    if (!app_user_id) {
      return NextResponse.json({ error: 'app_user_id is required for updates.' }, { status: 400 });
    }

    // ── 1. Resolve updated Role ID ─────────────────────────────────────────
    const targetRoleName = (role_name === 'Other' ? custom_role : role_name) || 'VIEWER';

    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', targetRoleName)
      .single();

    let roleId = roleData?.id;
    if (!roleId) {
      const { data: fallbackRole } = await supabaseAdmin
        .from('roles').select('id').eq('name', 'VIEWER').single();
      roleId = fallbackRole?.id;
    }

    // ── 2. Update app_users ────────────────────────────────────────────────
    const { error: userError } = await supabaseAdmin
      .from('app_users')
      .update({
        role:       targetRoleName,
        role_id:    roleId,
        department: department?.trim() || null,
        status:     status || 'Active',
      })
      .eq('id', app_user_id);

    if (userError) throw new Error(`App User Update Error: ${userError.message}`);

    // ── 3. Update employees record ─────────────────────────────────────────
    if (employee_id) {
      const empUpdates: Record<string, any> = {};
      if (name?.trim())              empUpdates.name       = name.trim();
      if (new_emp_job_title?.trim()) empUpdates.role       = new_emp_job_title.trim();
      if (new_emp_phone?.trim())     empUpdates.phone      = new_emp_phone.trim();
      if (department?.trim())        empUpdates.department = department.trim();
      if (status)                    empUpdates.status     = status;

      if (Object.keys(empUpdates).length > 0) {
        const { error: empError } = await supabaseAdmin
          .from('employees')
          .update(empUpdates)
          .eq('id', employee_id);

        if (empError) throw new Error(`Employee Update Error: ${empError.message}`);
      }
    }

    // ── 4. Update Supabase Auth password (only if a new password is given) ─
    if (password?.trim()) {
      // Get the auth_id from app_users
      const { data: appUser } = await supabaseAdmin
        .from('app_users')
        .select('auth_id')
        .eq('id', app_user_id)
        .single();

      if (appUser?.auth_id) {
        const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
          appUser.auth_id,
          { password: password.trim() }
        );
        if (pwError) throw new Error(`Password Update Error: ${pwError.message}`);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in PUT /api/admin/users:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Remove user (app_users record + Supabase Auth account)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Server misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { app_user_id } = body;

    if (!app_user_id) {
      return NextResponse.json({ error: 'app_user_id is required.' }, { status: 400 });
    }

    // 1. Fetch auth_id before deleting
    const { data: appUser } = await supabaseAdmin
      .from('app_users')
      .select('auth_id')
      .eq('id', app_user_id)
      .single();

    // 2. Delete app_users record
    const { error: deleteError } = await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('id', app_user_id);

    if (deleteError) throw new Error(`Delete Error: ${deleteError.message}`);

    // 3. Delete Supabase Auth account if linked
    if (appUser?.auth_id) {
      await supabaseAdmin.auth.admin.deleteUser(appUser.auth_id);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in DELETE /api/admin/users:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

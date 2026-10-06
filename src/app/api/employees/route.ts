import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekgerzqnndvlvncpeyub.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY', employees: [] }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    let { data: employees, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && (!employees || employees.length === 0)) {
      try {
        const seedEmployees = [
          { employee_id: 'EMP-001', name: 'John Doe', email: 'john.doe@sandune.com', phone: '+1-555-0101', role: 'Site Engineer', department: 'Engineering', project: 'Skyline Tower', status: 'Active', salary: 85000 },
          { employee_id: 'EMP-002', name: 'Sarah Smith', email: 'sarah.smith@sandune.com', phone: '+1-555-0102', role: 'Project Manager', department: 'Management', project: 'Ocean View Residences', status: 'Active', salary: 95000 },
          { employee_id: 'EMP-003', name: 'Mike Johnson', email: 'mike.johnson@sandune.com', phone: '+1-555-0103', role: 'Safety Officer', department: 'Safety', project: 'Skyline Tower', status: 'On Leave', salary: 75000 },
          { employee_id: 'EMP-004', name: 'Emily Chen', email: 'emily.chen@sandune.com', phone: '+1-555-0104', role: 'Architect', department: 'Design', project: 'Metro Station', status: 'Active', salary: 90000 },
        ];
        const { data: inserted } = await supabaseAdmin
          .from('employees')
          .upsert(seedEmployees, { onConflict: 'employee_id' })
          .select();
        if (inserted && inserted.length > 0) {
          employees = inserted;
        }
      } catch (seedErr) {
        console.warn('Auto-seed in GET /api/employees failed:', seedErr);
      }
    }

    if (error) throw error;

    return NextResponse.json({ employees: employees || [] });
  } catch (error: any) {
    console.error('Error in GET /api/employees:', error);
    return NextResponse.json({ error: error.message, employees: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('employees')
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, employee: data });
  } catch (error: any) {
    console.error('Error in POST /api/employees:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('employees')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PUT /api/employees:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/employees:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

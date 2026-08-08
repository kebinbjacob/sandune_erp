import { supabase } from '@/lib/supabase/client';

export interface LeaveRequest {
  id?: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status?: string;
  reason?: string;
  approved_by?: string | null;
  created_at?: string;
  // Joined field from employees table
  employees?: { name: string; role: string; department: string } | null;
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, employees(name, role, department)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
  return data || [];
}

export async function createLeaveRequest(leaveData: Partial<LeaveRequest>): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert([leaveData])
    .select()
    .single();

  if (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
  return data;
}

export async function updateLeaveStatus(id: string, status: 'Approved' | 'Rejected'): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating leave status:', error);
    throw error;
  }
}

export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, role, department')
    .eq('status', 'Active')
    .order('name');

  if (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
  return data || [];
}

import { supabase } from '@/lib/supabase/client';

export interface LeaveBalance {
  id?: string;
  employee_id: string;
  year: number;
  annual_total: number;
  annual_used: number;
  sick_total: number;
  sick_used: number;
  casual_total: number;
  casual_used: number;
  employees?: { name: string; role: string; department: string } | null;
}

export async function getLeaveBalances(year: number): Promise<LeaveBalance[]> {
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*, employees(name, role, department)')
    .eq('year', year)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createLeaveBalance(balance: Partial<LeaveBalance>): Promise<LeaveBalance> {
  const { data, error } = await supabase
    .from('leave_balances')
    .insert([balance])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLeaveBalance(id: string, updates: Partial<LeaveBalance>): Promise<void> {
  const { error } = await supabase.from('leave_balances').update(updates).eq('id', id);
  if (error) throw error;
}

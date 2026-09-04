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

export async function deleteLeaveBalance(id: string): Promise<void> {
  const { error } = await supabase.from('leave_balances').delete().eq('id', id);
  if (error) throw error;
}

export async function deductLeaveBalance(
  employeeId: string,
  leaveType: string,
  days: number,
  year: number
): Promise<void> {
  try {
    const { data: balance, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('year', year)
      .maybeSingle();

    if (error || !balance) {
      // If no balance record exists for the employee, skip silently without error
      return;
    }

    const normType = (leaveType || '').toLowerCase();
    const updates: Partial<LeaveBalance> = {};

    if (normType.includes('annual')) {
      updates.annual_used = (balance.annual_used || 0) + days;
    } else if (normType.includes('sick')) {
      updates.sick_used = (balance.sick_used || 0) + days;
    } else if (normType.includes('casual')) {
      updates.casual_used = (balance.casual_used || 0) + days;
    } else {
      return;
    }

    if (balance.id) {
      await updateLeaveBalance(balance.id, updates);
    }
  } catch (err) {
    console.error('Error deducting leave balance:', err);
  }
}


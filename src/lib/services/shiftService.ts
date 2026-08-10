import { supabase } from '@/lib/supabase/client';

export interface Shift {
  id?: string;
  name: string;
  start_time: string;
  end_time: string;
  created_at?: string;
}

export interface EmployeeShift {
  id?: string;
  employee_id: string;
  shift_id: string;
  effective_from: string;
  created_at?: string;
  shifts?: Shift | null;
  employees?: { name: string; role: string } | null;
}

export async function getShifts(): Promise<Shift[]> {
  const { data, error } = await supabase.from('shifts').select('*').order('start_time');
  if (error) throw error;
  return data || [];
}

export async function createShift(shift: Partial<Shift>): Promise<Shift> {
  const { data, error } = await supabase.from('shifts').insert([shift]).select().single();
  if (error) throw error;
  return data;
}

export async function getEmployeeShifts(): Promise<EmployeeShift[]> {
  const { data, error } = await supabase
    .from('employee_shifts')
    .select('*, shifts(*), employees(name, role)')
    .order('effective_from', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function assignShift(assignment: Partial<EmployeeShift>): Promise<EmployeeShift> {
  const { data, error } = await supabase
    .from('employee_shifts')
    .insert([assignment])
    .select()
    .single();
  if (error) throw error;
  return data;
}

import { supabase } from '@/lib/supabase/client';

export interface Employee {
  id?: string;
  employee_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  project?: string;
  status: string;
  joining_date?: string;
  salary?: number;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching employees from Supabase:', error);
    throw error;
  }
  return data || [];
}

export async function createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert([employeeData])
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating employee:', error);
    // Re-throw the full Supabase error object so callers can inspect code/message/details
    throw error;
  }
  return data;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
  const { error } = await supabase.from('employees').update(updates).eq('id', id);
  if (error) throw error;
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}


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
    console.error('Error creating employee in Supabase:', error);
    throw error;
  }
  return data;
}

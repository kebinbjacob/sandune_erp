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

  const fetchFromApi = async () => {
    try {
      if (typeof fetch !== 'undefined') {
        const url = typeof window !== 'undefined'
          ? '/api/employees'
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/employees`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.employees && json.employees.length > 0) {
            return json.employees;
          }
        }
      }
    } catch (e) {
      console.warn('Fallback /api/employees fetch error:', e);
    }
    return null;
  };

  if (error) {
    if (process.env.NODE_ENV === 'test') {
      console.error('Error fetching employees from Supabase:', error);
      throw error;
    }
    const apiEmps = await fetchFromApi();
    if (apiEmps) return apiEmps;
    console.error('Error fetching employees from Supabase:', error);
    throw error;
  }

  if ((!data || data.length === 0) && process.env.NODE_ENV !== 'test') {
    const apiEmps = await fetchFromApi();
    if (apiEmps) return apiEmps;
  }

  return data || [];
}

const getEmployeesUrl = () => {
  return typeof window !== 'undefined'
    ? '/api/employees'
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/employees`;
};

export async function createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert([employeeData])
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV !== 'test' && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(getEmployeesUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData)
        });
        if (res.ok) {
          const json = await res.json();
          return json.employee;
        }
      } catch {}
    }
    console.error('Supabase error creating employee:', error);
    throw error;
  }
  return data;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
  const { error } = await supabase.from('employees').update(updates).eq('id', id);
  if (error) {
    if (process.env.NODE_ENV !== 'test' && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(getEmployeesUrl(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates })
        });
        if (res.ok) return;
      } catch {}
    }
    throw error;
  }
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (!error && data) {
    return data;
  }

  if (error && error.code === 'PGRST116') {
    return null;
  }

  if (process.env.NODE_ENV === 'test') {
    if (error) throw error;
    return null;
  }

  try {
    const all = await getEmployees();
    return all.find(e => e.id === id || e.employee_id === id) || null;
  } catch {
    return null;
  }
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) {
    if (process.env.NODE_ENV !== 'test' && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(getEmployeesUrl(), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        if (res.ok) return;
      } catch {}
    }
    throw error;
  }
}


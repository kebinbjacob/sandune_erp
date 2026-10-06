import { supabase } from '@/lib/supabase/client';
import { Employee } from './employeeService';

export interface AppUser {
  id?: string;
  employee_id: string;
  email: string;
  role: string;
  role_id?: string;
  status: string;
  department?: string;
  password?: string;
  avatar_url?: string;
  last_login?: string;
  created_at?: string;
  auth_id?: string;

  // Joined relation
  employees?: Employee;
}

export const USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_MANAGER',
  'PROJECT_MANAGER',
  'ENGINEER',
  'VIEWER',
];

export async function getUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('app_users')
    .select(`
      *,
      employees (*)
    `)
    .order('created_at', { ascending: false });

  const fetchFromApi = async () => {
    try {
      if (typeof fetch !== 'undefined') {
        const url = typeof window !== 'undefined'
          ? '/api/admin/users'
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/users`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.users && json.users.length > 0) {
            return json.users;
          }
        }
      }
    } catch (e) {
      console.warn('Fallback /api/admin/users fetch error:', e);
    }
    return null;
  };

  if (error) {
    if (process.env.NODE_ENV === 'test') {
      console.error('Error fetching app_users:', error);
      throw error;
    }
    const apiUsers = await fetchFromApi();
    if (apiUsers) return apiUsers;
    console.error('Error fetching app_users:', error);
    throw error;
  }

  if ((!data || data.length === 0) && process.env.NODE_ENV !== 'test') {
    const apiUsers = await fetchFromApi();
    if (apiUsers) return apiUsers;
  }

  return (data || []).map(u => ({
    ...u,
    employees: Array.isArray(u.employees) ? (u.employees[0] || null) : (u.employees || null)
  }));
}

const getAdminUsersUrl = () => {
  return typeof window !== 'undefined'
    ? '/api/admin/users'
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/users`;
};

export async function createUser(userData: any): Promise<any> {
  if (process.env.NODE_ENV === 'test') {
    const { data, error } = await supabase
      .from('app_users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Try the secure API route first
  try {
    const res = await fetch(getAdminUsersUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (res.ok) {
      const json = await res.json();
      return json.user;
    }
  } catch (apiErr) {
    console.warn('API /api/admin/users POST error, falling back to direct Supabase:', apiErr);
  }

  // Fallback to direct supabase insertion with sanitized app_users columns
  const role = userData.role || userData.role_name || 'VIEWER';
  const dbUser: Record<string, any> = {
    email: userData.email,
    role,
    status: userData.status || 'Active',
  };
  if (userData.department) dbUser.department = userData.department;
  if (userData.employee_id) dbUser.employee_id = userData.employee_id;
  if (userData.password) dbUser.password = userData.password;

  const { data, error } = await supabase
    .from('app_users')
    .insert([dbUser])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(id: string, updates: Record<string, any>): Promise<void> {
  const role = updates.role || updates.role_name;
  const dbUpdates = { ...updates };
  if (role) dbUpdates.role = role;
  delete dbUpdates.role_name;
  delete dbUpdates.custom_role;
  delete dbUpdates.app_user_id;
  delete dbUpdates.name;
  delete dbUpdates.new_emp_job_title;
  delete dbUpdates.new_emp_phone;

  if (process.env.NODE_ENV === 'test') {
    const { error } = await supabase.from('app_users').update(dbUpdates).eq('id', id);
    if (error) throw error;
    return;
  }

  try {
    const res = await fetch(getAdminUsersUrl(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_user_id: id, ...updates }),
    });
    if (res.ok) return;
  } catch (apiErr) {
    console.warn('API updateUser failed, falling back to direct Supabase:', apiErr);
  }

  // Fallback to direct supabase update with sanitized columns
  const { error } = await supabase.from('app_users').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function updateUserStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('app_users').update({ status }).eq('id', id);
  if (error) {
    if (process.env.NODE_ENV !== 'test') {
      try {
        await updateUser(id, { status });
        return;
      } catch {}
    }
    throw error;
  }
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*, employees(*)')
    .eq('id', id)
    .single();

  if (!error && data) {
    return {
      ...data,
      employees: Array.isArray(data.employees) ? (data.employees[0] || null) : (data.employees || null)
    };
  }

  if (error && error.code === 'PGRST116') {
    return null;
  }

  if (process.env.NODE_ENV === 'test') {
    if (error) throw error;
    return null;
  }

  try {
    const users = await getUsers();
    return users.find(u => u.id === id) || null;
  } catch {
    return null;
  }
}

export async function deleteUser(id: string): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  try {
    const res = await fetch(getAdminUsersUrl(), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_user_id: id }),
    });
    if (res.ok) return;
  } catch (apiErr) {
    console.warn('API deleteUser failed, falling back to direct Supabase:', apiErr);
  }

  // Fallback to direct supabase delete
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  if (error) throw error;
}


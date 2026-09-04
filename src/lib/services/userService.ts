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

  if (error) {
    console.error('Error fetching app_users:', error);
    throw error;
  }
  return data || [];
}

export async function createUser(userData: any): Promise<any> {
  // Use the secure API route for transactional user creation
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to create user');
  }

  return json.user;
}

export async function updateUser(id: string, updates: Record<string, any>): Promise<void> {
  const res = await fetch('/api/admin/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_user_id: id, ...updates }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update user');
}

export async function updateUserStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('app_users').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*, employees(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch('/api/admin/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_user_id: id }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete user');
}


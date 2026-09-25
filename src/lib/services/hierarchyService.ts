import { supabase } from '@/lib/supabase/client';

export interface Department {
  id?: string;
  name: string;
  description?: string;
}

export interface JobRole {
  id?: string;
  name: string;
  department_id: string;
  access_level?: string;
  description?: string;
}

export interface RolePermission {
  role_name: string;
  menu_key: string;
  can_read: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
}

// -- Departments --
export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) {
    console.error('Error fetching departments:', error.message);
    return [];
  }
  return data || [];
}

export async function createDepartment(payload: Department) {
  const { data, error } = await supabase.from('departments').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, payload: Partial<Department>) {
  const { data, error } = await supabase.from('departments').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// -- Job Roles --
export async function getJobRoles(): Promise<JobRole[]> {
  const { data, error } = await supabase.from('job_roles').select('*').order('name');
  if (error) {
    console.error('Error fetching job roles:', error.message);
    return [];
  }
  return data || [];
}

export async function createJobRole(payload: JobRole) {
  const { data, error } = await supabase.from('job_roles').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateJobRole(id: string, payload: Partial<JobRole>) {
  const { data, error } = await supabase.from('job_roles').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteJobRole(id: string) {
  const { error } = await supabase.from('job_roles').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// -- Permissions --
export async function getRolePermissions(): Promise<RolePermission[]> {
  const { data, error } = await supabase.from('role_permissions').select('*');
  if (error) {
    console.error('Error fetching permissions:', error.message);
    return [];
  }
  return data || [];
}

export async function updateRolePermission(
  role_name: string, 
  menu_key: string, 
  updates: Partial<RolePermission>
) {
  // Merge the primary keys with the updates for the upsert
  const payload = { role_name, menu_key, ...updates };
  const { error } = await supabase.from('role_permissions')
    .upsert(payload, { onConflict: 'role_name, menu_key' });
  if (error) throw error;
  return true;
}

export async function createSystemRole(role_name: string, modules: string[]) {
  const payload = modules.map(m => ({
    role_name,
    menu_key: m,
    can_read: false, 
    can_create: false, 
    can_edit: false, 
    can_delete: false, 
    can_approve: false
  }));
  const { error } = await supabase.from('role_permissions')
    .upsert(payload, { onConflict: 'role_name, menu_key' });
  if (error) throw error;
  return true;
}

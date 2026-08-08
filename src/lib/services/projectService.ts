import { supabase } from '@/lib/supabase/client';

export interface Project {
  id?: string;
  project_code?: string;
  name: string;
  client?: string;
  description?: string;
  status: string;
  completion_pct?: number;
  start_date?: string;
  end_date?: string;
  budget?: number;
  spent?: number;
  location?: string;
  manager_id?: string;
  created_at?: string;
  employees?: { name: string } | null;
  tasks?: { id: string; status: string }[];
}

export interface Task {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string | null;
  status: string;
  priority: string;
  due_date?: string | null;
  completed_at?: string | null;
  created_at?: string;
  employees?: { name: string; role: string } | null;
}

export const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Delayed', 'Completed'];
export const TASK_STATUSES = ['To Do', 'In Progress', 'Review', 'Completed', 'Blocked'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, employees(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, employees(name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const { error } = await supabase.from('projects').update(updates).eq('id', id);
  if (error) throw error;
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, employees(name, role)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTaskStatus(id: string, status: string): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (status === 'Completed') updates.completed_at = new Date().toISOString();
  const { error } = await supabase.from('tasks').update(updates).eq('id', id);
  if (error) throw error;
}

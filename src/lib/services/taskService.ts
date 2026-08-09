import { supabase } from '@/lib/supabase/client';

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
  projects?: { name: string } | null;
  employees?: { name: string; role: string } | null;
}

export const TASK_STATUSES = ['To Do', 'In Progress', 'Review', 'Completed', 'Blocked'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects(name), employees(name, role)')
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

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(updates).eq('id', id);
  if (error) throw error;
}

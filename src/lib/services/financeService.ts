import { supabase } from '@/lib/supabase/client';

export interface Expense {
  id?: string;
  project_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  submitted_by?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  created_at?: string;
  projects?: { name: string } | null;
  employees?: { name: string } | null;
}

export const EXPENSE_CATEGORIES = ['Materials', 'Equipment', 'Labor', 'Travel', 'Overhead', 'Other'];
export const EXPENSE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid'];

export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, projects(name), employees(name)')
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createExpense(expense: Partial<Expense>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExpenseStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
  if (error) throw error;
}

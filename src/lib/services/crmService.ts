import { supabase } from '@/lib/supabase/client';

export interface Client {
  id?: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  created_at?: string;
}

export interface Contractor {
  id?: string;
  name: string;
  specialization: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  status: string;
  rating?: number;
  created_at?: string;
}

export interface Vendor {
  id?: string;
  name: string;
  category: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  status: string;
  created_at?: string;
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createClient(client: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert([client]).select().single();
  if (error) throw error;
  return data;
}

export async function getContractors(): Promise<Contractor[]> {
  const { data, error } = await supabase.from('contractors').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createContractor(contractor: Partial<Contractor>): Promise<Contractor> {
  const { data, error } = await supabase.from('contractors').insert([contractor]).select().single();
  if (error) throw error;
  return data;
}

export async function getVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createVendor(vendor: Partial<Vendor>): Promise<Vendor> {
  const { data, error } = await supabase.from('vendors').insert([vendor]).select().single();
  if (error) throw error;
  return data;
}

import { supabase } from '@/lib/supabase/client';

export interface Material {
  id?: string;
  item_name: string;
  category: string;
  current_stock: number;
  unit: string;
  reorder_level: number;
  location?: string;
  status: string;
  created_at?: string;
}

export interface Equipment {
  id?: string;
  name: string;
  category: string;
  serial_number?: string;
  current_project_id?: string | null;
  status: string;
  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;
  created_at?: string;
  projects?: { name: string } | null;
}

export interface PurchaseOrder {
  id?: string;
  po_number: string;
  vendor_id: string;
  project_id?: string | null;
  order_date: string;
  expected_delivery?: string | null;
  total_amount: number;
  status: string;
  created_at?: string;
  vendors?: { name: string } | null;
  projects?: { name: string } | null;
}

export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createMaterial(material: Partial<Material>): Promise<Material> {
  const { data, error } = await supabase.from('materials').insert([material]).select().single();
  if (error) throw error;
  return data;
}

export async function getEquipment(): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('*, projects(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createEquipment(equipment: Partial<Equipment>): Promise<Equipment> {
  const { data, error } = await supabase.from('equipment').insert([equipment]).select().single();
  if (error) throw error;
  return data;
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, vendors(name), projects(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPurchaseOrder(po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
  const { data, error } = await supabase.from('purchase_orders').insert([po]).select().single();
  if (error) throw error;
  return data;
}

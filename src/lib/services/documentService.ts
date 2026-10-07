import { supabase } from '@/lib/supabase/client';

export interface HRDocument {
  id: string;
  employee_id: string;
  parent_id: string | null;
  name: string;
  type: 'folder' | 'file';
  file_url?: string;
  file_size?: number;
  content_type?: string;
  created_at?: string;
  created_by?: string;
}

export async function getDocuments(employeeId: string, parentId: string | null = null): Promise<HRDocument[]> {
  let query = supabase
    .from('hr_documents')
    .select('*')
    .eq('employee_id', employeeId);

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  query = query.order('type', { ascending: false }).order('name', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createFolder(name: string, employeeId: string, parentId: string | null = null): Promise<HRDocument> {
  const { data, error } = await supabase
    .from('hr_documents')
    .insert([{
      name,
      employee_id: employeeId,
      parent_id: parentId,
      type: 'folder'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadFile(
  file: File, 
  employeeId: string, 
  parentId: string | null = null
): Promise<HRDocument> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `employees/${employeeId}/${fileName}`;

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('hr_documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('hr_documents')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('hr_documents')
    .insert([{
      name: file.name,
      employee_id: employeeId,
      parent_id: parentId,
      type: 'file',
      file_url: urlData.publicUrl,
      file_size: file.size,
      content_type: file.type
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('hr_documents').delete().eq('id', id);
  if (error) throw error;
}

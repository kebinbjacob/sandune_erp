import { supabase } from '@/lib/supabase/client';

export interface CompanyDocument {
  id: string;
  parent_id: string | null;
  name: string;
  type: 'folder' | 'file';
  file_url?: string;
  file_size?: number;
  content_type?: string;
  created_at?: string;
  created_by?: string;
}

export async function getCompanyDocuments(parentId: string | null = null): Promise<CompanyDocument[]> {
  let query = supabase
    .from('company_documents')
    .select('*');

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

export async function createCompanyFolder(name: string, parentId: string | null = null): Promise<CompanyDocument> {
  const { data, error } = await supabase
    .from('company_documents')
    .insert([{
      name,
      parent_id: parentId,
      type: 'folder'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadCompanyFile(
  file: File, 
  parentId: string | null = null
): Promise<CompanyDocument> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  
  // Storing under root or folder ID
  const filePath = parentId ? `${parentId}/${fileName}` : `root/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('company_documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('company_documents')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('company_documents')
    .insert([{
      name: file.name,
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

export async function deleteCompanyDocument(id: string): Promise<void> {
  const { error } = await supabase.from('company_documents').delete().eq('id', id);
  if (error) throw error;
}

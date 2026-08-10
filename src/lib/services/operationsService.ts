import { supabase } from '@/lib/supabase/client';

export interface SiteReport {
  id?: string;
  project_id: string;
  report_date: string;
  submitted_by?: string | null;
  weather?: string | null;
  work_completed?: string | null;
  issues_faced?: string | null;
  materials_used?: string | null;
  created_at?: string;
  projects?: { name: string } | null;
  employees?: { name: string } | null;
}

export interface SafetyIncident {
  id?: string;
  project_id: string;
  incident_date: string;
  reported_by?: string | null;
  severity: string;
  description: string;
  action_taken?: string | null;
  status: string;
  created_at?: string;
  projects?: { name: string } | null;
  employees?: { name: string } | null;
}

export const INCIDENT_SEVERITY = ['Minor', 'Moderate', 'Major', 'Critical'];
export const INCIDENT_STATUSES = ['Open', 'Investigating', 'Resolved', 'Closed'];

export async function getSiteReports(): Promise<SiteReport[]> {
  const { data, error } = await supabase
    .from('site_reports')
    .select('*, projects(name), employees(name)')
    .order('report_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createSiteReport(report: Partial<SiteReport>): Promise<SiteReport> {
  const { data, error } = await supabase
    .from('site_reports')
    .insert([report])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSafetyIncidents(): Promise<SafetyIncident[]> {
  const { data, error } = await supabase
    .from('safety_incidents')
    .select('*, projects(name), employees(name)')
    .order('incident_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createSafetyIncident(incident: Partial<SafetyIncident>): Promise<SafetyIncident> {
  const { data, error } = await supabase
    .from('safety_incidents')
    .insert([incident])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIncidentStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('safety_incidents').update({ status }).eq('id', id);
  if (error) throw error;
}

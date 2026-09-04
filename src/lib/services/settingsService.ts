import { supabase } from '@/lib/supabase/client';

export interface CompanySettings {
  company_name?: string;
  registration_number?: string;
  address?: string;
  currency?: string;
  date_format?: string;
  timezone?: string;
  email_notifications?: string;
  in_app_alerts?: string;
  [key: string]: string | undefined;
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching company settings:', error);
    throw error;
  }

  const settings: CompanySettings = {};
  (data || []).forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function saveCompanySettings(settings: Partial<CompanySettings>): Promise<void> {
  const entries = Object.entries(settings).filter(([_, v]) => v !== undefined);
  if (entries.length === 0) return;

  const rows = entries.map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('company_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) {
    console.error('Error saving company settings:', error);
    throw error;
  }
}

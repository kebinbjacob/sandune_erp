-- ==========================================
-- Phase 7: Settings & Schema Extensions
-- ==========================================

-- 1. Company Settings (Key-Value Store)
CREATE TABLE IF NOT EXISTS company_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Policies for company_settings
DROP POLICY IF EXISTS "Allow public select on company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow public insert on company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow public update on company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow public delete on company_settings" ON company_settings;

CREATE POLICY "Allow public select on company_settings" ON company_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on company_settings" ON company_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on company_settings" ON company_settings FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on company_settings" ON company_settings FOR DELETE TO public USING (true);

-- Seed default settings
INSERT INTO company_settings (key, value) VALUES
  ('company_name', 'Sandune Construction LLC'),
  ('registration_number', 'CR-9382012'),
  ('address', '123 Business Bay, Dubai, UAE'),
  ('currency', 'INR (₹)'),
  ('date_format', 'DD/MM/YYYY'),
  ('timezone', 'UTC - Standard'),
  ('email_notifications', 'true'),
  ('in_app_alerts', 'true')
ON CONFLICT (key) DO NOTHING;

-- 2. Schema extensions for subsequent milestones
-- R15: Purchase order line items
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS line_items jsonb DEFAULT '[]'::jsonb;

-- R19: Equipment maintenance notes
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_notes text;

-- R21: Payroll tax and deductions
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS pf_deduction numeric(10,2) DEFAULT 0;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS esi_deduction numeric(10,2) DEFAULT 0;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS tax_deduction numeric(10,2) DEFAULT 0;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS pf_pct numeric DEFAULT 12;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS esi_pct numeric DEFAULT 1.75;

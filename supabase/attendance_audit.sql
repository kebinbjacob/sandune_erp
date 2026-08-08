-- Attendance audit log table for tracking every change
CREATE TABLE IF NOT EXISTS attendance_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id uuid REFERENCES attendance(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by text NOT NULL DEFAULT 'Admin',
  reason text,
  remarks text,
  changed_at timestamptz DEFAULT now()
);

ALTER TABLE attendance_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on attendance_audit_log" ON attendance_audit_log;
DROP POLICY IF EXISTS "Allow public insert on attendance_audit_log" ON attendance_audit_log;

CREATE POLICY "Allow public select on attendance_audit_log" ON attendance_audit_log FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on attendance_audit_log" ON attendance_audit_log FOR INSERT TO public WITH CHECK (true);

-- Add check_in_time and check_out_time to attendance if not present
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS marked_by text DEFAULT 'Admin';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS remarks text;

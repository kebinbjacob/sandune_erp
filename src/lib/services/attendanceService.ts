import { supabase } from '@/lib/supabase/client';

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Half Day'
  | 'Leave'
  | 'Week Off'
  | 'Holiday'
  | 'Work From Home'
  | 'On Duty';

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; dot: string }> = {
  Present:         { label: 'Present',         color: '#10b981', bg: 'rgba(16,185,129,0.12)',  dot: '🟢' },
  Absent:          { label: 'Absent',           color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   dot: '🔴' },
  'Half Day':      { label: 'Half Day',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  dot: '🟡' },
  Leave:           { label: 'Leave',            color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  dot: '🟣' },
  'Week Off':      { label: 'Week Off',         color: '#64748b', bg: 'rgba(100,116,139,0.12)', dot: '⚫' },
  Holiday:         { label: 'Holiday',          color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   dot: '🔵' },
  'Work From Home':{ label: 'Work From Home',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  dot: '🟤' },
  'On Duty':       { label: 'On Duty / Site Visit', color: '#f97316', bg: 'rgba(249,115,22,0.12)', dot: '🟠' },
};

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as AttendanceStatus[];

export interface AttendanceRecord {
  id?: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus | null;
  check_in?: string;
  check_out?: string;
  notes?: string;
  remarks?: string;
  marked_by?: string;
  created_at?: string;
  employees?: { name: string; role: string; department: string; project: string } | null;
}

export interface AuditLogEntry {
  id: string;
  attendance_id: string;
  employee_id: string;
  date: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string;
  reason: string | null;
  remarks: string | null;
  changed_at: string;
}

// Fetch all employees with their attendance for a given date
export async function getDailyAttendance(date: string): Promise<AttendanceRecord[]> {
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name, role, department, project')
    .order('name');

  if (empError) throw empError;

  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', date);

  if (attError) throw attError;

  const attendanceMap = new Map((attendance || []).map(a => [a.employee_id, a]));

  return (employees || []).map(emp => {
    const record = attendanceMap.get(emp.id);
    return {
      id: record?.id,
      employee_id: emp.id,
      date,
      status: record?.status ?? null,
      check_in: record?.check_in,
      check_out: record?.check_out,
      notes: record?.notes,
      remarks: record?.remarks,
      marked_by: record?.marked_by,
      employees: { name: emp.name, role: emp.role, department: emp.department, project: emp.project },
    };
  });
}

// Upsert attendance and write audit log
export async function markAttendance(
  employeeId: string,
  date: string,
  status: AttendanceStatus,
  reason: string,
  remarks: string,
  existingRecord?: AttendanceRecord
): Promise<void> {
  let attendanceId: string;
  const previousStatus = existingRecord?.status ?? null;

  if (existingRecord?.id) {
    // Update existing
    const { data, error } = await supabase
      .from('attendance')
      .update({ status, notes: reason, remarks, marked_by: 'Admin' })
      .eq('id', existingRecord.id)
      .select('id')
      .single();
    if (error) throw error;
    attendanceId = data.id;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('attendance')
      .insert([{ employee_id: employeeId, date, status, notes: reason, remarks, marked_by: 'Admin' }])
      .select('id')
      .single();
    if (error) throw error;
    attendanceId = data.id;
  }

  // Write audit log entry
  await supabase.from('attendance_audit_log').insert([{
    attendance_id: attendanceId,
    employee_id: employeeId,
    date,
    previous_status: previousStatus,
    new_status: status,
    changed_by: 'Admin',
    reason: reason || null,
    remarks: remarks || null,
  }]);
}

// Bulk mark attendance
export async function bulkMarkAttendance(
  employeeIds: string[],
  date: string,
  status: AttendanceStatus
): Promise<void> {
  for (const empId of employeeIds) {
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, status')
      .eq('employee_id', empId)
      .eq('date', date)
      .single();

    await markAttendance(empId, date, status, 'Bulk mark', '', existing ?? undefined);
  }
}

// Fetch audit log for an employee/date
export async function getAuditLog(employeeId: string, date: string): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('attendance_audit_log')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .order('changed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

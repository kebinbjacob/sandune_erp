import { supabase } from '@/lib/supabase/client';

export interface PayrollRun {
  id?: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  working_days: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  half_days: number;
  on_duty_days: number;
  gross_salary: number;
  absent_deduction: number;
  half_day_deduction: number;
  net_salary: number;
  status: string;
  remarks?: string;
  generated_by?: string;
  generated_at?: string;
  employees?: { name: string; role: string; department: string; salary: number } | null;
}

export interface EmployeePayrollSummary {
  employee_id: string;
  name: string;
  role: string;
  department: string;
  salary: number; // monthly gross
  working_days: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  half_days: number;
  wfh_days: number;
  on_duty_days: number;
  daily_rate: number;
  absent_deduction: number;
  half_day_deduction: number;
  net_salary: number;
  existing_run?: PayrollRun | null;
}

const WORKING_DAYS_PER_MONTH = 26;

const PRESENT_STATUSES = ['Present', 'Work From Home', 'On Duty'];
const LEAVE_STATUSES = ['Leave'];
const HALF_DAY_STATUSES = ['Half Day'];
const ABSENT_STATUSES = ['Absent'];

export async function computePayroll(month: number, year: number): Promise<EmployeePayrollSummary[]> {
  // Fetch all active employees with salary
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, name, role, department, salary')
    .eq('status', 'Active')
    .order('name');
  if (empErr) throw empErr;

  // Fetch existing payroll runs for this period
  const { data: existingRuns, error: runErr } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('period_month', month)
    .eq('period_year', year);
  if (runErr) throw runErr;
  const runsMap = new Map((existingRuns || []).map(r => [r.employee_id, r]));

  // Fetch attendance for this month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

  const { data: attendance, error: attErr } = await supabase
    .from('attendance')
    .select('employee_id, status')
    .gte('date', startDate)
    .lte('date', endDate);
  if (attErr) throw attErr;

  // Group attendance by employee
  const attMap = new Map<string, string[]>();
  for (const rec of attendance || []) {
    if (!attMap.has(rec.employee_id)) attMap.set(rec.employee_id, []);
    attMap.get(rec.employee_id)!.push(rec.status);
  }

  return (employees || []).map(emp => {
    const statuses = attMap.get(emp.id) || [];
    const present = statuses.filter(s => PRESENT_STATUSES.includes(s)).length;
    const wfh = statuses.filter(s => s === 'Work From Home').length;
    const onDuty = statuses.filter(s => s === 'On Duty').length;
    const leave = statuses.filter(s => LEAVE_STATUSES.includes(s)).length;
    const halfDay = statuses.filter(s => HALF_DAY_STATUSES.includes(s)).length;
    const absent = statuses.filter(s => ABSENT_STATUSES.includes(s)).length;

    const monthlySalary = emp.salary || 0;
    const dailyRate = monthlySalary / WORKING_DAYS_PER_MONTH;
    const absentDeduction = absent * dailyRate;
    const halfDayDeduction = halfDay * (dailyRate / 2);
    const netSalary = Math.max(0, monthlySalary - absentDeduction - halfDayDeduction);

    return {
      employee_id: emp.id,
      name: emp.name,
      role: emp.role,
      department: emp.department,
      salary: monthlySalary,
      working_days: WORKING_DAYS_PER_MONTH,
      present_days: present,
      absent_days: absent,
      leave_days: leave,
      half_days: halfDay,
      wfh_days: wfh,
      on_duty_days: onDuty,
      daily_rate: dailyRate,
      absent_deduction: absentDeduction,
      half_day_deduction: halfDayDeduction,
      net_salary: netSalary,
      existing_run: runsMap.get(emp.id) || null,
    };
  });
}

export async function savePayrollRun(summary: EmployeePayrollSummary, month: number, year: number): Promise<void> {
  const payload = {
    employee_id: summary.employee_id,
    period_month: month,
    period_year: year,
    working_days: summary.working_days,
    present_days: summary.present_days,
    absent_days: summary.absent_days,
    leave_days: summary.leave_days,
    half_days: summary.half_days,
    on_duty_days: summary.on_duty_days,
    gross_salary: summary.salary,
    absent_deduction: summary.absent_deduction,
    half_day_deduction: summary.half_day_deduction,
    net_salary: summary.net_salary,
    status: 'Generated',
    generated_by: 'Admin',
  };

  const { error } = await supabase
    .from('payroll_runs')
    .upsert([payload], { onConflict: 'employee_id,period_month,period_year' });
  if (error) throw error;
}

export async function getPayrollHistory(employeeId: string): Promise<PayrollRun[]> {
  const { data, error } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('employee_id', employeeId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllPayrollRuns(month: number, year: number): Promise<PayrollRun[]> {
  const { data, error } = await supabase
    .from('payroll_runs')
    .select('*, employees(name, role, department, salary)')
    .eq('period_month', month)
    .eq('period_year', year)
    .order('generated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

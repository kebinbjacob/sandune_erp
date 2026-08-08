'use client';

import { useState, useEffect } from 'react';
import { computePayroll, savePayrollRun, MONTHS, EmployeePayrollSummary } from '@/lib/services/payrollService';
import styles from './payroll.module.css';

const currYear = new Date().getFullYear();
const currMonth = new Date().getMonth() + 1;

export default function PayrollPage() {
  const [month, setMonth] = useState(currMonth);
  const [year, setYear] = useState(currYear);
  const [summaries, setSummaries] = useState<EmployeePayrollSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const data = await computePayroll(month, year);
      setSummaries(data);
      // Mark already-generated ones
      const already = new Set(data.filter(s => s.existing_run?.status === 'Generated').map(s => s.employee_id));
      setSaved(already);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayroll(); }, [month, year]);

  const handleSave = async (summary: EmployeePayrollSummary) => {
    setSaving(summary.employee_id);
    try {
      await savePayrollRun(summary, month, year);
      setSaved(prev => new Set([...prev, summary.employee_id]));
    } catch (e) {
      console.error(e);
      alert('Failed to save payroll run.');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    for (const s of summaries) {
      if (!saved.has(s.employee_id)) await handleSave(s);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const totalGross = summaries.reduce((a, s) => a + s.salary, 0);
  const totalNet = summaries.reduce((a, s) => a + s.net_salary, 0);
  const totalDeduction = summaries.reduce((a, s) => a + s.absent_deduction + s.half_day_deduction, 0);

  const years = [currYear - 1, currYear, currYear + 1];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payroll</h1>
          <p className={styles.subtitle}>Calculate and process monthly employee salaries from attendance</p>
        </div>
        <div className={styles.periodPicker}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className={styles.select}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={styles.select}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={handleSaveAll} className={styles.runBtn}>
            💾 Save All Payroll
          </button>
        </div>
      </header>

      {/* Summary totals */}
      <div className={styles.totalsGrid}>
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>👥 Total Employees</span>
          <span className={styles.totalValue}>{summaries.length}</span>
        </div>
        <div className={styles.totalCard} style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
          <span className={styles.totalLabel}>💼 Total Gross</span>
          <span className={styles.totalValue} style={{ color: '#a5b4fc' }}>{fmt(totalGross)}</span>
        </div>
        <div className={styles.totalCard} style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <span className={styles.totalLabel}>📉 Total Deductions</span>
          <span className={styles.totalValue} style={{ color: '#f87171' }}>-{fmt(totalDeduction)}</span>
        </div>
        <div className={styles.totalCard} style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
          <span className={styles.totalLabel}>✅ Total Net Payable</span>
          <span className={styles.totalValue} style={{ color: '#10b981' }}>{fmt(totalNet)}</span>
        </div>
      </div>

      {/* Payroll table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>Computing payroll for {MONTHS[month - 1]} {year}...</div>
        ) : summaries.length === 0 ? (
          <div className={styles.loadingState}>No active employees found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Gross Salary</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Half Day</th>
                <th>Leave</th>
                <th>Deduction</th>
                <th>Net Payable</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(s => {
                const deduction = s.absent_deduction + s.half_day_deduction;
                const isSaved = saved.has(s.employee_id);
                const isSaving = saving === s.employee_id;
                const rate = s.present_days > 0 ? Math.round((s.present_days / s.working_days) * 100) : 0;
                return (
                  <tr key={s.employee_id} className={isSaved ? styles.savedRow : ''}>
                    <td>
                      <div className={styles.empName}>{s.name}</div>
                      <div className={styles.empRole}>{s.role}</div>
                    </td>
                    <td className={styles.deptCell}>{s.department || '—'}</td>
                    <td className={styles.moneyCell}>{fmt(s.salary)}</td>
                    <td>
                      <span className={styles.attBadge} style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>{s.present_days}</span>
                    </td>
                    <td>
                      <span className={styles.attBadge} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>{s.absent_days}</span>
                    </td>
                    <td>
                      <span className={styles.attBadge} style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>{s.half_days}</span>
                    </td>
                    <td>
                      <span className={styles.attBadge} style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)' }}>{s.leave_days}</span>
                    </td>
                    <td className={styles.deductionCell}>
                      {deduction > 0 ? `-${fmt(deduction)}` : '—'}
                    </td>
                    <td>
                      <span className={styles.netSalary}>{fmt(s.net_salary)}</span>
                      <div className={styles.miniBar}>
                        <div className={styles.miniBarFill} style={{ width: `${rate}%` }} />
                      </div>
                    </td>
                    <td>
                      <span className={styles.statusBadge} style={isSaved ? { color: '#10b981', background: 'rgba(16,185,129,0.1)' } : { color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }}>
                        {isSaved ? '✅ Generated' : '⏳ Draft'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.saveBtn}
                        onClick={() => handleSave(s)}
                        disabled={isSaving}
                      >
                        {isSaving ? '...' : isSaved ? '↻ Re-run' : '💾 Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

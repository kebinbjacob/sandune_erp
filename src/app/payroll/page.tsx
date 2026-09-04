'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  computePayroll,
  savePayrollRun,
  getAllPayrollRuns,
  deletePayrollRun,
  MONTHS,
  EmployeePayrollSummary,
  PayrollRun
} from '@/lib/services/payrollService';
import { useAuth } from '@/lib/context/AuthContext';
import { exportToCSV } from '@/lib/utils/csvExport';
import styles from './payroll.module.css';

const currYear = new Date().getFullYear();
const currMonth = new Date().getMonth() + 1;

export default function PayrollPage() {
  const { user } = useAuth();
  const generatedByName = user?.employees?.name || user?.email || 'System';

  const [activeTab, setActiveTab] = useState<'process' | 'history'>('process');

  // Process Payroll State
  const [month, setMonth] = useState(currMonth);
  const [year, setYear] = useState(currYear);
  const [summaries, setSummaries] = useState<EmployeePayrollSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  // Statutory Rates State (R21)
  const [pfPct, setPfPct] = useState<number>(12);
  const [esiPct, setEsiPct] = useState<number>(1.75);
  const [taxPct, setTaxPct] = useState<string>('auto'); // 'auto' or numeric %

  // Payroll History State (R11)
  const [historyRuns, setHistoryRuns] = useState<PayrollRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<string>('all'); // 'all' or 'MM-YYYY'
  const [historySearch, setHistorySearch] = useState<string>('');

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const config = {
        pfPct,
        esiPct,
        taxPct: taxPct === 'auto' ? undefined : Number(taxPct),
      };
      const data = await computePayroll(month, year, config);
      setSummaries(data);
      const already = new Set(data.filter(s => s.existing_run?.status === 'Generated').map(s => s.employee_id));
      setSaved(already);
    } catch (e) {
      console.error('Failed to compute payroll:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const runs = await getAllPayrollRuns();
      setHistoryRuns(runs);
    } catch (e) {
      console.error('Failed to load payroll history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'process') {
      fetchPayroll();
    } else {
      fetchHistory();
    }
  }, [activeTab, month, year, pfPct, esiPct, taxPct]);

  const handleSave = async (summary: EmployeePayrollSummary) => {
    setSaving(summary.employee_id);
    try {
      await savePayrollRun(summary, month, year, generatedByName);
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

  const handleDeleteHistoryRun = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return;
    try {
      await deletePayrollRun(id);
      setHistoryRuns(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete payroll record.');
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const totalGross = summaries.reduce((a, s) => a + s.salary, 0);
  const totalNet = summaries.reduce((a, s) => a + s.net_salary, 0);
  const totalDeductions = summaries.reduce((a, s) => a + s.total_deductions, 0);
  const totalPF = summaries.reduce((a, s) => a + s.pf_deduction, 0);
  const totalESI = summaries.reduce((a, s) => a + s.esi_deduction, 0);
  const totalTax = summaries.reduce((a, s) => a + s.tax_deduction, 0);

  const years = [currYear - 1, currYear, currYear + 1];

  // R16: Export Processed Payroll to CSV
  const handleExportProcessedCSV = () => {
    const headers = [
      'Employee Name',
      'Role',
      'Department',
      'Gross Salary (₹)',
      'Working Days',
      'Present Days',
      'Absent Days',
      'Half Days',
      'Leave Days',
      'Absent/Half Deduction (₹)',
      'PF (12%) (₹)',
      'ESI (1.75%) (₹)',
      'Tax Deduction (₹)',
      'Total Deductions (₹)',
      'Net Payable (₹)',
      'Status'
    ];

    const rows = summaries.map(s => [
      s.name,
      s.role,
      s.department || '',
      s.salary,
      s.working_days,
      s.present_days,
      s.absent_days,
      s.half_days,
      s.leave_days,
      s.absent_deduction + s.half_day_deduction,
      s.pf_deduction,
      s.esi_deduction,
      s.tax_deduction,
      s.total_deductions,
      s.net_salary,
      saved.has(s.employee_id) ? 'Generated' : 'Draft'
    ]);

    exportToCSV(`Payroll_${MONTHS[month - 1]}_${year}`, headers, rows);
  };

  // R16: Export Payroll History to CSV
  const handleExportHistoryCSV = () => {
    const headers = [
      'Period',
      'Employee Name',
      'Role',
      'Department',
      'Gross Salary (₹)',
      'Present Days',
      'Absent Days',
      'Absent Deduction (₹)',
      'Half Day Deduction (₹)',
      'PF Deduction (₹)',
      'ESI Deduction (₹)',
      'Tax Deduction (₹)',
      'Net Salary (₹)',
      'Status',
      'Generated By',
      'Generated At'
    ];

    const rows = filteredHistory.map(r => [
      `${MONTHS[r.period_month - 1]} ${r.period_year}`,
      r.employees?.name || 'Unknown',
      r.employees?.role || '',
      r.employees?.department || '',
      r.gross_salary,
      r.present_days,
      r.absent_days,
      r.absent_deduction,
      r.half_day_deduction,
      r.pf_deduction || 0,
      r.esi_deduction || 0,
      r.tax_deduction || 0,
      r.net_salary,
      r.status,
      r.generated_by || '',
      r.generated_at ? new Date(r.generated_at).toLocaleDateString('en-IN') : ''
    ]);

    exportToCSV(`Payroll_History_Export_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyRuns.filter(r => {
      if (historyPeriodFilter !== 'all') {
        const [mStr, yStr] = historyPeriodFilter.split('-');
        if (r.period_month !== Number(mStr) || r.period_year !== Number(yStr)) {
          return false;
        }
      }
      if (historySearch) {
        const q = historySearch.toLowerCase();
        const empName = r.employees?.name?.toLowerCase() || '';
        const dept = r.employees?.department?.toLowerCase() || '';
        if (!empName.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [historyRuns, historyPeriodFilter, historySearch]);

  const uniqueHistoryPeriods = useMemo(() => {
    const set = new Set<string>();
    historyRuns.forEach(r => {
      set.add(`${r.period_month}-${r.period_year}`);
    });
    return Array.from(set);
  }, [historyRuns]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payroll Management</h1>
          <p className={styles.subtitle}>Process monthly employee compensation, statutory deductions (PF, ESI, Tax), and review history.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '4px' }}>
            <button
              onClick={() => setActiveTab('process')}
              style={{
                background: activeTab === 'process' ? '#6366f1' : 'transparent',
                color: activeTab === 'process' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              📊 Process Payroll
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: activeTab === 'history' ? '#6366f1' : 'transparent',
                color: activeTab === 'history' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              📜 Payroll History ({historyRuns.length})
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'process' && (
        <>
          {/* Control Bar with Period & Statutory Settings */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Month</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className={styles.select}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Year</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className={styles.select}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* R21 Statutory Configurations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PF Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={pfPct}
                  onChange={e => setPfPct(Number(e.target.value))}
                  className={styles.select}
                  style={{ width: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ESI Rate (%)</label>
                <input
                  type="number"
                  step="0.25"
                  value={esiPct}
                  onChange={e => setEsiPct(Number(e.target.value))}
                  className={styles.select}
                  style={{ width: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tax Deduction</label>
                <select value={taxPct} onChange={e => setTaxPct(e.target.value)} className={styles.select}>
                  <option value="auto">Auto Bracket (5% &gt;50k)</option>
                  <option value="0">0% (Exempt)</option>
                  <option value="5">Flat 5%</option>
                  <option value="10">Flat 10%</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleExportProcessedCSV} className={styles.saveBtn} style={{ padding: '0.6rem 1rem', fontSize: '0.875rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}>
                📥 Export CSV
              </button>
              <button onClick={handleSaveAll} className={styles.runBtn}>
                💾 Save All Payroll ({summaries.length - saved.size} unsaved)
              </button>
            </div>
          </div>

          {/* Summary Totals Cards */}
          <div className={styles.totalsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
              <span className={styles.totalValue} style={{ color: '#f87171' }}>-{fmt(totalDeductions)}</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PF: {fmt(totalPF)} • ESI: {fmt(totalESI)} • Tax: {fmt(totalTax)}</span>
            </div>
            <div className={styles.totalCard} style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
              <span className={styles.totalLabel}>✅ Net Payable</span>
              <span className={styles.totalValue} style={{ color: '#10b981' }}>{fmt(totalNet)}</span>
            </div>
          </div>

          {/* Payroll Processing Table */}
          <div className={styles.tableCard} style={{ overflowX: 'auto' }}>
            {loading ? (
              <div className={styles.loadingState}>Computing payroll for {MONTHS[month - 1]} {year}...</div>
            ) : summaries.length === 0 ? (
              <div className={styles.loadingState}>No active employees found.</div>
            ) : (
              <table className={styles.table} style={{ minWidth: '1100px' }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Gross</th>
                    <th style={{ textAlign: 'center' }}>Att (P/A/H)</th>
                    <th style={{ textAlign: 'right' }}>Abs/Half Ded.</th>
                    <th style={{ textAlign: 'right' }}>PF (12%)</th>
                    <th style={{ textAlign: 'right' }}>ESI (1.75%)</th>
                    <th style={{ textAlign: 'right' }}>Tax</th>
                    <th style={{ textAlign: 'right' }}>Total Ded.</th>
                    <th style={{ textAlign: 'right' }}>Net Payable</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map(s => {
                    const attDed = s.absent_deduction + s.half_day_deduction;
                    const isSaved = saved.has(s.employee_id);
                    const isSaving = saving === s.employee_id;
                    const rate = s.present_days > 0 ? Math.round((s.present_days / s.working_days) * 100) : 0;

                    return (
                      <tr key={s.employee_id} className={isSaved ? styles.savedRow : ''}>
                        <td>
                          <div className={styles.empName}>{s.name}</div>
                          <div className={styles.empRole}>{s.role} {s.department ? `• ${s.department}` : ''}</div>
                        </td>
                        <td className={styles.moneyCell}>{fmt(s.salary)}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span className={styles.attBadge} style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>{s.present_days}P</span>{' '}
                          <span className={styles.attBadge} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>{s.absent_days}A</span>{' '}
                          <span className={styles.attBadge} style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>{s.half_days}H</span>
                        </td>
                        <td className={styles.deductionCell} style={{ textAlign: 'right' }}>
                          {attDed > 0 ? `-${fmt(attDed)}` : '—'}
                        </td>
                        <td className={styles.deductionCell} style={{ textAlign: 'right', color: '#c084fc' }}>
                          {s.pf_deduction > 0 ? `-${fmt(s.pf_deduction)}` : '—'}
                        </td>
                        <td className={styles.deductionCell} style={{ textAlign: 'right', color: '#38bdf8' }}>
                          {s.esi_deduction > 0 ? `-${fmt(s.esi_deduction)}` : '—'}
                        </td>
                        <td className={styles.deductionCell} style={{ textAlign: 'right', color: '#fbbf24' }}>
                          {s.tax_deduction > 0 ? `-${fmt(s.tax_deduction)}` : '—'}
                        </td>
                        <td className={styles.deductionCell} style={{ textAlign: 'right', fontWeight: 600 }}>
                          {s.total_deductions > 0 ? `-${fmt(s.total_deductions)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={styles.netSalary}>{fmt(s.net_salary)}</span>
                          <div className={styles.miniBar} style={{ marginLeft: 'auto' }}>
                            <div className={styles.miniBarFill} style={{ width: `${rate}%` }} />
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.statusBadge} style={isSaved ? { color: '#10b981', background: 'rgba(16,185,129,0.1)' } : { color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }}>
                            {isSaved ? '✅ Generated' : '⏳ Draft'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
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
        </>
      )}

      {/* R11: Payroll History Tab View */}
      {activeTab === 'history' && (
        <>
          {/* History Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Filter Period</label>
                <select
                  value={historyPeriodFilter}
                  onChange={e => setHistoryPeriodFilter(e.target.value)}
                  className={styles.select}
                  style={{ minWidth: '160px' }}
                >
                  <option value="all">All Periods</option>
                  {uniqueHistoryPeriods.map(p => {
                    const [mNum, yNum] = p.split('-');
                    return (
                      <option key={p} value={p}>
                        {MONTHS[Number(mNum) - 1]} {yNum}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Search Employee / Dept</label>
                <input
                  type="text"
                  placeholder="Search name or department..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className={styles.select}
                  style={{ minWidth: '220px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleExportHistoryCSV} className={styles.saveBtn} style={{ padding: '0.6rem 1rem', fontSize: '0.875rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}>
                📥 Export History CSV
              </button>
            </div>
          </div>

          {/* History KPI Cards */}
          <div className={styles.totalsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className={styles.totalCard}>
              <span className={styles.totalLabel}>📜 Total Processed Records</span>
              <span className={styles.totalValue}>{filteredHistory.length}</span>
            </div>
            <div className={styles.totalCard} style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
              <span className={styles.totalLabel}>💼 Historic Gross Total</span>
              <span className={styles.totalValue} style={{ color: '#a5b4fc' }}>
                {fmt(filteredHistory.reduce((acc, r) => acc + (r.gross_salary || 0), 0))}
              </span>
            </div>
            <div className={styles.totalCard} style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
              <span className={styles.totalLabel}>✅ Historic Net Disbursed</span>
              <span className={styles.totalValue} style={{ color: '#10b981' }}>
                {fmt(filteredHistory.reduce((acc, r) => acc + (r.net_salary || 0), 0))}
              </span>
            </div>
          </div>

          {/* History Table */}
          <div className={styles.tableCard} style={{ overflowX: 'auto' }}>
            {historyLoading ? (
              <div className={styles.loadingState}>Loading payroll history...</div>
            ) : filteredHistory.length === 0 ? (
              <div className={styles.loadingState}>No historical payroll runs found.</div>
            ) : (
              <table className={styles.table} style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'right' }}>Gross Salary</th>
                    <th style={{ textAlign: 'right' }}>Total Deductions</th>
                    <th style={{ textAlign: 'right' }}>Net Disbursed</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th>Generated By</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(run => {
                    const totalDed = (run.gross_salary || 0) - (run.net_salary || 0);
                    return (
                      <tr key={run.id || `${run.employee_id}-${run.period_month}-${run.period_year}`}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#818cf8' }}>
                            {MONTHS[run.period_month - 1]} {run.period_year}
                          </div>
                          {run.generated_at && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {new Date(run.generated_at).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className={styles.empName}>{run.employees?.name || 'Employee'}</div>
                          <div className={styles.empRole}>{run.employees?.role || ''}</div>
                        </td>
                        <td className={styles.deptCell}>{run.employees?.department || '—'}</td>
                        <td className={styles.moneyCell} style={{ textAlign: 'right' }}>
                          {fmt(run.gross_salary)}
                        </td>
                        <td className={styles.deductionCell} style={{ textAlign: 'right' }}>
                          {totalDed > 0 ? `-${fmt(totalDed)}` : '₹0'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={styles.netSalary}>{fmt(run.net_salary)}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.statusBadge} style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
                            ✅ {run.status || 'Generated'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          👤 {run.generated_by || 'System'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {run.id && (
                            <button
                              onClick={() => handleDeleteHistoryRun(run.id!)}
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                color: '#ef4444',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

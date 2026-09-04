# Codebase Survey & Implementation Plan: Explorer 3

**Target Scope:** R6, R9, R10, R11, R13, R14, R15, R16, R17, R18, R19, R20, R21, R22  
**Working Directory:** `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_explorer_survey_3`  
**Timestamp:** 2026-08-29T12:47:00Z  

---

## Executive Summary

This survey provides a comprehensive analysis of the SanDune ERP codebase for 14 specific functional and UX requirements across Leave Management, Shifts & Schedules, Attendance, Payroll, CRM/Resources List Pages, Expense Management, Procurement, Safety, and Project Details.

Every target file, component, service interface, database schema, and CSS module has been investigated. Detailed findings and actionable, concrete implementation designs are documented below.

---

## Item-by-Item Detailed Findings & Implementation Blueprint

---

### 1. R6: Leave Balances Auto-Decrement on Approval

#### Current State
- **Files**:
  - `src/app/leave/page.tsx` (lines 29–36)
  - `src/lib/services/leaveService.ts` (lines 44–54)
  - `src/lib/services/leaveBalancesService.ts` (lines 16–42)
  - `supabase/phase3_4.sql` (lines 68–81)
- **Problem**: When a manager clicks "✓ Approve" in `src/app/leave/page.tsx`, `handleStatusUpdate(id, 'Approved')` calls `updateLeaveStatus(id, 'Approved')`. It does NOT decrement or update the employee's `leave_balances` row.
- **Database Schema (`leave_balances`)**:
  - Columns: `employee_id (uuid)`, `year (int)`, `annual_total`, `annual_used`, `sick_total`, `sick_used`, `casual_total`, `casual_used`.

#### Implementation Design
1. In `src/lib/services/leaveBalancesService.ts`, add a helper:
   ```typescript
   export async function deductLeaveBalance(
     employeeId: string,
     leaveType: string,
     days: number,
     year: number
   ): Promise<void> {
     const { data: balance, error } = await supabase
       .from('leave_balances')
       .select('*')
       .eq('employee_id', employeeId)
       .eq('year', year)
       .maybeSingle();

     if (error || !balance) {
       // If no balance record exists, skip silently as required
       return;
     }

     const normType = leaveType.toLowerCase();
     const updates: Partial<LeaveBalance> = {};

     if (normType.includes('annual')) {
       updates.annual_used = (balance.annual_used || 0) + days;
     } else if (normType.includes('sick')) {
       updates.sick_used = (balance.sick_used || 0) + days;
     } else if (normType.includes('casual')) {
       updates.casual_used = (balance.casual_used || 0) + days;
     } else {
       return;
     }

     await updateLeaveBalance(balance.id!, updates);
   }
   ```
2. In `src/app/leave/page.tsx`:
   - In `handleStatusUpdate(id, status)`:
     ```typescript
     if (status === 'Approved') {
       const req = requests.find(r => r.id === id);
       if (req) {
         const start = new Date(req.start_date);
         const end = new Date(req.end_date);
         const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
         const year = start.getFullYear();
         await deductLeaveBalance(req.employee_id, req.leave_type, days, year);
       }
     }
     await updateLeaveStatus(id, status);
     ```

---

### 2. R9: `/shifts/schedules` Weekly Calendar View

#### Current State
- **File**: `src/app/shifts/schedules/page.tsx`
- **Current Content**: Contains static placeholder `<div className={styles.loading}>Feature coming in Phase 5.</div>` (lines 14–16).
- **Service**: `src/lib/services/shiftService.ts` already has `getEmployeeShifts()` (lines 33–40) returning `EmployeeShift[]` with joined `shifts(*)` and `employees(name, role)`.

#### Implementation Design
1. **Week Navigation**:
   - State for `currentWeekStart: Date` (Monday of selected week).
   - "← Prev Week", "Today", "Next Week →" controls.
   - Weekday headers: Mon, Tue, Wed, Thu, Fri, Sat, Sun with formatted dates (e.g. `Mon 25 Aug`).
2. **Data Aggregation**:
   - Load `getEmployeeShifts()`, `getEmployees()`, and `getShifts()`.
   - Map each employee to their active shift assignment (`effective_from <= dayDate`).
3. **Weekly Table View**:
   - Columns: `Employee (Name & Role)`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`.
   - Cell: Shift badge (e.g., `Morning Shift (08:00 - 17:00)` with distinct background pill), or `Off / Not Assigned` if no active shift on that day.
   - Quick action to open shift assignment modal if needed.

---

### 3. R10: Attendance Sub-pages Stubs

#### Current State
All three routes currently render Phase 5 placeholder stubs:
- `src/app/attendance/timesheets/page.tsx` (19 lines)
- `src/app/attendance/corrections/page.tsx` (20 lines)
- `src/app/attendance/reports/page.tsx` (20 lines)

#### Implementation Design

#### A. `/attendance/timesheets`
- **Objective**: Per-employee weekly timesheet view.
- **Controls**:
  - Employee dropdown `<select>` (from `getEmployees()`).
  - Week selector (Date input or Monday-picker with Prev/Next buttons).
- **Data Query**: Query `attendance` table for `employee_id = selectedEmpId` and `date >= weekStart AND date <= weekEnd`.
- **Calculations & Display**:
  - Rows for each of the 7 days of the selected week.
  - Columns: `Day`, `Date`, `Status`, `Check-in`, `Check-out`, `Hours Worked`.
  - Daily Hours: If `check_in` and `check_out` exist, calculate time difference in hours; fallback: `Present` = 8 hrs, `Half Day` = 4 hrs, `Absent`/`Leave` = 0 hrs.
  - Summary footer card: `Total Weekly Hours Worked`, `Overtime Hours (> 40h)`, `Days Present`.

#### B. `/attendance/corrections`
- **Objective**: Attendance audit log list with filters.
- **Service Extension**:
  In `src/lib/services/attendanceService.ts`, add:
  ```typescript
  export async function getAllAuditLogs(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<(AuditLogEntry & { employees?: { name: string; role: string; department: string } })[]> {
    let query = supabase
      .from('attendance_audit_log')
      .select('*, employees:employee_id(name, role, department)')
      .order('changed_at', { ascending: false });

    if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters?.startDate) query = query.gte('date', filters.startDate);
    if (filters?.endDate) query = query.lte('date', filters.endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  ```
- **UI**:
  - Filter bar: Employee dropdown, Start Date, End Date, Status Change filter.
  - Table: `Timestamp`, `Employee`, `Attendance Date`, `Previous Status → New Status`, `Reason`, `Remarks`, `Changed By`.

#### C. `/attendance/reports`
- **Objective**: Monthly attendance summary per employee.
- **Controls**: Month and Year dropdowns.
- **Data Processing**:
  - Fetch all active employees (`getEmployees()`).
  - Fetch all attendance records for `month` and `year`.
  - For each employee, aggregate:
    - `Present` count
    - `Absent` count
    - `Half Day` count
    - `Leave` count
    - `On Duty / WFH` count
    - `Total Logged Days`
    - `Attendance %` = `((present + onDuty + wfh + halfDay * 0.5) / workingDaysInMonth) * 100`
  - Render summary metric cards (Average Attendance %, Most Present Dept) and table.

---

### 4. R11 & R21: Payroll History Tab and Tax/Deduction Fields

#### Current State
- `src/app/payroll/page.tsx` currently only computes the current month's payroll without a tab for past history runs.
- `getAllPayrollRuns(month, year)` exists in `src/lib/services/payrollService.ts` (lines 161–170) but is never rendered.
- `payrollService.ts` only deducts absent and half-day amounts (`absent_deduction`, `half_day_deduction`).

#### Implementation Design

#### R11: History Tab on `/payroll`
- Add top tab switcher: `[ Process Payroll | Payroll History ]`.
- In History tab:
  - Month & Year selector (or "All Periods").
  - Table: `Period (Month/Year)`, `Employee Name`, `Role / Department`, `Gross Salary`, `Total Deductions`, `Net Salary`, `Status`, `Generated By`, `Generated At`.
  - Includes an "Export History CSV" button.

#### R21: Tax and Deductions
- **Computation Formula**:
  - `pf_deduction`: Provident Fund = `12%` of `gross_salary` (or 0 if gross is 0).
  - `esi_deduction`: Employee State Insurance = `1.75%` of `gross_salary` if `gross_salary <= 21000`, otherwise `0`.
  - `tax_deduction`: Income tax / TDS (e.g. flat configurable % or threshold: 5% for salary > 50,000, 10% for salary > 100,000, or user editable).
  - `total_deductions = absent_deduction + half_day_deduction + pf_deduction + esi_deduction + tax_deduction`.
  - `net_salary = Math.max(0, gross_salary - total_deductions)`.
- **Database & Model Updates**:
  - In `payroll_runs` schema (`supabase/phase7_settings.sql`):
    ```sql
    ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS pf_deduction numeric DEFAULT 0;
    ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS esi_deduction numeric DEFAULT 0;
    ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS tax_deduction numeric DEFAULT 0;
    ```
  - In `EmployeePayrollSummary` and `PayrollRun` interfaces in `payrollService.ts`, add `pf_deduction`, `esi_deduction`, `tax_deduction`.
- **UI Update**:
  - Table columns in `/payroll`: `Employee`, `Gross`, `Present/Absent`, `Absent/Half Ded.`, `PF (12%)`, `ESI (1.75%)`, `Tax`, `Total Ded.`, `Net Payable`, `Status`, `Actions`.

---

### 5. R13: Search & Filter on List Pages

#### Current State
The following pages load all items but have no client-side search or filter inputs:
- `/tasks` (`src/app/tasks/page.tsx`)
- `/clients` (`src/app/clients/page.tsx`)
- `/contractors` (`src/app/contractors/page.tsx`)
- `/vendors` (`src/app/vendors/page.tsx`)
- `/materials` (`src/app/materials/page.tsx`)
- `/procurement` (`src/app/procurement/page.tsx`)

#### Implementation Design
Add a filter toolbar `<div className={styles.toolbar}>` above each table:
1. **`/tasks`**:
   - Search input: task title / assignee name.
   - Filter dropdown: Project (`projects.name`).
   - Filter dropdown: Status (`To Do`, `In Progress`, `Review`, `Completed`, `Blocked`).
   - Filter dropdown: Priority (`Low`, `Medium`, `High`, `Critical`).
2. **`/clients`**:
   - Search input: company name or contact person.
   - Filter dropdown: Status (`All`, `Active`, `Inactive`).
3. **`/contractors`**:
   - Search input: company name or specialization.
   - Filter dropdown: Status (`All`, `Active`, `Inactive`) / Rating (1–5 stars).
4. **`/vendors`**:
   - Search input: vendor name or contact person.
   - Filter dropdown: Category (`Raw Materials`, `Heavy Machinery`, `Electrical`, etc.) or Status (`Active`, `Inactive`).
5. **`/materials`**:
   - Search input: item name or category.
   - Filter dropdown: Stock Status (`All`, `Healthy`, `Low Stock`).
6. **`/procurement`**:
   - Filter dropdown: Vendor (`vendor_id`).
   - Filter dropdown: Status (`All`, `Draft`, `Sent`, `Delivered`, `Paid`).

---

### 6. R14: Expense Receipt Upload

#### Current State
- `src/app/expenses/page.tsx` has `receipt_url` in the `Expense` interface and database table, but the form modal does NOT have a file picker to upload receipts to Supabase Storage.

#### Implementation Design
1. **Supabase Storage Integration**:
   - In `src/lib/services/financeService.ts`, add:
     ```typescript
     export async function uploadReceipt(file: File): Promise<string> {
       const ext = file.name.split('.').pop();
       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
       const { data, error } = await supabase.storage
         .from('receipts')
         .upload(fileName, file, { cacheControl: '3600', upsert: false });
       if (error) throw error;
       const { data: publicData } = supabase.storage.from('receipts').getPublicUrl(fileName);
       return publicData.publicUrl;
     }
     ```
2. **Form Modal Update (`src/app/expenses/page.tsx`)**:
   - Add state `file: File | null`, `uploading: boolean`.
   - File input `<input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />`.
   - If `editingId` and `form.receipt_url` exists, display clickable "View Current Receipt ↗" link.
   - On submit, if `file` is selected, upload first via `uploadReceipt(file)`, attach `receipt_url`, then save expense record.
3. **Table Column Update**:
   - In table row, show `📎 Receipt` icon/badge linked to `receipt_url` (opens in new tab `target="_blank" rel="noreferrer"`).

---

### 7. R15: Purchase Order Line Items

#### Current State
- `src/app/procurement/page.tsx` only has a single `total_amount` input field in the modal.
- `PurchaseOrder` in `src/lib/services/resourceService.ts` has no `line_items` definition.

#### Implementation Design
1. **Schema Migration (`supabase/phase7_settings.sql`)**:
   ```sql
   ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS line_items jsonb DEFAULT '[]'::jsonb;
   ```
2. **Type Definition in `src/lib/services/resourceService.ts`**:
   ```typescript
   export interface POLineItem {
     description: string;
     quantity: number;
     unit_price: number;
     total: number;
   }
   export interface PurchaseOrder {
     // ... existing fields
     line_items?: POLineItem[] | null;
   }
   ```
3. **Procurement Modal (`src/app/procurement/page.tsx`)**:
   - State `lineItems: POLineItem[]`.
   - Dynamic table inside modal with columns: `Description`, `Qty`, `Unit Price`, `Line Total`, `Delete`.
   - Button `+ Add Line Item`.
   - Auto-calculate: `total_amount = lineItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)`.
   - The `total_amount` input is disabled or read-only auto-calculated.
   - Include `line_items` in create and update payloads.

---

### 8. R16: CSV Export on Key Pages

#### Current State
No export functionality exists on `/attendance`, `/payroll`, `/reports/site`, or `/leave`.

#### Implementation Design
1. **Reusable Client-side CSV Utility (`src/lib/utils/csvExport.ts`)**:
   ```typescript
   export function exportToCSV(
     filename: string,
     headers: string[],
     rows: (string | number | null | undefined)[][]
   ): void {
     const escapeCell = (val: string | number | null | undefined): string => {
       if (val === null || val === undefined) return '""';
       const str = String(val).replace(/"/g, '""');
       return `"${str}"`;
     };

     const csvContent = [
       headers.map(escapeCell).join(','),
       ...rows.map(row => row.map(escapeCell).join(','))
     ].join('\r\n');

     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
   }
   ```
2. **Page Integration**:
   - **`/attendance`**: Button "📥 Export CSV" → exports `filtered` records with headers: `Employee Name, Role, Department, Project, Date, Status, Marked By`.
   - **`/payroll`**: Button "📥 Export CSV" → exports payroll summaries with headers: `Employee, Department, Gross Salary, Present, Absent, Half Day, Leave, Absent Ded, Half Day Ded, PF Ded, ESI Ded, Tax Ded, Net Payable, Status`.
   - **`/reports/site`**: Button "📥 Export CSV" → exports reports with headers: `Date, Project, Weather, Work Completed, Issues Faced, Materials Used, Submitted By`.
   - **`/leave`**: Button "📥 Export CSV" → exports leave requests with headers: `Employee, Department, Leave Type, Start Date, End Date, Reason, Status, Created At`.

---

### 9. R17: Leave Balance Validation Warning on `/leave/apply`

#### Current State
- In `src/app/leave/apply/page.tsx`, `getDuration()` computes duration in days, but there is no query to check whether the employee has sufficient leave balance remaining.

#### Implementation Design
1. When `form.employee_id`, `form.leave_type`, or `duration` changes:
   - Call `getLeaveBalances(year)` for `form.employee_id`.
   - Find matching balance record.
   - Compare requested `duration` against:
     - `annual_total - annual_used` (for Annual Leave)
     - `sick_total - sick_used` (for Sick Leave)
     - `casual_total - casual_used` (for Casual Leave)
2. If `remaining < duration`:
   - Display a non-blocking warning banner:
     ```tsx
     <div className={styles.warningBanner}>
       ⚠️ Warning: Requested duration ({duration} days) exceeds available balance ({remaining} days remaining). You may still submit for approval.
     </div>
     ```
3. Form submission remains enabled and unblocked.

---

### 10. R18: Attendance Auto-Mark Absent / Auto-Close Day Button

#### Current State
- `src/app/attendance/page.tsx` has checkbox-based bulk mark, but no dedicated "Auto-close Day" button for all unmarked employees.

#### Implementation Design
1. In `src/app/attendance/page.tsx`:
   - Add button in header toolbar: `<button className={styles.autoCloseBtn} onClick={handleAutoCloseDay}>🌙 Auto-close Day</button>`.
   - Visible only when `date <= today`.
2. Logic in `handleAutoCloseDay`:
   - Identify records with `!record.status`:
     ```typescript
     const unmarked = records.filter(r => !r.status).map(r => r.employee_id);
     if (unmarked.length === 0) {
       alert('All employees are already marked for this date.');
       return;
     }
     if (confirm(`Auto-mark ${unmarked.length} unmarked employee(s) as Absent for ${formatDate(date)}?`)) {
       await bulkMarkAttendance(unmarked, date, 'Absent');
       await fetchData();
     }
     ```

---

### 11. R19: Equipment Maintenance Notes

#### Current State
- `src/app/equipment/page.tsx` has fields for name, category, serial number, project, last maintenance date, and next maintenance date, but lacks `maintenance_notes`.

#### Implementation Design
1. **Schema Migration (`supabase/phase7_settings.sql`)**:
   ```sql
   ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_notes text;
   ```
2. **Interface (`src/lib/services/resourceService.ts`)**:
   ```typescript
   export interface Equipment {
     // ...
     maintenance_notes?: string | null;
   }
   ```
3. **Equipment Page (`src/app/equipment/page.tsx`)**:
   - Modal form: Add `maintenance_notes` `<textarea>` field.
   - Table rows: Add collapsible section `<details className={styles.notesDetails}><summary>Maintenance Notes</summary><p>{eq.maintenance_notes || 'No notes logged.'}</p></details>` or expandable row under each item.

---

### 12. R20: Safety Summary Cards on `/safety`

#### Current State
- `src/app/safety/page.tsx` renders the table directly without summary stat cards.

#### Implementation Design
1. Compute 3 metrics from loaded `incidents: SafetyIncident[]`:
   - `thisMonthIncidents`: incidents where `new Date(i.incident_date).getMonth() === currentMonth && new Date(i.incident_date).getFullYear() === currentYear`.
   - `openIncidents`: incidents where `i.status === 'Open' || i.status === 'Investigating'`.
   - `highSeverityIncidents`: incidents where `i.severity === 'Major' || i.severity === 'Critical' || i.severity === 'High'`.
2. Render top card grid:
   ```tsx
   <div className={styles.summaryGrid}>
     <div className={styles.sumCard}>
       <span className={styles.sumVal}>{thisMonthIncidents}</span>
       <span className={styles.sumLabel}>Incidents This Month</span>
     </div>
     <div className={styles.sumCard} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
       <span className={styles.sumVal} style={{ color: '#ef4444' }}>{openIncidents}</span>
       <span className={styles.sumLabel}>Open / Unresolved</span>
     </div>
     <div className={styles.sumCard} style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
       <span className={styles.sumVal} style={{ color: '#f59e0b' }}>{highSeverityIncidents}</span>
       <span className={styles.sumLabel}>High Severity / Critical</span>
     </div>
   </div>
   ```

---

### 13. R22: Project Completion Auto-Compute on `/projects/[id]`

#### Current State
- `src/app/projects/[id]/page.tsx` displays only the manual `project.completion_pct`.
- `tasks` are fetched via `getTasksByProject(id)` (line 25).

#### Implementation Design
1. When `tasks` are loaded:
   - If `tasks.length > 0`:
     - `completedCount = tasks.filter(t => t.status === 'Completed').length;`
     - `taskComputedPct = Math.round((completedCount / tasks.length) * 100);`
2. Display in Summary Cards & View Mode:
   - If `tasks.length > 0`:
     - Show both `Manual: ${project.completion_pct || 0}%` and `Task-Computed: ${taskComputedPct}% (${completedCount}/${tasks.length} tasks)`.
     - Render progress bar representing `taskComputedPct`.
   - If `tasks.length === 0`:
     - Show manual completion % only.
3. In Edit Mode:
   - Keep manual input for `completion_pct`, with helper label displaying `Auto-computed from tasks: ${taskComputedPct}%`.

---

## File Modification Matrix

| File Path | Requirements | Action / Changes |
|---|---|---|
| `src/app/leave/page.tsx` | R6, R16 | Auto-decrement leave balances on approval, add CSV export button |
| `src/lib/services/leaveBalancesService.ts` | R6 | Add `deductLeaveBalance()` helper |
| `src/app/leave/apply/page.tsx` | R17 | Add remaining balance warning banner |
| `src/app/shifts/schedules/page.tsx` | R9 | Implement full weekly calendar schedule view |
| `src/app/attendance/timesheets/page.tsx` | R10 | Implement weekly employee timesheet view |
| `src/app/attendance/corrections/page.tsx` | R10 | Implement audit log history with filters |
| `src/app/attendance/reports/page.tsx` | R10 | Implement monthly attendance aggregation report |
| `src/lib/services/attendanceService.ts` | R10, R5 | Add `getAllAuditLogs()`, support dynamic `marked_by` |
| `src/app/attendance/page.tsx` | R16, R18, R5 | Add Auto-close Day button, CSV export, pass logged-in user name |
| `src/app/payroll/page.tsx` | R11, R16, R21, R5 | Add History tab, PF/ESI/Tax deductions, CSV export, dynamic `generated_by` |
| `src/lib/services/payrollService.ts` | R11, R21, R5 | Add deduction fields to interfaces & computation |
| `src/app/tasks/page.tsx` | R13 | Add search & filter bar (project, status, priority) |
| `src/app/clients/page.tsx` | R13 | Add search (name/contact) & status filter |
| `src/app/contractors/page.tsx` | R13 | Add search (name/spec) & status filter |
| `src/app/vendors/page.tsx` | R13 | Add search (name/category) & status filter |
| `src/app/materials/page.tsx` | R13 | Add search & stock status filter (Healthy/Low Stock) |
| `src/app/procurement/page.tsx` | R13, R15 | Add vendor & status filter, dynamic line items in PO modal |
| `src/lib/services/resourceService.ts` | R15, R19 | Add `POLineItem`, update `PurchaseOrder`, add `maintenance_notes` to `Equipment` |
| `src/app/expenses/page.tsx` | R14 | Add receipt file upload & thumbnail/link display |
| `src/lib/services/financeService.ts` | R14 | Add `uploadReceipt()` to `receipts` bucket |
| `src/app/reports/site/page.tsx` | R16 | Add CSV export button |
| `src/app/equipment/page.tsx` | R19 | Add maintenance notes field in modal & collapsible row display |
| `src/app/safety/page.tsx` | R20, R5 | Add 3 severity/status summary stat cards, dynamic `reported_by` |
| `src/app/projects/[id]/page.tsx` | R22 | Auto-compute task completion % and render progress bar |
| `src/lib/utils/csvExport.ts` | R16 | Create reusable client-side Blob CSV generator |
| `supabase/phase7_settings.sql` | R15, R19, R21 | Add SQL for `line_items`, `maintenance_notes`, `pf_deduction`, `esi_deduction`, `tax_deduction` |

---

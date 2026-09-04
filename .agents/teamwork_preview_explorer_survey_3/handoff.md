# Handoff Report: Explorer 3 Codebase Survey

**Agent:** Explorer 3  
**Working Directory:** `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_explorer_survey_3`  
**Timestamp:** 2026-08-29T12:48:00Z  
**Type:** Hard Handoff (Investigation Complete)  

---

## 1. Observation

Direct code observations from inspecting the codebase:

1. **R6 (Leave Balances)**:
   - In `src/app/leave/page.tsx:29–36`, `handleStatusUpdate` invokes `updateLeaveStatus(id, status)` only. No decrement to `leave_balances` table occurs.
   - `leave_balances` in `supabase/phase3_4.sql:68–81` tracks `annual_used`, `sick_used`, `casual_used` against respective totals per `employee_id` and `year`.
   - `src/lib/services/leaveBalancesService.ts` contains `updateLeaveBalance(id, updates)` and `getLeaveBalances(year)`.
2. **R9 (Shift Schedules)**:
   - `src/app/shifts/schedules/page.tsx:15` contains verbatim text: `<div className={styles.loading}>Feature coming in Phase 5.</div>`.
   - `src/lib/services/shiftService.ts:33–40` provides `getEmployeeShifts()`, querying `employee_shifts` with joined `shifts(*)` and `employees(name, role)`.
3. **R10 (Attendance Sub-pages)**:
   - `src/app/attendance/timesheets/page.tsx:15` contains: `<div className={styles.loading}>Feature coming in Phase 5 (Advanced Payroll integration).</div>`.
   - `src/app/attendance/corrections/page.tsx:16` contains: `<div className={styles.loading}>Feature coming in Phase 5.</div>`.
   - `src/app/attendance/reports/page.tsx:16` contains: `<div className={styles.loading}>Feature coming in Phase 5.</div>`.
   - `src/lib/services/attendanceService.ts:153–163` currently limits `getAuditLog` to specific `employeeId` and `date`.
4. **R11 & R21 (Payroll History & Deductions)**:
   - `src/app/payroll/page.tsx` contains only current month payroll processing; no "History" tab exists.
   - `src/lib/services/payrollService.ts:161–170` exports `getAllPayrollRuns(month, year)` but it is not called by any UI component.
   - `payrollService.ts:98–102` computes only `absent_deduction` and `half_day_deduction`. No PF, ESI, or Tax fields are computed or persisted.
5. **R13 (Search & Filter)**:
   - In `src/app/tasks/page.tsx`, `src/app/clients/page.tsx`, `src/app/contractors/page.tsx`, `src/app/vendors/page.tsx`, `src/app/materials/page.tsx`, `src/app/procurement/page.tsx`, data is rendered directly into tables without filter controls or search state.
6. **R14 (Expense Receipt Upload)**:
   - `src/app/expenses/page.tsx:170–215` modal form has no `<input type="file">` for receipts.
   - `src/lib/services/financeService.ts:3–17` defines `Expense` with `receipt_url?: string | null;`.
7. **R15 (Purchase Order Line Items)**:
   - `src/app/procurement/page.tsx:113–152` modal has a single numerical `total_amount` input.
   - `purchase_orders` table in `supabase/phase1_2.sql:69–79` currently has no `line_items` column.
8. **R16 (CSV Export)**:
   - No CSV export button exists in `/attendance`, `/payroll`, `/reports/site`, or `/leave`.
9. **R17 (Leave Balance Warning)**:
   - `src/app/leave/apply/page.tsx:41–47` calculates duration but does not check remaining employee balance or display a warning.
10. **R18 (Attendance Auto-Mark Absent)**:
    - `src/app/attendance/page.tsx` has checkbox-based bulk mark, but no "Auto-close Day" button for unmarked employees.
11. **R19 (Equipment Maintenance Notes)**:
    - `src/app/equipment/page.tsx` has no maintenance notes textarea or collapsible notes display.
12. **R20 (Safety Summary Cards)**:
    - `src/app/safety/page.tsx:103–151` directly renders the table without summary cards.
13. **R22 (Project Completion Auto-compute)**:
    - `src/app/projects/[id]/page.tsx:102` displays only `project.completion_pct`. Tasks are fetched via `getTasksByProject(id)` on line 25.

---

## 2. Logic Chain

1. **Leave Balances Deduct (R6)**:
   - Observation: Leave approvals do not call `updateLeaveBalance`.
   - Reason: `handleStatusUpdate` only targets `leave_requests.status`.
   - Solution: On approval, compute duration in days, retrieve employee's balance record for the year, increment `[leave_type]_used`, and call `updateLeaveBalance`. If no record exists, skip silently.
2. **Weekly Shifts Calendar (R9)**:
   - Observation: `/shifts/schedules` is a Phase 5 stub; `getEmployeeShifts()` is available.
   - Reason: UI was never developed.
   - Solution: Build week-navigation state (Mon–Sun) and a matrix table showing employee names as rows and 7 days as columns with shift badges.
3. **Attendance Sub-Pages (R10)**:
   - Observation: 3 sub-pages are stubs.
   - Reason: Stubs were left pending from Phase 4.
   - Solution:
     - Timesheets: Filter by employee and week range; compute daily and weekly hours.
     - Corrections: Fetch all audit logs with employee & date range filters using extended `getAllAuditLogs()`.
     - Reports: Aggregate monthly attendance per employee (present, absent, half day, leave, % rate).
4. **Payroll History & Deductions (R11, R21)**:
   - Observation: History function exists but is unused; deductions only include absence.
   - Reason: History tab and statutory deductions (PF, ESI, Tax) were not integrated.
   - Solution: Add tab switcher on `/payroll`. Add PF (12%), ESI (1.75% for salary <= 21k), and Tax calculations. Save them to `payroll_runs` and display them in both processing and history views.
5. **Search & Filter (R13)**:
   - Observation: 6 list pages render raw arrays without search/filter bars.
   - Reason: Initial UI scaffolding only rendered default tables.
   - Solution: Implement client-side filtering state with search inputs and dropdown selectors.
6. **Expense Receipts (R14)**:
   - Observation: `receipt_url` exists in schema but no upload mechanism is wired.
   - Reason: Supabase Storage bucket integration was missing in frontend modal.
   - Solution: Integrate file picker, upload to `receipts` bucket in Supabase Storage, save public URL, and display receipt links.
7. **PO Line Items (R15)**:
   - Observation: `total_amount` is manually entered.
   - Reason: Dynamic item repeater was not built.
   - Solution: Add `line_items jsonb` migration, add interactive line items table in PO modal, and auto-calculate `total_amount`.
8. **CSV Export (R16)**:
   - Observation: Key report and list pages lack data export.
   - Reason: No CSV generator utility exists.
   - Solution: Implement a client-side Blob CSV utility (`csvExport.ts`) and hook "Export CSV" buttons into `/attendance`, `/payroll`, `/reports/site`, and `/leave`.
9. **Leave Balance Validation (R17)**:
   - Observation: `/leave/apply` allows submission without warning when balance is insufficient.
   - Reason: Balance check hook was omitted.
   - Solution: On date/type change, check available balance and display an amber warning without blocking form submission.
10. **Auto-Close Day (R18)**:
    - Observation: Unmarked attendance requires manual selection per employee.
    - Reason: No bulk auto-absent shortcut exists.
    - Solution: For `date <= today`, add "Auto-close Day" button to mark all `status = null` employees as Absent with confirmation.
11. **Equipment Notes (R19)**:
    - Observation: No maintenance notes in UI or schema.
    - Solution: Add `maintenance_notes` column, form textarea, and collapsible row details.
12. **Safety Summary (R20)**:
    - Observation: `/safety` lacks overview stat cards.
    - Solution: Compute `This Month`, `Open`, and `High Severity` incident counts from state and render stat cards above the table.
13. **Project Completion Auto-Compute (R22)**:
    - Observation: `/projects/[id]` only shows manual percentage.
    - Solution: When tasks exist, compute `(completed / total) * 100` and display as a progress indicator alongside manual value.

---

## 3. Caveats

1. **No Backend Shell Execution**: Typecheck was verified via static analysis of imports, types, and interfaces across all modules.
2. **Supabase Storage Bucket**: The `receipts` storage bucket must exist in Supabase or be created with public read access.
3. **Leave Types Normalization**: Leave types in the dropdown are "Annual Leave", "Sick Leave", "Casual Leave"; the balance decrement logic must match case-insensitively using substring matching (`annual`, `sick`, `casual`).
4. **SQL Migrations**: All column additions (`line_items` on `purchase_orders`, `maintenance_notes` on `equipment`, `pf_deduction`, `esi_deduction`, `tax_deduction` on `payroll_runs`) should be consolidated in `supabase/phase7_settings.sql`.

---

## 4. Conclusion

All 14 requirements assigned to Explorer 3 have been thoroughly surveyed. Complete file paths, function signatures, database schema changes, and UI layout patterns are identified and documented in detail in `survey_report_3.md`.

The proposed changes are modular, backward-compatible, and require no extra npm dependencies (pure React/TypeScript with native Blob CSV export and Supabase client).

---

## 5. Verification Method

To verify the planned implementation:
1. **Type Checking**:
   Ensure `npm run build` or `npx tsc --noEmit` passes with 0 errors.
2. **Leave Flow Verification (R6 & R17)**:
   - Open `/leave/apply`, select an employee and request 20 days. Verify the warning banner appears. Submit request.
   - In `/leave`, approve the request. Verify corresponding `leave_balances` row has its `used` count increased.
3. **Weekly Schedule (R9)**:
   - Navigate to `/shifts/schedules`. Verify weekly matrix loads with Mon–Sun columns and employee shifts.
4. **Attendance Sub-Pages (R10 & R18)**:
   - Navigate to `/attendance/timesheets` → verify employee weekly hours breakdown.
   - Navigate to `/attendance/corrections` → verify audit logs with filter.
   - Navigate to `/attendance/reports` → verify monthly attendance % calculations.
   - In `/attendance`, click "Auto-close Day" → verify unmarked employees change to `Absent`.
5. **Payroll (R11 & R21)**:
   - In `/payroll`, verify PF (12%), ESI (1.75%), and Tax columns calculate correctly.
   - Click "History" tab → verify past payroll runs display properly.
6. **Search & Filter (R13)**:
   - Test search and status dropdown filters on `/tasks`, `/clients`, `/contractors`, `/vendors`, `/materials`, `/procurement`.
7. **Expense Receipt (R14)**:
   - Upload an image on `/expenses` → verify receipt link opens uploaded image.
8. **PO Line Items (R15)**:
   - Add multiple line items in `/procurement` → verify total amount auto-calculates.
9. **CSV Export (R16)**:
   - Click "Export CSV" on `/attendance`, `/payroll`, `/reports/site`, `/leave` → verify `.csv` download contains valid rows.
10. **Equipment & Safety (R19, R20, R22)**:
    - Check collapsible maintenance notes on `/equipment`.
    - Check 3 summary cards on `/safety`.
    - Check task completion percentage progress on `/projects/[id]`.

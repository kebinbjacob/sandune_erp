# Original User Request

## 2026-08-29T12:41:47Z

Complete and fix all 30 pending items in the SanDune ERP & CRM system — a production Next.js 15 + Supabase app for construction/HR management — working in strict priority order (Critical → High → Medium → Nice-to-have). The codebase is already partially built with 14 Supabase services all wired to live data; the issues are gaps, stubs, and missing features.

Working directory: C:\Users\kelvin babu\Downloads\sandune-main\sandune-main
Integrity mode: development

---

## Context

- **Stack:** Next.js 15 (App Router), TypeScript, Supabase (Auth + Postgres + Storage), CSS Modules
- **Services:** All 14 service files in `src/lib/services/` are fully implemented and use the real Supabase client
- **Auth:** RBAC with 6 roles (`SUPER_ADMIN`, `ADMIN`, `HR_MANAGER`, `PROJECT_MANAGER`, `ENGINEER`, `VIEWER`) — logged-in user available via `useAuth()` hook from `src/lib/context/AuthContext.tsx`
- **API routes:** `src/app/api/admin/users/route.ts` handles POST/PUT/DELETE for user management via Supabase service role key
- **Styles:** Shared CSS module at `src/app/expenses/expenses.module.css` — all pages use this

---

## Requirements

### R1. Security Fix — Remove Plaintext Password Storage
In `src/app/profile/page.tsx`, the password change handler writes the plaintext password to the `app_users` table in addition to Supabase Auth. Remove the `app_users` password write entirely — Supabase Auth is the single source of truth. Also add a "Current Password" field that verifies the old password with `supabase.auth.signInWithPassword()` before allowing a change.

### R2. Dashboard — Live Data Aggregates
`src/app/page.tsx` currently shows hardcoded stat cards (employees, projects, revenue, clients, equipment, etc.) and hardcoded recent activity. Replace all hardcoded values with live Supabase queries:
- Total active employees → `COUNT` from `employees` where `status = 'Active'`
- Active projects → `COUNT` from `projects` where `status = 'Active'`
- Low-stock materials → `COUNT` from `materials` where `current_stock <= reorder_level`
- Total clients → `COUNT` from `clients`
- Equipment in use → `COUNT` from `equipment` where `status = 'In Use'`
- Recent activity → last 5 records joined across `leave_requests`, `expenses`, `site_reports`
- Create a `src/lib/services/dashboardService.ts` with these queries

### R3. Settings Page — Persist Company Info
`src/app/settings/page.tsx` has a company profile form and a preferences form with Save buttons that do nothing. Wire them to persist to Supabase:
- Create a `company_settings` table (key-value store: `key TEXT PRIMARY KEY, value TEXT`) or use a single-row settings table
- Save and load: company name, registration number, address, timezone, currency
- Create migration SQL at `supabase/phase7_settings.sql`

### R4. Delete Operation — All CRUD Pages
Every list page is missing a Delete button. Add a delete action with a confirmation dialog to every module:
- `/materials` — delete material
- `/equipment` — delete equipment
- `/procurement` — delete purchase order
- `/clients` — delete client
- `/contractors` — delete contractor
- `/vendors` — delete vendor
- `/expenses` — delete expense
- `/shifts` — delete shift and/or shift assignment
- `/projects` — delete project (from list and detail page)
- `/tasks` and `/tasks/board` — delete task
- `/reports/site` — delete site report
- `/safety` — delete safety incident
- `/leave` — withdraw/delete leave request
- `/leave/balances` — delete leave balance record

Each delete must call the existing service function (or add a `deleteX()` function if one doesn't exist yet), show a `confirm()` dialog before deleting, and reload the list on success.

### R5. `marked_by` / `generated_by` — Use Logged-In User
In `/attendance`, `/payroll`, and `/safety`, the `marked_by` / `generated_by` field is hardcoded as the string `'Admin'`. Replace with the actual logged-in user's name from `useAuth()` context: `currentUser?.employees?.name || currentUser?.email || 'System'`.

### R6. Leave Balances — Auto-Decrement on Approval
In `src/app/leave/page.tsx`, when `updateLeaveStatus(id, 'Approved')` is called, also call `updateLeaveBalance()` to decrement the corresponding leave type (annual, sick, or casual) for that employee by the number of days in the request. If no balance record exists for the employee, skip silently.

### R7. Fix `/projects/new` Broken Route
`src/app/projects/new/page.tsx` re-exports from a non-existent `/create/page` path. Fix by either:
- Redirecting to `/projects` using `next/navigation` `redirect()`
- Or implementing it as a standalone "New Project" form page

### R8. Task Editing — Wire `updateTask()` to UI
`updateTask()` exists in `src/lib/services/taskService.ts` but is never called. Add an Edit Task modal to both `/tasks` (list view) and `/tasks/board` (kanban). The modal should allow editing: title, description, status, priority, assigned employee, due date, and project.

### R9. `/shifts/schedules` — Implement Schedule View
Replace the "Feature coming in Phase 5" stub with a working weekly calendar view. Load data from `getEmployeeShifts()` (already implemented in `shiftService.ts`) and display assignments grouped by day of the week. A simple table-based weekly view (Mon–Sun columns, employee rows) is sufficient.

### R10. Attendance Sub-pages — Implement All Three Stubs
Replace "Feature coming in Phase 5" stubs on all three routes:

- **`/attendance/timesheets`** — Weekly timesheet view: load attendance records for a selected employee + week, show daily hours worked (based on check-in/check-out if available, otherwise attendance status), and total hours for the week.
- **`/attendance/corrections`** — List attendance audit log from `getAuditLog()` (already in `attendanceService.ts`). Allow filtering by employee and date range.
- **`/attendance/reports`** — Monthly attendance summary per employee: present/absent/late counts, attendance %, using data already in the `attendance` table.

### R11. Payroll History Tab
On `/payroll`, add a "History" tab alongside the main payroll view. Use `getAllPayrollRuns()` from `payrollService.ts` (already implemented, never called) to show past payroll runs grouped by month/year with employee name, gross pay, deductions, and net pay.

### R12. Project → Client Linkage
In the project create/edit form (both in `/projects` modal and `/projects/[id]`), replace the free-text `client` field with a `<select>` dropdown populated from `getClients()`. Store the selected client name (or id if the schema supports it) on the project record.

### R13. Search & Filter on List Pages
Add a search/filter bar to the following pages:
- `/tasks` — filter by project, status, priority
- `/clients` — search by name, filter by status
- `/contractors` — search by name, filter by status
- `/vendors` — search by name, filter by status
- `/materials` — search by name, filter by stock status (Healthy/Low Stock)
- `/procurement` — filter by vendor, status

All filtering should be client-side (filter the already-loaded array) — no additional DB queries needed.

### R14. Expense Receipt Upload
Add a file input to the expense create/edit form in `/expenses` that:
- Uploads the selected file to the Supabase Storage `receipts` bucket
- Saves the resulting public URL to `expenses.receipt_url`
- Shows a link/thumbnail of the receipt if `receipt_url` is set on existing records

### R15. Purchase Order Line Items
Add a `po_items` section to the purchase order create/edit modal in `/procurement`:
- Allow adding multiple line items (description, quantity, unit price)
- Auto-calculate the PO total from line items
- Store as a `JSONB` column `line_items` on the `purchase_orders` table (add via migration `supabase/phase7_settings.sql`)

### R16. CSV Export on Key Pages
Add an "Export CSV" button to the following pages that downloads the current table data as a `.csv` file (client-side, using a Blob URL — no library required):
- `/attendance` — export current day's attendance
- `/payroll` — export current payroll run
- `/reports/site` — export site reports list
- `/leave` — export leave requests list

### R17. Leave Balance Validation on Apply
In `/leave/apply`, before submitting, check the employee's current leave balance for the selected leave type. If remaining balance < requested days, show a warning message below the form (not an alert). Still allow submission — the warning is informational only.

### R18. Attendance — Auto-Mark Absent Button
On `/attendance`, add an "Auto-close Day" button (only visible when the selected date is today or past). When clicked with confirmation, it marks all employees whose attendance is currently `null` / not marked as `Absent` for that date using `bulkMarkAttendance()`.

### R19. Equipment Maintenance Log
On `/equipment`, add a "Maintenance Notes" text field to the create/edit form. Display it as a collapsible section on each equipment row. This stores notes in the existing `equipment` table (add a `maintenance_notes TEXT` column if not present, via migration).

### R20. Safety — Severity Summary Cards
On `/safety`, add 3 summary stat cards at the top of the page (above the table):
- Total incidents this month
- Open/Unresolved incidents
- High-severity incidents (where `severity = 'High'` or `'Critical'`)
Compute from the already-loaded `incidents` array — no extra queries.

### R21. Payroll — Tax/Deduction Fields
Add optional deduction fields to the payroll computation in `/payroll`:
- PF (Provident Fund) % — default 12%
- ESI % — default 1.75% (only if salary < threshold)
- Tax (flat amount or %)
Show deducted amounts as separate columns in the payroll table. Save as part of `payroll_runs` record (add columns if needed via migration).

### R22. Project Completion Auto-Compute
On `/projects/[id]`, when tasks are loaded via `getTasksByProject()`, auto-compute the project completion percentage as `(completed tasks / total tasks) * 100`. Display it as a read-only progress bar alongside the manual completion % field. If there are no tasks, show the manual value only.

---

## Acceptance Criteria

### Security
- [ ] `app_users.password` is never written during profile password change
- [ ] Password change requires current password to be verified first

### Dashboard
- [ ] All 6 stat cards show live counts from Supabase (not hardcoded numbers)
- [ ] Recent activity shows real records from the DB (not hardcoded text)
- [ ] `dashboardService.ts` exists in `src/lib/services/`

### Settings
- [ ] Company name, registration, and address persist across page reloads
- [ ] `phase7_settings.sql` migration file exists and creates the settings table

### Delete
- [ ] Every CRUD page (14 modules listed in R4) has a Delete button
- [ ] Clicking Delete shows a confirmation dialog before calling the service
- [ ] After deletion the list reloads and the record is gone

### marked_by
- [ ] No page uses the hardcoded string `'Admin'` for `marked_by` or `generated_by`
- [ ] The logged-in user's name or email appears in these fields

### Leave Balances
- [ ] Approving a leave request decrements the correct leave type balance
- [ ] If no balance record exists, approval still succeeds silently

### Broken Route
- [ ] `/projects/new` does not crash; it either redirects or shows a working form

### Task Editing
- [ ] An Edit modal exists on `/tasks` and `/tasks/board`
- [ ] Saving calls `updateTask()` and the list refreshes with updated data

### Stubs Implemented
- [ ] `/shifts/schedules` shows a weekly calendar with real assignment data
- [ ] `/attendance/timesheets` shows a per-employee weekly view
- [ ] `/attendance/corrections` shows the audit log with filter
- [ ] `/attendance/reports` shows monthly summary per employee

### TypeScript
- [ ] `npx tsc --noEmit` exits with code 0 — no type errors anywhere

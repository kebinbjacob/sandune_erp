# Project: SanDune ERP & CRM 30-Item Completion

## Architecture
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Backend / Database**: Supabase PostgreSQL, Supabase Auth (RBAC), Supabase Storage
- **Styling**: Vanilla CSS / CSS Modules (`src/app/expenses/expenses.module.css`, `globals.css`)
- **State & Services**: 14+ modular services in `src/lib/services/` wired to live Supabase client

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| R1 | Security Fix Profile | Remove plaintext password write to app_users, add current password verification via signInWithPassword | M1 (DONE) | ORIGINAL_REQUEST §R1 |
| R2 | Live Dashboard Aggregates | Create dashboardService.ts and wire live metrics and recent activities in page.tsx | M1 (DONE) | ORIGINAL_REQUEST §R2 |
| R3 | Settings Persistence | Create company_settings table migration phase7_settings.sql and persist in settings/page.tsx | M1 (DONE) | ORIGINAL_REQUEST §R3 |
| R7 | Fix /projects/new Route | Implement standalone new project form in projects/new/page.tsx invoking createProject | M1 (DONE) | ORIGINAL_REQUEST §R7 |
| R4 | Universal Delete Action | Add delete functions to all 9 services and delete buttons with confirm() to all 14 CRUD pages | M2 (DONE) | ORIGINAL_REQUEST §R4 |
| R5 | User Context Audit | Replace hardcoded 'Admin' with useAuth() user name/email in attendance, payroll, safety | M2 (DONE) | ORIGINAL_REQUEST §R5 |
| R6 | Leave Balances Auto-decrement | Decrement leave_balances table on approval in leave/page.tsx | M3 | ORIGINAL_REQUEST §R6 |
| R8 | Task Editing Modal | Add edit task modal in /tasks list and /tasks/board kanban calling updateTask() | M3 | ORIGINAL_REQUEST §R8 |
| R12 | Project Client Linkage | Replace free-text client input with dropdown from getClients() in projects modal & [id] | M3 | ORIGINAL_REQUEST §R12 |
| R14 | Expense Receipt Upload | File input uploading to Supabase Storage receipts bucket and saving receipt_url in /expenses | M3 | ORIGINAL_REQUEST §R14 |
| R15 | PO Line Items | Interactive line items repeater with auto-computed total saved to line_items JSONB | M3 | ORIGINAL_REQUEST §R15 |
| R17 | Leave Balance Validation | Warning banner on /leave/apply when requested days exceed remaining balance | M3 | ORIGINAL_REQUEST §R17 |
| R18 | Attendance Auto-close Day | Button to mark all unmarked employees as Absent on past/today dates with confirmation | M3 | ORIGINAL_REQUEST §R18 |
| R19 | Equipment Maintenance Notes | Maintenance notes field and collapsible notes row on /equipment | M3 | ORIGINAL_REQUEST §R19 |
| R20 | Safety Summary Cards | 3 summary cards (Total this month, Open incidents, High severity) on /safety | M3 | ORIGINAL_REQUEST §R20 |
| R22 | Project Completion Auto-compute | Auto-compute (completed/total)*100 progress bar on /projects/[id] | M3 | ORIGINAL_REQUEST §R22 |
| R9 | Weekly Shifts Calendar | Implement /shifts/schedules weekly Mon-Sun matrix with getEmployeeShifts() | M4 | ORIGINAL_REQUEST §R9 |
| R10 | Attendance Sub-page Stubs | Implement /attendance/timesheets, /attendance/corrections, /attendance/reports | M4 | ORIGINAL_REQUEST §R10 |
| R11 | Payroll History Tab | History tab in /payroll using getAllPayrollRuns() | M4 | ORIGINAL_REQUEST §R11 |
| R13 | Search & Filter on Lists | Client-side search and filters on /tasks, /clients, /contractors, /vendors, /materials, /procurement | M4 | ORIGINAL_REQUEST §R13 |
| R16 | CSV Export Utility | Blob CSV export on /attendance, /payroll, /reports/site, /leave | M4 | ORIGINAL_REQUEST §R16 |
| R21 | Payroll Tax & Deductions | PF (12%), ESI (1.75%), Tax calculation and columns in /payroll and payroll_runs | M4 | ORIGINAL_REQUEST §R21 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Critical Security, Dashboard & Settings | R1, R2, R3, R7 | None | DONE |
| 2 | Universal Delete Actions & User Context | R4, R5 | M1 | DONE |
| 3 | Core Operations & Workflows | R6, R8, R12, R14, R15, R17, R18, R19, R20, R22 | M1, M2 | IN_PROGRESS |
| 4 | Calendar, Attendance Stubs, Payroll & Polish | R9, R10, R11, R13, R16, R21 | M1, M2, M3 | PLANNED |
| 5 | Full Verification & Forensic Audit | E2E Typecheck, Acceptance Tests, Integrity Audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Dashboard Service
- `src/lib/services/dashboardService.ts`:
  - `getDashboardMetrics()`: returns `{ activeEmployees, activeProjects, lowStockMaterials, totalClients, equipmentInUse, revenue }`
  - `getRecentActivities()`: returns unified recent activity list sorted by timestamp descending

### Settings & Schema
- `supabase/phase7_settings.sql`: creates `company_settings` (key text PK, value text), adds columns `line_items` to `purchase_orders`, `maintenance_notes` to `equipment`, `pf_deduction`, `esi_deduction`, `tax_deduction` to `payroll_runs`.
- `src/lib/services/settingsService.ts`: `getCompanySettings()`, `saveCompanySettings(settings)`

### Universal Deletes
- `src/lib/services/*.ts`: `deleteMaterial`, `deleteEquipment`, `deletePurchaseOrder`, `deleteClient`, `deleteContractor`, `deleteVendor`, `deleteExpense`, `deleteShift`, `deleteEmployeeShift`, `deleteProject`, `deleteTask`, `deleteSiteReport`, `deleteSafetyIncident`, `deleteLeaveRequest`, `deleteLeaveBalance`

### User Context
- `useAuth()` in `@/lib/context/AuthContext`: provides `user?.employees?.name || user?.email || 'System'`

### CSV Export Utility
- `src/lib/utils/csvExport.ts`: `exportToCsv(filename: string, headers: string[], rows: (string | number)[][])`

## Code Layout
- `src/app/`: Next.js App Router pages and routes
- `src/lib/services/`: Supabase database service layer
- `src/lib/context/`: Auth and Application React Contexts
- `src/lib/utils/`: Shared helper functions (CSV exporter, date utilities)
- `supabase/`: Database migration SQL scripts

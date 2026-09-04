## 2026-08-29T12:59:13Z
You are Worker 2 implementing Milestone 2 (Universal Delete Operations & User Context Audit) for SanDune ERP.
Working Directory: C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_worker_m2_1

Please read:
1. Original Request: `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\ORIGINAL_REQUEST.md`
2. Survey Blueprint: `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_explorer_survey_2\survey_report_2.md`
3. Scope & Contracts: `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\PROJECT.md`

Your tasks:
- **R4 (Universal Delete Operations across 14 CRUD modules)**:
  1. Add missing delete functions to all 9 service files in `src/lib/services/`:
     - `resourceService.ts`: `deleteMaterial(id: string)`, `deleteEquipment(id: string)`, `deletePurchaseOrder(id: string)`
     - `crmService.ts`: `deleteClient(id: string)`, `deleteContractor(id: string)`, `deleteVendor(id: string)`
     - `financeService.ts`: `deleteExpense(id: string)`
     - `shiftService.ts`: `deleteShift(id: string)`, `deleteEmployeeShift(id: string)`
     - `projectService.ts`: `deleteProject(id: string)`, `deleteTask(id: string)`
     - `taskService.ts`: `deleteTask(id: string)`
     - `operationsService.ts`: `deleteSiteReport(id: string)`, `deleteSafetyIncident(id: string)`
     - `leaveService.ts`: `deleteLeaveRequest(id: string)`
     - `leaveBalancesService.ts`: `deleteLeaveBalance(id: string)`
  2. Add Delete buttons with `window.confirm()` confirmation prompts and table reloading to all 14 pages:
     - `/materials` (`src/app/materials/page.tsx`)
     - `/equipment` (`src/app/equipment/page.tsx`)
     - `/procurement` (`src/app/procurement/page.tsx`)
     - `/clients` (`src/app/clients/page.tsx`)
     - `/contractors` (`src/app/contractors/page.tsx`)
     - `/vendors` (`src/app/vendors/page.tsx`)
     - `/expenses` (`src/app/expenses/page.tsx`)
     - `/shifts` (`src/app/shifts/page.tsx`)
     - `/projects` (`src/app/projects/page.tsx`) and `/projects/[id]` (`src/app/projects/[id]/page.tsx`)
     - `/tasks` (`src/app/tasks/page.tsx`) and `/tasks/board` (`src/app/tasks/board/page.tsx`)
     - `/reports/site` (`src/app/reports/site/page.tsx`)
     - `/safety` (`src/app/safety/page.tsx`)
     - `/leave` (`src/app/leave/page.tsx`)
     - `/leave/balances` (`src/app/leave/balances/page.tsx`)
  Each delete must show a confirmation dialog before deleting, call the service function, and refresh data upon success.

- **R5 (`marked_by` / `generated_by` User Context Audit)**:
  - In `src/lib/services/attendanceService.ts`, make `markAttendance` and `bulkMarkAttendance` accept `markedBy?: string` (defaulting to `'System'`), replacing hardcoded `'Admin'`.
  - In `src/lib/services/payrollService.ts`, make `savePayrollRun` accept `generatedBy?: string` (defaulting to `'System'`), replacing hardcoded `'Admin'`.
  - In `src/app/attendance/page.tsx`, `src/app/payroll/page.tsx`, and `src/app/safety/page.tsx`:
    Import and invoke `useAuth()` from `@/lib/context/AuthContext`, and pass the user's name: `user?.employees?.name || user?.email || 'System'`. Ensure no hardcoded `'Admin'` string is used for creator / marker tracking.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

After implementation:
- Run `npx tsc --noEmit` to verify 0 type errors.
- Document all modified/created files and test results in `handoff.md` and send a message back.

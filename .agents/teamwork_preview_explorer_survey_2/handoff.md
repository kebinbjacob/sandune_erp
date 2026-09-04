# Handoff Report — Explorer 2 Survey (R4: Universal Delete & R5: User Context Audit)

## 1. Observation
Direct source code inspection of the SanDune ERP codebase revealed the following exact states:

### 1.1 R4: Universal Delete Operations
- `src/lib/services/resourceService.ts`: Exports `getMaterials`, `createMaterial`, `updateMaterial`, `getEquipment`, `createEquipment`, `updateEquipment`, `getPurchaseOrders`, `createPurchaseOrder`, `updatePurchaseOrder`. **No delete functions exist** (`deleteMaterial`, `deleteEquipment`, `deletePurchaseOrder` are absent).
- `src/lib/services/crmService.ts`: Exports `getClients`, `createClient`, `updateClient`, `getContractors`, `createContractor`, `updateContractor`, `getVendors`, `createVendor`, `updateVendor`. **No delete functions exist** (`deleteClient`, `deleteContractor`, `deleteVendor` are absent).
- `src/lib/services/financeService.ts`: Exports `getExpenses`, `createExpense`, `updateExpenseStatus`, `updateExpense`. **No `deleteExpense` exists**.
- `src/lib/services/shiftService.ts`: Exports `getShifts`, `createShift`, `getEmployeeShifts`, `assignShift`, `updateShift`, `updateEmployeeShift`. **No `deleteShift` or `deleteEmployeeShift` exist**.
- `src/lib/services/projectService.ts`: Exports `getProjects`, `getProject`, `createProject`, `updateProject`, `getTasksByProject`, `createTask`, `updateTaskStatus`. **No `deleteProject` or `deleteTask` exist**.
- `src/lib/services/taskService.ts`: Exports `getAllTasks`, `createTask`, `updateTaskStatus`, `updateTask`. **No `deleteTask` exists**.
- `src/lib/services/operationsService.ts`: Exports `getSiteReports`, `createSiteReport`, `updateSiteReport`, `getSafetyIncidents`, `createSafetyIncident`, `updateIncidentStatus`, `updateSafetyIncident`. **No `deleteSiteReport` or `deleteSafetyIncident` exist**.
- `src/lib/services/leaveService.ts`: Exports `getLeaveRequests`, `createLeaveRequest`, `updateLeaveStatus`, `getEmployees`. **No `deleteLeaveRequest` exists**.
- `src/lib/services/leaveBalancesService.ts`: Exports `getLeaveBalances`, `createLeaveBalance`, `updateLeaveBalance`. **No `deleteLeaveBalance` exists**.
- All 14 UI list pages (`/materials`, `/equipment`, `/procurement`, `/clients`, `/contractors`, `/vendors`, `/expenses`, `/shifts`, `/projects`, `/tasks`, `/reports/site`, `/safety`, `/leave`, `/leave/balances`): Table Action columns contain only "Edit" (or status dropdowns/approvals) and completely lack Delete buttons.

### 1.2 R5: Hardcoded `'Admin'` in User Tracking
- `src/lib/services/attendanceService.ts`:
  * Line 104: `.update({ status, notes: reason, remarks, marked_by: 'Admin' })`
  * Line 114: `.insert([{ employee_id: employeeId, date, status, notes: reason, remarks, marked_by: 'Admin' }])`
  * Line 128: `changed_by: 'Admin'` in `attendance_audit_log` insert.
- `src/lib/services/payrollService.ts`:
  * Line 141: `generated_by: 'Admin'` in `savePayrollRun` payload.
- `src/app/safety/page.tsx`:
  * Line 129: `Reported by: {i.employees?.name || 'Admin'}`
  * Line 171: `<option value="">Admin (Self)</option>`
- `src/app/attendance/page.tsx`, `src/app/payroll/page.tsx`, and `src/app/safety/page.tsx`: None of these pages import or invoke `useAuth()` from `@/lib/context/AuthContext`.

---

## 2. Logic Chain
1. **From Observation 1.1:** Since none of the 14 CRUD services possess `delete*` functions and none of the corresponding frontend pages render Delete action triggers, any user attempting to delete a record is blocked from doing so at both the UI and service layers.
2. **From Schema Inspection (`supabase/*.sql`):** The Postgres schema defines cascade rules (`ON DELETE CASCADE` for tasks, expenses, site_reports, safety_incidents, purchase_orders on `project_id`, and `ON DELETE CASCADE` on `employee_shifts` and `leave_balances`). Therefore, implementing direct single-row `supabase.from(table).delete().eq('id', id)` operations is safe and will not leave orphaned child records in related cascading tables.
3. **From Observation 1.2:** Hardcoding `'Admin'` violates multi-user accountability and auditability. The auth provider (`AuthContext.tsx`) provides `user: AppUser | null` with nested `employees: Employee` data.
4. **Conclusion Support:** Adding the 15 missing delete functions to the 9 service files, connecting them to UI buttons with `window.confirm()` confirmation dialogues, and passing `user?.employees?.name || user?.email || 'System'` from `useAuth()` into `markAttendance`, `bulkMarkAttendance`, `savePayrollRun`, and incident logging fully satisfies R4 and R5.

---

## 3. Caveats
- Project deletion cascade: Deleting a project will automatically cascade-delete all related tasks, site reports, and safety incidents in Postgres due to `ON DELETE CASCADE`. Users should be cautioned in the confirmation dialog (`"Are you sure you want to delete this project? This will also remove all associated tasks and reports."`).
- For `/safety`, `reported_by` in the DB schema is a `uuid REFERENCES employees(id)`. When storing to `safety_incidents`, if the current user has a linked employee record, `user.employees.id` (or `user.employee_id`) should be passed, while the UI display falls back gracefully to `user.employees?.name || user.email || 'System'`.

---

## 4. Conclusion
1. **R4 Deliverables:**
   - Add 15 delete functions across 9 service files in `src/lib/services/`.
   - Update 14 UI list pages to add Delete buttons in table action cells and card actions, prompt confirmation dialogs, call the corresponding service delete function, and refresh table data asynchronously on completion.
2. **R5 Deliverables:**
   - Refactor `attendanceService.ts` and `payrollService.ts` to accept optional `markedBy?: string` and `generatedBy?: string` arguments defaulting to `'System'`.
   - Update `src/app/attendance/page.tsx`, `src/app/payroll/page.tsx`, and `src/app/safety/page.tsx` to consume `useAuth()` context and pass the resolved logged-in user name.

---

## 5. Verification Method
- **Static Inspection:** Review `src/lib/services/` and `src/app/` against `survey_report_2.md` to confirm all 15 delete functions and 14 UI delete buttons exist.
- **Type Checking:** Run `npx tsc --noEmit` — must pass with 0 errors.
- **Unit & Integration Testing:** Run `npm test` or Jest on service test files to ensure deletion functions correctly call `supabase.from(...).delete().eq('id', id)`.
- **Runtime Verification:** Log into the application, navigate to each of the 14 CRUD list pages, verify clicking Delete displays a confirmation prompt, and confirming removes the row and refreshes the list. Verify that attendance marking, payroll generation, and safety reports record the logged-in user's identity rather than `'Admin'`.

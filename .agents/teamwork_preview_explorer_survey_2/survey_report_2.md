# SanDune ERP Codebase Survey Report — Explorer 2
**Scope:** 
1. **R4: Universal Delete Operation** across all 14 CRUD list pages and their underlying services.
2. **R5: `marked_by` / `generated_by` Logged-In User Context** in `/attendance`, `/payroll`, and `/safety` using `useAuth()`.

---

## 1. Executive Summary

- **R4 (Universal Delete):** Across the entire codebase, only `employeeService.ts` (`deleteEmployee`) and `userService.ts` (`deleteUser`) possess a delete method. All 14 CRUD list pages lack Delete functionality in both their frontend UI and their corresponding service files (`resourceService.ts`, `crmService.ts`, `financeService.ts`, `shiftService.ts`, `projectService.ts`, `taskService.ts`, `operationsService.ts`, `leaveService.ts`, `leaveBalancesService.ts`). A total of **15 missing service functions** must be added, and delete actions with standard `window.confirm()` confirmation modals/dialogs and asynchronous table reloads must be wired into all 14 pages.
- **R5 (`marked_by` / `generated_by`):** Hardcoded string `'Admin'` was identified across `attendanceService.ts` (lines 104, 114, 128), `payrollService.ts` (line 141), and UI fallbacks / labels in `src/app/safety/page.tsx` (lines 129, 171). None of `/attendance`, `/payroll`, or `/safety` currently import or use `useAuth()`. The service functions must be refactored to accept `markedBy?: string` / `generatedBy?: string`, and the UI components must extract `const { user } = useAuth()` to pass `user?.employees?.name || user?.email || 'System'`.

---

## 2. R4: Universal Delete Operation Analysis

### 2.1 Complete Inventory of 14 CRUD Modules

| # | Route / UI File | Service File | Database Table | Existing Service Delete? | New Function to Add | UI Location & Interaction | Confirmation Dialog Prompt | Reload Method |
|---|---|---|---|---|---|---|---|---|
| **1** | `/materials`<br>`src/app/materials/page.tsx` | `resourceService.ts` | `materials` | ❌ None | `deleteMaterial(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete material \"${item_name}\"?"` | `await deleteMaterial(id); await load();` |
| **2** | `/equipment`<br>`src/app/equipment/page.tsx` | `resourceService.ts` | `equipment` | ❌ None | `deleteEquipment(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete equipment \"${name}\"?"` | `await deleteEquipment(id); await load();` |
| **3** | `/procurement`<br>`src/app/procurement/page.tsx` | `resourceService.ts` | `purchase_orders` | ❌ None | `deletePurchaseOrder(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete purchase order \"${po_number}\"?"` | `await deletePurchaseOrder(id); await load();` |
| **4** | `/clients`<br>`src/app/clients/page.tsx` | `crmService.ts` | `clients` | ❌ None | `deleteClient(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete client \"${name}\"?"` | `await deleteClient(id); await load();` |
| **5** | `/contractors`<br>`src/app/contractors/page.tsx` | `crmService.ts` | `contractors` | ❌ None | `deleteContractor(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete contractor \"${name}\"?"` | `await deleteContractor(id); await load();` |
| **6** | `/vendors`<br>`src/app/vendors/page.tsx` | `crmService.ts` | `vendors` | ❌ None | `deleteVendor(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete vendor \"${name}\"?"` | `await deleteVendor(id); await load();` |
| **7** | `/expenses`<br>`src/app/expenses/page.tsx` | `financeService.ts` | `expenses` | ❌ None | `deleteExpense(id: string): Promise<void>` | Table Actions column button alongside Status select & "Edit" | `"Are you sure you want to delete expense \"${title}\"?"` | `await deleteExpense(id); await load();` |
| **8a** | `/shifts` (Shift Assignment)<br>`src/app/shifts/page.tsx` | `shiftService.ts` | `employee_shifts` | ❌ None | `deleteEmployeeShift(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete this shift assignment?"` | `await deleteEmployeeShift(id); await load();` |
| **8b** | `/shifts` (Shift Definition)<br>`src/app/shifts/page.tsx` | `shiftService.ts` | `shifts` | ❌ None | `deleteShift(id: string): Promise<void>` | Shift Summary Card delete button / Shift Edit Modal | `"Are you sure you want to delete shift \"${name}\"?"` | `await deleteShift(id); await load();` |
| **9a** | `/projects` (List)<br>`src/app/projects/page.tsx` | `projectService.ts` | `projects` | ❌ None | `deleteProject(id: string): Promise<void>` | Project Card footer button alongside "View Details →" | `"Are you sure you want to delete project \"${name}\"? This action cannot be undone."` | `await deleteProject(id); await load();` |
| **9b** | `/projects/[id]` (Detail)<br>`src/app/projects/[id]/page.tsx` | `projectService.ts` | `projects` | ❌ None | Uses `deleteProject(id)` | Header action button "Delete Project" | `"Are you sure you want to delete this project? This action cannot be undone."` | `await deleteProject(id); router.push('/projects');` |
| **10a** | `/tasks` (List View)<br>`src/app/tasks/page.tsx` | `taskService.ts` | `tasks` | ❌ None | `deleteTask(id: string): Promise<void>` | New "Actions" table column with Edit and Delete buttons | `"Are you sure you want to delete task \"${title}\"?"` | `await deleteTask(id); await load();` |
| **10b** | `/tasks/board` (Kanban)<br>`src/app/tasks/board/page.tsx` | `taskService.ts` | `tasks` | ❌ None | Uses `deleteTask(id)` | Task card header/actions button | `"Are you sure you want to delete task \"${title}\"?"` | `await deleteTask(id); await load();` |
| **11** | `/reports/site`<br>`src/app/reports/site/page.tsx` | `operationsService.ts` | `site_reports` | ❌ None | `deleteSiteReport(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete this site report?"` | `await deleteSiteReport(id); await load();` |
| **12** | `/safety`<br>`src/app/safety/page.tsx` | `operationsService.ts` | `safety_incidents` | ❌ None | `deleteSafetyIncident(id: string): Promise<void>` | Table Actions column button alongside Status select & "Edit" | `"Are you sure you want to delete this safety incident?"` | `await deleteSafetyIncident(id); await load();` |
| **13** | `/leave`<br>`src/app/leave/page.tsx` | `leaveService.ts` | `leave_requests` | ❌ None | `deleteLeaveRequest(id: string): Promise<void>` | Table Actions column (Add "Withdraw/Delete" button) | `"Are you sure you want to withdraw/delete this leave request?"` | `await deleteLeaveRequest(id); await fetchRequests();` |
| **14** | `/leave/balances`<br>`src/app/leave/balances/page.tsx` | `leaveBalancesService.ts` | `leave_balances` | ❌ None | `deleteLeaveBalance(id: string): Promise<void>` | Table Actions column button alongside "Edit" | `"Are you sure you want to delete leave balance for this employee?"` | `await deleteLeaveBalance(id); await load();` |

---

### 2.2 Detailed Implementation Plan for Service Delete Functions

All service delete functions must follow the unified Supabase error-handling pattern:

```typescript
// 1. src/lib/services/resourceService.ts
export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw error;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
  if (error) throw error;
}

// 2. src/lib/services/crmService.ts
export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteContractor(id: string): Promise<void> {
  const { error } = await supabase.from('contractors').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteVendor(id: string): Promise<void> {
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  if (error) throw error;
}

// 3. src/lib/services/financeService.ts
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// 4. src/lib/services/shiftService.ts
export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase.from('shifts').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteEmployeeShift(id: string): Promise<void> {
  const { error } = await supabase.from('employee_shifts').delete().eq('id', id);
  if (error) throw error;
}

// 5. src/lib/services/projectService.ts & taskService.ts
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// 6. src/lib/services/operationsService.ts
export async function deleteSiteReport(id: string): Promise<void> {
  const { error } = await supabase.from('site_reports').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteSafetyIncident(id: string): Promise<void> {
  const { error } = await supabase.from('safety_incidents').delete().eq('id', id);
  if (error) throw error;
}

// 7. src/lib/services/leaveService.ts
export async function deleteLeaveRequest(id: string): Promise<void> {
  const { error } = await supabase.from('leave_requests').delete().eq('id', id);
  if (error) throw error;
}

// 8. src/lib/services/leaveBalancesService.ts
export async function deleteLeaveBalance(id: string): Promise<void> {
  const { error } = await supabase.from('leave_balances').delete().eq('id', id);
  if (error) throw error;
}
```

### 2.3 UI Button Styling & Pattern

For consistent UI presentation across modules using `src/app/expenses/expenses.module.css`:
- Danger / Delete Button Class:
  ```css
  .dangerBtn, .deleteBtn {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .dangerBtn:hover, .deleteBtn:hover {
    background: rgba(239, 68, 68, 0.3);
    color: #fff;
  }
  ```
- Standard Action Row Layout:
  ```tsx
  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
    <button className={styles.actionSelect} onClick={() => openModal(item)}>Edit</button>
    <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Delete</button>
  </div>
  ```

---

## 3. R5: `marked_by` / `generated_by` Logged-In User Context Analysis

### 3.1 Context Architecture

- **Context Provider:** `src/lib/context/AuthContext.tsx` (`useAuth()`).
- **User Profile Structure:**
  ```typescript
  export interface AppUser {
    id?: string;
    employee_id: string;
    email: string;
    role: string;
    department?: string;
    employees?: {
      id?: string;
      name: string;
      role: string;
      department?: string;
      // ...
    };
  }
  ```
- **Resolution Strategy:**
  ```typescript
  const { user } = useAuth();
  const loggedInUserName = user?.employees?.name || user?.email || 'System';
  ```

### 3.2 Audit of Targeted Files for R5

#### 1. Attendance (`/attendance`)
- **File:** `src/lib/services/attendanceService.ts`
  * **Line 104:** Hardcoded `marked_by: 'Admin'` in existing record update.
  * **Line 114:** Hardcoded `marked_by: 'Admin'` in new record insert.
  * **Line 128:** Hardcoded `changed_by: 'Admin'` in `attendance_audit_log` insert.
- **Service Changes:**
  ```typescript
  export async function markAttendance(
    employeeId: string,
    date: string,
    status: AttendanceStatus,
    reason: string,
    remarks: string,
    existingRecord?: AttendanceRecord,
    markedBy: string = 'System'
  ): Promise<void> {
    // ...
    if (existingRecord?.id) {
      await supabase
        .from('attendance')
        .update({ status, notes: reason, remarks, marked_by: markedBy })
        .eq('id', existingRecord.id);
    } else {
      await supabase
        .from('attendance')
        .insert([{ employee_id: employeeId, date, status, notes: reason, remarks, marked_by: markedBy }]);
    }
    // Audit log
    await supabase.from('attendance_audit_log').insert([{
      attendance_id: attendanceId,
      employee_id: employeeId,
      date,
      previous_status: previousStatus,
      new_status: status,
      changed_by: markedBy,
      reason: reason || null,
      remarks: remarks || null,
    }]);
  }

  export async function bulkMarkAttendance(
    employeeIds: string[],
    date: string,
    status: AttendanceStatus,
    markedBy: string = 'System'
  ): Promise<void> {
    for (const empId of employeeIds) {
      // fetch existing...
      await markAttendance(empId, date, status, 'Bulk mark', '', existing, markedBy);
    }
  }
  ```
- **UI Changes in `src/app/attendance/page.tsx`:**
  * Add `import { useAuth } from '@/lib/context/AuthContext';`
  * Retrieve `const { user } = useAuth();`
  * Compute `const currentUserName = user?.employees?.name || user?.email || 'System';`
  * Pass `currentUserName` to `markAttendance` in `handleMark()` and `bulkMarkAttendance` in `handleBulkMark()`.

#### 2. Payroll (`/payroll`)
- **File:** `src/lib/services/payrollService.ts`
  * **Line 141:** Hardcoded `generated_by: 'Admin'` in `savePayrollRun`.
- **Service Changes:**
  ```typescript
  export async function savePayrollRun(
    summary: EmployeePayrollSummary,
    month: number,
    year: number,
    generatedBy: string = 'System'
  ): Promise<void> {
    const payload = {
      // ...
      status: 'Generated',
      generated_by: generatedBy,
    };
    const { error } = await supabase
      .from('payroll_runs')
      .upsert([payload], { onConflict: 'employee_id,period_month,period_year' });
    if (error) throw error;
  }
  ```
- **UI Changes in `src/app/payroll/page.tsx`:**
  * Add `import { useAuth } from '@/lib/context/AuthContext';`
  * Retrieve `const { user } = useAuth();`
  * Pass `user?.employees?.name || user?.email || 'System'` to `savePayrollRun` inside `handleSave()` and `handleSaveAll()`.

#### 3. Safety Incidents (`/safety`)
- **File:** `src/app/safety/page.tsx`
  * **Line 129:** Fallback string `Reported by: {i.employees?.name || 'Admin'}`.
  * **Line 171:** Hardcoded `<option value="">Admin (Self)</option>`.
- **UI Changes:**
  * Add `import { useAuth } from '@/lib/context/AuthContext';`
  * Retrieve `const { user } = useAuth();`
  * Line 129: Change fallback to `{i.employees?.name || 'System'}`.
  * Line 171: Change label to `<option value="">{user?.employees?.name || user?.email || 'Logged-in User'} (Self)</option>`.
  * In `handleSubmit`: When `form.reported_by` is not manually selected, set `reported_by: user?.employees?.id || null` (or link to current logged-in employee ID).

---

## 4. Foreign Key & Cascade Constraints Checklist

When executing deletions across the 14 tables, database FK constraints were checked against `supabase/*.sql`:

| Table to Delete From | Referenced By | Foreign Key Behavior | Implication for Delete Operation |
|---|---|---|---|
| `projects` | `tasks`, `expenses`, `site_reports`, `safety_incidents`, `purchase_orders` | `ON DELETE CASCADE` on all dependent tables | Deleting a project automatically cascades to tasks, expenses, reports, incidents, and purchase orders cleanly. |
| `shifts` | `employee_shifts` | `ON DELETE CASCADE` | Deleting a shift definition cascades to employee shift assignments. |
| `employees` | `payroll_runs`, `employee_shifts`, `leave_balances`, `attendance_audit_log` | `ON DELETE CASCADE` | Deleting employee records cascades cleanly. |
| `vendors` | `purchase_orders` | `ON DELETE CASCADE` | Deleting a vendor cascades to their purchase orders. |
| `clients` | `projects.client_id` | `ON DELETE RESTRICT/NO ACTION` (client_id nullable) | Ensure client deletion either clears FK or project table handles nullable client. |

---

## 5. Verification Plan

1. **Unit Testing:**
   - Add unit test specs in `src/lib/services/__tests__/` covering all 15 new delete functions:
     * Verify `supabase.from(table).delete().eq('id', id)` is called.
     * Verify error re-throwing on Supabase failure.
   - Verify `markAttendance`, `bulkMarkAttendance`, and `savePayrollRun` preserve passed `marked_by` / `generated_by` values.
2. **TypeScript Compilation:**
   - Run `npx tsc --noEmit` to verify 0 type errors across all services, pages, and components.
3. **UI Integration:**
   - Test confirmation dialog trigger (`window.confirm`) on every page.
   - Confirm cancellation does not execute deletion.
   - Confirm acceptance deletes record and automatically refreshes table data.

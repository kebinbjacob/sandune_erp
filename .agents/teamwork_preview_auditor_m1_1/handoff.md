# Forensic Integrity Audit Report — Milestone 1 (M1)

**Work Product**: Milestone 1 Deliverables (R1 Security Fix, R2 Live Dashboard Aggregates, R3 Settings Persistence, R7 New Project Route)  
**Auditor**: `teamwork_preview_auditor_m1_1`  
**Date**: 2026-08-29  
**Integrity Mode**: Development  
**Verdict**: **CLEAN**

---

## 1. Observation

Direct empirical observations from source code inspection and build/typecheck tool executions:

### 1.1 R1 Security & Credential Storage (`src/app/profile/page.tsx`)
- **Lines 25–29**: State contains `currentPassword`, `newPassword`, and `confirmPassword`:
  ```typescript
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  ```
- **Lines 160–176**: Verifies current password against Supabase Auth before updating password:
  ```typescript
  // Verify current password with Supabase Auth
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: passForm.currentPassword,
  });

  if (verifyError) {
    throw new Error('Current password is incorrect.');
  }

  // Update Supabase Auth Password
  const { error: authError } = await supabase.auth.updateUser({
    password: passForm.newPassword
  });
  ```
- **Line 177**: The legacy plaintext password write `supabase.from('app_users').update({ password: ... })` is completely eliminated.
- **Lines 298–331**: Password form renders inputs for Current Password, New Password (minLength=6), and Confirm New Password (minLength=6).

### 1.2 R2 Live Dashboard Service & Aggregates (`src/lib/services/dashboardService.ts` & `src/app/page.tsx`)
- **`src/lib/services/dashboardService.ts` Lines 37–64**: `getDashboardMetrics()` executes live Supabase queries across 5 target tables:
  - Active employees: `supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active')`
  - Active projects: `supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active')`
  - Low-stock materials: `supabase.from('materials').select('id, current_stock, reorder_level')` filtered by `current_stock <= reorder_level`
  - Total clients: `supabase.from('clients').select('*', { count: 'exact', head: true })`
  - Equipment in use: `supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'In Use')`
- **`src/lib/services/dashboardService.ts` Lines 66–125**: `getRecentActivities()` fetches top 5 recent records from `leave_requests`, `expenses`, and `site_reports` with relations (`employees(name)`, `projects(name)`), sorts chronologically descending, and returns formatted activity items.
- **`src/app/page.tsx` Lines 25–41**: Calls `getDashboardMetrics()` and `getRecentActivities()` on mount via `useEffect` and binds live metric values and activities to the UI.

### 1.3 R3 Settings Persistence & Migration (`supabase/phase7_settings.sql`, `src/lib/services/settingsService.ts`, `src/app/settings/page.tsx`)
- **`supabase/phase7_settings.sql` Lines 6–36**: Defines key-value table `company_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz DEFAULT now())` with Row Level Security enabled, public access policies, and default seeds. Also includes schema extensions for subsequent milestones (`purchase_orders.line_items`, `equipment.maintenance_notes`, `payroll_runs` deduction fields).
- **`src/lib/services/settingsService.ts` Lines 15–50**: Implements `getCompanySettings()` (fetches key-value pairs into `CompanySettings` object) and `saveCompanySettings(settings)` (executes `supabase.from('company_settings').upsert(rows, { onConflict: 'key' })`).
- **`src/app/settings/page.tsx` Lines 24–87**: Dynamic form state initialized with defaults, populated on mount via `getCompanySettings()`, with separate handlers (`handleSaveProfile` and `handleSavePrefs`) persisting company profile and system preferences to Supabase.

### 1.4 R7 New Project Route (`src/app/projects/new/page.tsx`)
- **Lines 1–241**: Replaces previous broken re-export stub (`export { default } from "../../create/page"`) with a dedicated New Project page.
- **Lines 30–43**: Loads live clients via `getClients()` and employees via `getEmployees()`.
- **Lines 45–75**: Collects project code, title, client, status, location, dates, budget, description, and manager ID, invokes `createProject(...)` from `projectService.ts`, and navigates to `/projects` on success.

### 1.5 TypeScript Compilation (`npx tsc --noEmit`)
- Execution command: `npx tsc --noEmit`
- Exit Code: `0` (Success, 0 errors across the entire repository).

---

## 2. Logic Chain

1. **R1 Security Verification**: Inspection of `src/app/profile/page.tsx` confirms that the vulnerability where plaintext passwords were saved to `app_users` has been completely removed. The password update now enforces an explicit credential verification check via `supabase.auth.signInWithPassword()` with the user's current password before calling `supabase.auth.updateUser()`.
2. **R2 Live Data Verification**: Inspection of `src/lib/services/dashboardService.ts` confirms genuine Supabase queries for active employees, active projects, low stock materials, total clients, and equipment in use, plus multi-table merged recent activity. `src/app/page.tsx` consumes this service directly, eliminating hardcoded metric numbers and static activity records.
3. **R3 Settings Verification**: `supabase/phase7_settings.sql` defines the key-value `company_settings` table and future schema columns. `settingsService.ts` provides genuine `upsert` and `select` routines. `src/app/settings/page.tsx` implements live load and save actions with visual user feedback.
4. **R7 Route Verification**: `src/app/projects/new/page.tsx` is a fully realized project creation component with dynamic client and project manager select inputs, form validation, and `createProject()` invocation.
5. **Absence of Prohibited Patterns**:
   - No hardcoded test result shortcuts or fake bypasses found in M1 target files.
   - No facade implementations returning constant stubs.
   - Type check passes cleanly without compile-time errors or suppressed types (`npx tsc --noEmit` exit code 0).

---

## 3. Caveats

- Vitest unit tests in other module pages (`/employees`, `/contractors`, etc.) logged unhandled promise rejections after DOM teardown due to missing mock lifecycles; this is a test runner environment artifact in downstream modules and does not affect the correctness or type safety of M1 source code.
- Remote Supabase database instance must have `supabase/phase7_settings.sql` applied when connecting to a remote production environment.

---

## 4. Conclusion

**Verdict: CLEAN**

All Milestone 1 deliverables (R1, R2, R3, R7) satisfy the specification, contain no facade or mock bypasses, eliminate plaintext password vulnerabilities, integrate genuine Supabase queries, and maintain 100% TypeScript type safety.

---

## 5. Verification Method

To independently verify the audit findings:
1. **Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected: Exit code 0 with zero type errors.*
2. **R1 Code Inspection**:
   Inspect `src/app/profile/page.tsx` around lines 160–178 to verify absence of `app_users.password` write and presence of `signInWithPassword`.
3. **R2 Code Inspection**:
   Inspect `src/lib/services/dashboardService.ts` and `src/app/page.tsx` to verify 5 count/filter queries and multi-table activity aggregation.
4. **R3 Code Inspection**:
   Inspect `supabase/phase7_settings.sql`, `src/lib/services/settingsService.ts`, and `src/app/settings/page.tsx` to verify key-value persistence.
5. **R7 Code Inspection**:
   Inspect `src/app/projects/new/page.tsx` to verify standalone project form and `createProject()` invocation.

# Handoff Report — Milestone 1 Review & Adversarial Critique

**Reviewer**: Reviewer 2 (`teamwork_preview_reviewer_m1_2`)  
**Roles**: Reviewer, Adversarial Critic  
**Date**: 2026-08-29  
**Verdict**: **APPROVE**  

---

## 1. Observation

Direct code observations from inspecting the Milestone 1 implementations across R1, R2, R3, and R7:

### R1: Security Fix — Plaintext Password Removal & Verification (`src/app/profile/page.tsx`)
- **Form State & Inputs**:
  - `src/app/profile/page.tsx:25-29`: `passForm` includes `currentPassword`, `newPassword`, and `confirmPassword`.
  - `src/app/profile/page.tsx:298-332`: Renders `<input type="password">` fields for "Current Password", "New Password", and "Confirm New Password", enforcing `required` and `minLength={6}`.
- **Verification & Authentication**:
  - `src/app/profile/page.tsx:160-168`: Executes `supabase.auth.signInWithPassword({ email: user.email, password: passForm.currentPassword })` before attempting password update. If invalid, throws an explicit error (`'Current password is incorrect.'`) and halts execution.
  - `src/app/profile/page.tsx:171-175`: Updates password exclusively via `supabase.auth.updateUser({ password: passForm.newPassword })`.
  - The vulnerable update query to `app_users.password` has been completely deleted.
  - `src/app/profile/page.tsx:179`: Resets `passForm` to blank fields on success.

### R2: Dashboard Live Data Aggregates (`src/lib/services/dashboardService.ts` & `src/app/page.tsx`)
- **Service Queries (`src/lib/services/dashboardService.ts`)**:
  - `lines 37-64` (`getDashboardMetrics`):
    - `activeEmployees`: `supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active')`
    - `activeProjects`: `supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active')`
    - `lowStockMaterials`: `supabase.from('materials').select('id, current_stock, reorder_level')` filtered in-memory via `Number(m.current_stock) <= Number(m.reorder_level)`
    - `totalClients`: `supabase.from('clients').select('*', { count: 'exact', head: true })`
    - `equipmentInUse`: `supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'In Use')`
    - Parallel execution via `Promise.all` with robust fallback defaults (`|| 0`).
  - `lines 66-125` (`getRecentActivities` / alias `getRecentActivity`):
    - Queries top 5 records from `leave_requests`, `expenses`, and `site_reports` with employee and project foreign relations.
    - Unifies into `RecentActivityItem[]`, sorts chronologically descending by `createdAt`, and returns top 5 items with humanized relative timestamps (`formatTimeAgo()`).
- **Dashboard UI (`src/app/page.tsx`)**:
  - `lines 14-42`: React client component with `useEffect` invoking `getDashboardMetrics()` and `getRecentActivities()`.
  - `lines 50-143`: Replaces hardcoded stats with dynamic values for Active Employees (`metrics.activeEmployees`), Active Projects (`metrics.activeProjects`), Low Stock Materials (`metrics.lowStockMaterials`), Equipment in Use (`metrics.equipmentInUse`), Total Clients (`metrics.totalClients`), and real DB activity items in Recent Activity card.

### R3: Settings Persistence (`src/app/settings/page.tsx`, `src/lib/services/settingsService.ts`, `supabase/phase7_settings.sql`)
- **Database Schema Migration (`supabase/phase7_settings.sql`)**:
  - `lines 6-25`: Creates `company_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz DEFAULT now())` table with RLS enabled and SELECT/INSERT/UPDATE/DELETE policies.
  - `lines 27-36`: Seeds default key-value pairs (`company_name`, `registration_number`, `address`, `currency`, `date_format`, `timezone`, `email_notifications`, `in_app_alerts`) with `ON CONFLICT (key) DO NOTHING`.
  - `lines 38-51`: Adds forward-compatible schema extensions (`line_items` on `purchase_orders`, `maintenance_notes` on `equipment`, deduction columns on `payroll_runs`).
- **Settings Service Layer (`src/lib/services/settingsService.ts`)**:
  - `lines 15-30`: `getCompanySettings()` selects all key-value pairs from `company_settings` into a strongly-typed `CompanySettings` map.
  - `lines 32-50`: `saveCompanySettings()` executes `upsert(rows, { onConflict: 'key' })` with updated timestamps.
- **Settings UI (`src/app/settings/page.tsx`)**:
  - `lines 24-47`: Loads saved settings dynamically on component mount.
  - `lines 49-87`: Provides separate form handlers (`handleSaveProfile`, `handleSavePrefs`) calling `saveCompanySettings` with UI loading states and a 4-second success toast notification.

### R7: Dedicated New Project Creation (`src/app/projects/new/page.tsx`)
- **Standalone Form Page**:
  - `lines 30-43`: Loads clients (`getClients()`) and employees (`getEmployees()`) on mount.
  - `lines 45-75`: Validates required title, generates unique project code (`PRJ-${Date.now().toString().slice(-5)}`), calls `createProject()` in `projectService.ts`, and navigates to `/projects` via `router.push('/projects')`.
  - `lines 100-238`: Includes inputs for Title, Client (dynamic `<select>`), Status (dynamic `<select>` from `PROJECT_STATUSES`), Site Location, Project Manager (dynamic `<select>` from `Employee[]`), Start Date, End Date / Deadline, Total Budget, and Scope Description.

---

## 2. Logic Chain

1. **Security & Integrity Logic (R1)**:
   - *Observation*: `src/app/profile/page.tsx` checks `user.email`, requires `passForm.currentPassword`, verifies it via `signInWithPassword`, and updates via `updateUser`. No write to `app_users.password` exists.
   - *Inference*: The user is forced to prove possession of current credentials, preventing unauthorized takeover. Removing database column writes ensures Supabase Auth password hashing and salt mechanisms remain the sole authority.
2. **Dashboard Live Data Aggregation Logic (R2)**:
   - *Observation*: `src/lib/services/dashboardService.ts` executes parallel count and select queries across 5 entity tables and unifies recent actions across leave requests, expenses, and site reports.
   - *Inference*: Eliminates stale hardcoded statistics and provides genuine real-time metrics and operational traceability.
3. **Settings Persistence Logic (R3)**:
   - *Observation*: `phase7_settings.sql` provisions a generic key-value store `company_settings` with upsert support in `settingsService.ts`.
   - *Inference*: Company metadata and user preferences persist across sessions and page reloads without schema restructuring.
4. **Dedicated Project Flow Logic (R7)**:
   - *Observation*: Replaced broken re-export in `/projects/new` with a complete standalone creation workflow that interacts with `crmService` and `employeeService` and redirects on creation.
   - *Inference*: Restores route functionality, eliminates 404/broken navigation errors, and provides a polished creation experience.

---

## 3. Adversarial Critique & Stress-Testing

### Assumption & Failure Mode Analysis

| Test / Scenario | Potential Attack / Failure Mode | Evaluation / Defense in Code | Result |
|---|---|---|---|
| **R1: Wrong Current Password** | Attacker with active session attempts password reset | `signInWithPassword` fails, throws error, catches and alerts, halts `updateUser` | **PASS** |
| **R1: Missing Email in Session** | Malformed session object with null `user.email` | `if (!user?.email) { alert('User email not found.'); return; }` guards early | **PASS** |
| **R1: Integrity Violation Check** | Hardcoded passwords or dummy bypass logic | Zero hardcoded bypasses found; uses live Supabase Auth API | **PASS** |
| **R2: Empty Database State** | New deployment with 0 rows across all tables | `empRes.count || 0`, `matRes.data || []` safely default to 0; empty activity UI shows friendly fallback message | **PASS** |
| **R2: Network Error in Sub-query** | One of the 5 queries in `Promise.all` fails | Errors logged to console, non-blocking default fallbacks prevent entire page crash | **PASS** |
| **R3: Concurrent Settings Updates** | Multiple fields saved in rapid succession | `saveCompanySettings` uses atomic `upsert` with `onConflict: 'key'` | **PASS** |
| **R3: Empty Key Values** | Saving empty/undefined settings object | `Object.entries(settings).filter(([_, v]) => v !== undefined)` prevents empty row inserts | **PASS** |
| **R7: Submission with Empty Title** | User clicks submit without title | Native HTML5 `required` attribute + `if (!form.name.trim())` programmatic validation | **PASS** |
| **R7: Non-numeric Budget** | Entering non-numeric text in budget input | `<input type="number">` + `budget: form.budget ? Number(form.budget) : undefined` ensures valid numeric or undefined payload | **PASS** |
| **Type Safety Validation** | Missing imports or TypeScript type errors | Ran `npx tsc --noEmit` which completed with code 0 (0 errors) | **PASS** |

---

## 4. Caveats

- **Database Migration**: The migration script in `supabase/phase7_settings.sql` must be run on remote Supabase Postgres environments to create the `company_settings` table and apply column extensions.
- **Offline / Test Environments**: When running offline without Supabase environment credentials, service methods log errors and return fallback values without crashing the UI.

---

## 5. Conclusion

**Verdict: APPROVE**

The implementations for Milestone 1 (R1, R2, R3, R7) are verified to be:
1. **Fully Conforming**: All criteria defined in `ORIGINAL_REQUEST.md` for Milestone 1 are satisfied.
2. **Secure**: Plaintext password writes are removed, and strict re-authentication is enforced.
3. **Type-Safe**: `npx tsc --noEmit` passes with exit code 0 and zero type errors.
4. **Integrity Verified**: No dummy implementations, hardcoded mocks, facade shortcuts, or integrity violations exist.

---

## 6. Verification Method

To independently reproduce and verify this review:
1. **Run TypeScript Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected: Clean output with exit code 0.*
2. **Inspect Source Files**:
   - `src/app/profile/page.tsx` (Lines 160–180): Confirm password verification and absence of plaintext database writes.
   - `src/lib/services/dashboardService.ts`: Confirm 5 live count/select queries and `getRecentActivities()`.
   - `src/app/page.tsx`: Confirm client-side data binding for dashboard metrics and activities.
   - `supabase/phase7_settings.sql` & `src/lib/services/settingsService.ts` & `src/app/settings/page.tsx`: Confirm settings table definition, upsert service, and UI form persistence.
   - `src/app/projects/new/page.tsx`: Confirm dedicated new project form with validation and `createProject()` invocation.

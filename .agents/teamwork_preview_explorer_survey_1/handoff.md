# Handoff Report — Explorer 1 (SanDune ERP Codebase Survey)

**Task**: Codebase Survey and Implementation Blueprint for Requirements R1, R2, R3, R7, R8, R12  
**Working Directory**: `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_explorer_survey_1`  
**Handoff Type**: Hard Handoff (Investigation & Survey Complete)  

---

## 1. Observation

Direct code inspection of the target files revealed the following concrete states:

1. **R1 (`src/app/profile/page.tsx`)**:
   - Lines 25–28: `const [passForm, setPassForm] = useState({ newPassword: '', confirmPassword: '' });` lacks a `currentPassword` field.
   - Lines 156–160: Executes `await supabase.from('app_users').update({ password: passForm.newPassword }).eq('id', user.id);`, storing plaintext passwords in `app_users`.
   - Lines 148–151: Calls `supabase.auth.updateUser` without prior `signInWithPassword()` verification.

2. **R2 (`src/app/page.tsx` & `src/lib/services/dashboardService.ts`)**:
   - `src/app/page.tsx`: Contains hardcoded values (`142` employees, `8 Active` projects, `12` low stock materials, `4` equipment in maintenance, `24` active clients, `$184,500` revenue) and a hardcoded static list in `Recent Activity` (lines 74–95).
   - `src/lib/services/dashboardService.ts`: Does not exist in the codebase.

3. **R3 (`src/app/settings/page.tsx` & `supabase/phase7_settings.sql`)**:
   - `src/app/settings/page.tsx`: Inputs use static `defaultValue` attributes without state or `onChange` handlers; buttons (lines 31 & 63) have no `onClick` or `onSubmit` bindings.
   - `supabase/phase7_settings.sql`: Does not exist in `supabase/` directory.

4. **R7 (`src/app/projects/new/page.tsx`)**:
   - `src/app/projects/new/page.tsx`: Contains only `export { default } from "../../create/page";`.
   - `src/app/create/page.tsx`: Only implements employee creation; non-employee creation falls back to a generic `alert()` without saving to the database.

5. **R8 (`src/app/tasks/page.tsx`, `src/app/tasks/board/page.tsx`, `src/lib/services/taskService.ts`)**:
   - `src/lib/services/taskService.ts`: `updateTask(id: string, updates: Partial<Task>)` is defined at line 48 but is not called anywhere in the UI.
   - `src/app/tasks/page.tsx`: Table has no Edit action column or edit modal.
   - `src/app/tasks/board/page.tsx`: Cards cannot be clicked to edit properties; only new task creation is supported.

6. **R12 (`src/app/projects/page.tsx` & `src/app/projects/[id]/page.tsx`)**:
   - `src/app/projects/page.tsx`: Line 149 uses a free-text input `<input value={form.client} ... placeholder="Client name" />` instead of a client dropdown.
   - `src/app/projects/[id]/page.tsx`: Edit form (lines 74–97) has no client input field at all.

---

## 2. Logic Chain

1. **Security (R1)**:
   - *Observation*: Supabase Auth is the single source of truth for credentials. Writing `app_users.password` exposes user secrets in plaintext in application tables.
   - *Deduction*: Deleting lines 156–160 removes the security vulnerability. Adding `supabase.auth.signInWithPassword({ email: user.email, password: passForm.currentPassword })` before `updateUser()` guarantees that only the authenticated account holder can update the password.

2. **Live Dashboard (R2)**:
   - *Observation*: `employees`, `projects`, `materials`, `clients`, `equipment`, `leave_requests`, `expenses`, and `site_reports` all have active tables with Supabase client bindings in `src/lib/services/`.
   - *Deduction*: Creating `dashboardService.ts` to aggregate counts and merge recent activity logs will cleanly feed dynamic state into `src/app/page.tsx` without cluttering the component with raw DB logic.

3. **Settings Persistence (R3)**:
   - *Observation*: Settings require key-value persistence for company metadata and user preferences.
   - *Deduction*: A `company_settings` table (key text PK, value text) in `supabase/phase7_settings.sql` allows seamless key-value querying and upserts from `src/app/settings/page.tsx`.

4. **Project Route (R7)**:
   - *Observation*: Re-exporting from `src/app/create/page.tsx` causes broken UX and fails to create project records.
   - *Deduction*: Replacing the re-export with a dedicated New Project form that invokes `createProject()` provides a working route that integrates with the CRM clients list and employee managers list.

5. **Task Editing (R8)**:
   - *Observation*: `updateTask()` is implemented in `taskService.ts` but has no UI trigger.
   - *Deduction*: Wiring modal dialogs with populated form state to `updateTask()` on both `/tasks` and `/tasks/board` fulfills full task lifecycle management.

6. **Client Linkage (R12)**:
   - *Observation*: CRM clients exist in `clients` table and are retrievable via `getClients()`. Projects store client names in `projects.client`.
   - *Deduction*: Loading `getClients()` in both `/projects` and `/projects/[id]` and replacing text inputs with `<select>` dropdowns ensures consistent client association across the application.

---

## 3. Caveats

1. **Local Database Emulation**: If unit tests run in offline/JSDOM mode using `src/lib/db/localDb.ts`, any new tables (such as `company_settings`) should be registered in `seedDefaults()` of `localDb.ts` to ensure mock DB compatibility.
2. **Project Client Field**: The schema in `supabase/projects_payroll.sql` defines `client text` on the `projects` table, while `phase1_2.sql` adds an optional `client_id uuid REFERENCES clients(id)`. Storing the selected client's name in `projects.client` maintains compatibility with existing UI views.

---

## 4. Conclusion

All 6 assigned areas have been thoroughly surveyed, their gaps precisely pinpointed, and detailed implementation blueprints documented in `survey_report_1.md`. Implementing these specifications will resolve the security vulnerability (R1), activate live dashboard metrics (R2), persist company settings (R3), fix project creation (R7), enable complete task editing (R8), and enforce structured client linkage (R12).

---

## 5. Verification Method

To independently verify these findings:

1. **R1**: Inspect `src/app/profile/page.tsx` around lines 145–165 to verify plaintext write in existing code.
2. **R2**: Check `src/app/page.tsx` lines 20–65 and 74–95 for hardcoded metrics.
3. **R3**: Check `src/app/settings/page.tsx` lines 28–31 and 53–64 to verify uncontrolled inputs and missing handlers.
4. **R7**: Inspect `src/app/projects/new/page.tsx` to confirm re-export of `create/page`.
5. **R8**: Inspect `src/app/tasks/page.tsx` and `src/app/tasks/board/page.tsx` to confirm absence of `updateTask` calls.
6. **R12**: Inspect `src/app/projects/page.tsx` line 149 and `src/app/projects/[id]/page.tsx` lines 74–97 to confirm free-text or missing client inputs.
7. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
8. **Test Suite**:
   ```bash
   npm test
   ```

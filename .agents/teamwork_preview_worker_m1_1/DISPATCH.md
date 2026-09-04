## 2026-08-29T12:47:37Z
You are Worker 1 implementing Milestone 1 for SanDune ERP.
Working Directory: C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_worker_m1_1

Please read:
1. Original Request: `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\ORIGINAL_REQUEST.md`
2. Survey Blueprint: `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_explorer_survey_1\survey_report_1.md`
3. Scope & Contracts: `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main\PROJECT.md`

Your tasks:
- **R1 (Security)**:
  - In `src/app/profile/page.tsx`, remove the write to `app_users.password`.
  - Add a "Current Password" input to the password change form.
  - Before updating password via `supabase.auth.updateUser`, verify the current password by calling `supabase.auth.signInWithPassword({ email: user.email, password: passForm.currentPassword })`.
- **R2 (Live Dashboard)**:
  - Create `src/lib/services/dashboardService.ts` implementing `getDashboardMetrics()` and `getRecentActivities()`.
  - Queries:
    * Active employees: count where `status = 'Active'`
    * Active projects: count where `status = 'Active'`
    * Low-stock materials: count where `current_stock <= reorder_level`
    * Total clients: count from `clients`
    * Equipment in use: count where `status = 'In Use'`
    * Recent activity: last 5 records merged across `leave_requests`, `expenses`, and `site_reports`
  - In `src/app/page.tsx`, replace all hardcoded stats and hardcoded activity items with live data loaded from `dashboardService.ts`.
- **R3 (Settings Persistence)**:
  - Create migration SQL at `supabase/phase7_settings.sql` creating the `company_settings` table (`key TEXT PRIMARY KEY, value TEXT`) along with column additions for subsequent milestones (`line_items JSONB` on `purchase_orders`, `maintenance_notes TEXT` on `equipment`, `pf_deduction NUMERIC(10,2) DEFAULT 0`, `esi_deduction NUMERIC(10,2) DEFAULT 0`, `tax_deduction NUMERIC(10,2) DEFAULT 0` on `payroll_runs`).
  - Wire `src/app/settings/page.tsx` to load and save: company name, registration number, address, timezone, currency from/to `company_settings`.
- **R7 (Fix /projects/new Route)**:
  - In `src/app/projects/new/page.tsx`, replace the broken re-export with a dedicated New Project form that captures project title, client, budget, start_date, deadline, status, description, and calls `createProject()` from `src/lib/services/projectService.ts`, redirecting to `/projects` on success.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

After implementation:
- Run `npx tsc --noEmit` to verify 0 type errors.
- Document all modified/created files and test results in `handoff.md` and send a message back.

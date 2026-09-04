# Handoff Report — Milestone 1 Review & Adversarial Critique

**Reviewer**: Reviewer 1 (Milestone 1)  
**Date**: 2026-08-29  
**Verdict**: **APPROVE**  

---

## 1. Observation

### R1: Security Fix in `src/app/profile/page.tsx`
- **Password Verification & Plaintext Removal**:
  - `src/app/profile/page.tsx:160-176`:
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
    
    if (authError) throw authError;

    // Plaintext app_users.password write is removed for security
    ```
  - Form validation correctly enforces `user.email` presence (`line 140`), current password presence (`line 144`), matching passwords (`line 148`), and minimum length of 6 characters (`line 152`).
  - No plaintext password is written or updated to `app_users` table in `handlePasswordSave`, `handleProfileSave`, or `uploadAvatar`.

### R2: Dashboard Live Data in `src/lib/services/dashboardService.ts` and `src/app/page.tsx`
- **5 Live Supabase Metrics**:
  - `src/lib/services/dashboardService.ts:37-64`:
    1. `activeEmployees`: `supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active')`
    2. `activeProjects`: `supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active')`
    3. `lowStockMaterials`: `supabase.from('materials').select('id, current_stock, reorder_level')` -> filters `Number(m.current_stock) <= Number(m.reorder_level)`
    4. `totalClients`: `supabase.from('clients').select('*', { count: 'exact', head: true })`
    5. `equipmentInUse`: `supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'In Use')`
  - Metrics are fetched concurrently using `Promise.all` with robust error logging (`console.error`).
- **Live Recent Activities**:
  - `src/lib/services/dashboardService.ts:66-125`: Fetches top 5 records from `leave_requests`, `expenses`, and `site_reports` with relations (`employees(name)`, `projects(name)`), maps them to `RecentActivityItem`, sorts them chronologically in descending order, and returns the top 5.
  - `formatTimeAgo()` formats timestamps to relative human-readable strings (`Just now`, `5m ago`, `2h ago`, `3d ago`, `1mo ago`).
- **Dashboard UI Binding**:
  - `src/app/page.tsx:14-42`: Uses `useEffect` and `Promise.all([getDashboardMetrics(), getRecentActivities()])` to hydrate `metrics` and `activities` state.
  - `src/app/page.tsx:50-141`: Binds dynamic metrics to cards across HR, Operations, Resources, and CRM sections, with loading indicators (`'...'`) and empty activity state fallbacks.

### R3: Settings Persistence in `src/app/settings/page.tsx`, `src/lib/services/settingsService.ts`, and `supabase/phase7_settings.sql`
- **Database Migration & Schema**:
  - `supabase/phase7_settings.sql:5-36`: Creates `company_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz DEFAULT now())`, enables RLS with public/authenticated policies, and seeds defaults (`company_name`, `registration_number`, `address`, `currency`, `date_format`, `timezone`, `email_notifications`, `in_app_alerts`) with `ON CONFLICT (key) DO NOTHING`.
- **Service Layer**:
  - `src/lib/services/settingsService.ts:15-50`:
    - `getCompanySettings()` fetches `key, value` from `company_settings` and constructs a typed `CompanySettings` object.
    - `saveCompanySettings(settings)` upserts key-value entries with timestamps using `.upsert(rows, { onConflict: 'key' })`.
- **Settings Page UI**:
  - `src/app/settings/page.tsx:7-88`: Multi-tab interface (`profile`, `roles`, `prefs`). Loads existing settings on mount and provides dedicated forms with submit handlers (`handleSaveProfile`, `handleSavePrefs`), saving state (`saving`), and success banners (`saveSuccess`).

### R7: Dedicated New Project Form in `src/app/projects/new/page.tsx`
- **Dedicated Route & Integration**:
  - `src/app/projects/new/page.tsx:1-75`: Full-page form at `/projects/new` fetching CRM clients (`getClients()`) and employees (`getEmployees()`) on mount.
  - Generates unique project codes (`PRJ-${Date.now().toString().slice(-5)}`), validates inputs, creates a project via `createProject()` in `src/lib/services/projectService.ts`, and redirects to `/projects` with `router.push('/projects')`.
  - Comprehensive inputs: Project Title, Client selector, Status selector, Site Location, Project Manager dropdown, Start/End Dates, Total Budget, and Scope Description.
  - `src/components/Sidebar.tsx:60-66`: Navigation menu directly links to `/projects/new` ("Create Project").

---

## 2. Logic Chain

1. **Security & Integrity (R1)**:
   - *Observation*: `src/app/profile/page.tsx:160-176` uses `supabase.auth.signInWithPassword()` to verify the current password before calling `supabase.auth.updateUser()`. The previous direct write to `app_users.password` was completely omitted.
   - *Inference*: Re-authentication prevents session hijacking / unauthorized password overrides, and omitting database table password columns eliminates plaintext password vulnerabilities.

2. **Data Freshness & Concurrency (R2)**:
   - *Observation*: `getDashboardMetrics()` and `getRecentActivities()` in `src/lib/services/dashboardService.ts` query 5 different tables with `head: true` count queries and select operations, executed in parallel via `Promise.all`.
   - *Inference*: The dashboard displays real-time operational statistics without blocking waterfall delays or stale static mocks.

3. **Persistence & Extensibility (R3)**:
   - *Observation*: `supabase/phase7_settings.sql` provisions a flexible key-value store `company_settings` with primary key conflict handling. `settingsService.ts` and `settings/page.tsx` seamlessly serialize and deserialize configuration fields.
   - *Inference*: Application settings persist reliably across reloads and database sessions without schema churn for future settings keys.

4. **Dedicated UX & Flow (R7)**:
   - *Observation*: `src/app/projects/new/page.tsx` provides a full-featured form linked in the global Sidebar navigation, populating foreign relations (clients, employees) dynamically and invoking `createProject()`.
   - *Inference*: Meets the requirement for a dedicated project creation workflow while maintaining backward compatibility with quick modals.

---

## 3. Caveats

- **External Live Supabase Network Access**: Live cloud database testing depends on environment variable configuration (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). The implementation includes fallback and local integration test mocking (`src/lib/supabase/testDb.ts`) that conforms to standard Supabase client interfaces.
- No other caveats found.

---

## 4. Conclusion

**Verdict: APPROVE**

All Milestone 1 requirements have been implemented thoroughly, securely, and with high code quality:
- **R1**: Plaintext password writes are removed; current password verification via Supabase Auth is strictly enforced.
- **R2**: Dashboard queries live Supabase tables for all 5 core metrics and aggregates recent operational activity seamlessly.
- **R3**: Settings persistence is fully established via `company_settings` table migration, service layer, and responsive UI.
- **R7**: Dedicated `/projects/new` creation page is operational and integrated with CRM clients, employee management, and `createProject()`.

No integrity violations, hardcoded shortcuts, or dummy facades were detected.

---

## 5. Verification Method

To independently verify this milestone:
1. **Type & Syntax Check**:
   ```bash
   npx tsc --noEmit
   ```
2. **Unit & Integration Test Execution**:
   ```bash
   npx vitest run
   ```
3. **Static Source Inspection**:
   - Inspect `src/app/profile/page.tsx` lines 160-180 to verify `signInWithPassword` and absence of `app_users.password` updates.
   - Inspect `src/lib/services/dashboardService.ts` to verify live Supabase queries and `getRecentActivities()`.
   - Inspect `supabase/phase7_settings.sql` and `src/lib/services/settingsService.ts` to verify settings schema and upsert logic.
   - Inspect `src/app/projects/new/page.tsx` to verify `/projects/new` form fields, validation, and `createProject()` invocation.

# SanDune ERP Codebase Survey Report — Explorer 1

**Survey Scope:** R1 (Security Fix), R2 (Dashboard Live Aggregates), R3 (Settings & Migration), R7 (Fix `/projects/new`), R8 (Task Editing Modal), R12 (Project-Client Linkage)  
**Date:** 2026-08-29  
**Target Codebase:** `C:\Users\kelvin babu\Downloads\sandune-main\sandune-main`  

---

## Executive Summary

This report provides a comprehensive architectural and code-level investigation of six core requirements (R1, R2, R3, R7, R8, R12) for the SanDune ERP & CRM application (Next.js 15 App Router, TypeScript, Supabase Auth/Postgres). All relevant source files, database schemas, TypeScript interfaces, and service functions have been analyzed. Detailed root-cause analyses, exact file locations, and implementation blueprints are presented below.

---

## 1. R1: Security Fix — Remove Plaintext Password Storage in Profile

### 1.1 Observations & Current Code Analysis
- **File**: `src/app/profile/page.tsx`
- **Problem**: 
  1. `handlePasswordSave` updates Supabase Auth via `supabase.auth.updateUser({ password: passForm.newPassword })`, but immediately afterwards (lines 155–160) executes:
     ```typescript
     if (user?.id) {
       await supabase
         .from('app_users')
         .update({ password: passForm.newPassword })
         .eq('id', user.id);
     }
     ```
     This writes plaintext passwords directly to the database column `app_users.password`.
  2. The password form state (`passForm`) only tracks `newPassword` and `confirmPassword`. There is no check to ensure the user knows their current password before modifying authentication credentials.
- **Single Source of Truth**: Supabase Auth manages hashed passwords internally in `auth.users`. Password data must never be saved to `app_users`.

### 1.2 Implementation Blueprint
1. **Form State Update**:
   ```typescript
   const [passForm, setPassForm] = useState({
     currentPassword: '',
     newPassword: '',
     confirmPassword: '',
   });
   ```
2. **Current Password Verification & Secure Update**:
   ```typescript
   const handlePasswordSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user?.email) {
       alert('User email not found.');
       return;
     }
     if (!passForm.currentPassword) {
       alert('Please enter your current password.');
       return;
     }
     if (passForm.newPassword !== passForm.confirmPassword) {
       alert("Passwords don't match!");
       return;
     }

     try {
       setPasswordSaving(true);

       // 1. Verify current password with Supabase Auth
       const { error: verifyError } = await supabase.auth.signInWithPassword({
         email: user.email,
         password: passForm.currentPassword,
       });
       if (verifyError) {
         throw new Error('Current password is incorrect.');
       }

       // 2. Update password in Supabase Auth
       const { error: authError } = await supabase.auth.updateUser({
         password: passForm.newPassword,
       });
       if (authError) throw authError;

       // 3. REMOVED: app_users password write completely

       setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
       alert('Password changed successfully!');
     } catch (error: any) {
       alert(error.message || 'Error changing password');
     } finally {
       setPasswordSaving(false);
     }
   };
   ```
3. **UI Form Elements**:
   Add a "Current Password" `<input type="password" required />` element as the first field in the Password form card.

---

## 2. R2: Dashboard Live Data Aggregates & `dashboardService.ts`

### 2.1 Observations & Current Code Analysis
- **File**: `src/app/page.tsx`
- **Problem**: 
  - All metric cards display hardcoded values (e.g., `142 Total Employees`, `8 Active Projects`, `12 Low Stock Materials`, `4 Equipment in Maintenance`, `24 Active Clients`, `$184,500 Revenue`).
  - Recent activity displays a static `<ul>` list with 3 static hardcoded entries.
  - `src/lib/services/dashboardService.ts` does not yet exist.

### 2.2 Schema & Query Mapping
| Metric / Component | Target Table | Filter / Aggregation Query |
|---|---|---|
| **Active Employees** | `employees` | `.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active')` |
| **Active Projects** | `projects` | `.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active')` |
| **Low-Stock Materials** | `materials` | `.from('materials').select('id, current_stock, reorder_level')` → filter `current_stock <= reorder_level` |
| **Total Clients** | `clients` | `.from('clients').select('*', { count: 'exact', head: true })` |
| **Equipment in Use** | `equipment` | `.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'In Use')` |
| **Recent Activity Feed** | `leave_requests`, `expenses`, `site_reports` | Query latest 5 records from each, join relations (`employees(name)`, `projects(name)`), merge & sort descending by `created_at`, take top 5 |

### 2.3 `src/lib/services/dashboardService.ts` Design
```typescript
import { supabase } from '@/lib/supabase/client';

export interface DashboardMetrics {
  activeEmployees: number;
  activeProjects: number;
  lowStockMaterials: number;
  totalClients: number;
  equipmentInUse: number;
  totalRevenue?: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'leave' | 'expense' | 'site_report';
  icon: string;
  title: string;
  description: string;
  createdAt: string;
  timeAgo: string;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [empRes, projRes, matRes, clientRes, equipRes] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('materials').select('current_stock, reorder_level'),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'In Use'),
  ]);

  const materials = matRes.data || [];
  const lowStockCount = materials.filter(m => Number(m.current_stock) <= Number(m.reorder_level)).length;

  return {
    activeEmployees: empRes.count || 0,
    activeProjects: projRes.count || 0,
    lowStockMaterials: lowStockCount,
    totalClients: clientRes.count || 0,
    equipmentInUse: equipRes.count || 0,
  };
}

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const [leaves, expenses, reports] = await Promise.all([
    supabase
      .from('leave_requests')
      .select('id, leave_type, status, created_at, employees(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('expenses')
      .select('id, title, amount, category, created_at, employees(name), projects(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('site_reports')
      .select('id, report_date, work_completed, created_at, employees(name), projects(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const items: RecentActivityItem[] = [];

  (leaves.data || []).forEach(l => {
    items.push({
      id: `leave-${l.id}`,
      type: 'leave',
      icon: '🏖️',
      title: `${(l.employees as any)?.name || 'Employee'} requested ${l.leave_type} Leave`,
      description: `Status: ${l.status}`,
      createdAt: l.created_at || new Date().toISOString(),
      timeAgo: formatTimeAgo(l.created_at),
    });
  });

  (expenses.data || []).forEach(e => {
    items.push({
      id: `exp-${e.id}`,
      type: 'expense',
      icon: '💰',
      title: `${(e.employees as any)?.name || 'Finance'} submitted expense "${e.title}"`,
      description: `Amount: ₹${Number(e.amount).toLocaleString()} (${(e.projects as any)?.name || 'General'})`,
      createdAt: e.created_at || new Date().toISOString(),
      timeAgo: formatTimeAgo(e.created_at),
    });
  });

  (reports.data || []).forEach(r => {
    items.push({
      id: `report-${r.id}`,
      type: 'site_report',
      icon: '🏗️',
      title: `${(r.employees as any)?.name || 'Site Engineer'} submitted daily site report`,
      description: `Project: ${(r.projects as any)?.name || 'Site'}`,
      createdAt: r.created_at || new Date().toISOString(),
      timeAgo: formatTimeAgo(r.created_at),
    });
  });

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, 5);
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

### 2.4 `src/app/page.tsx` Updates
Convert `src/app/page.tsx` to fetch `getDashboardMetrics()` and `getRecentActivity()` on mount, rendering real data with loading fallbacks while preserving the chart components.

---

## 3. R3: Settings Page Persistence & `supabase/phase7_settings.sql`

### 3.1 Observations & Current Code Analysis
- **File**: `src/app/settings/page.tsx`
- **Problem**: 
  - The "Company Profile" and "System Preferences" tabs contain uncontrolled inputs with static `defaultValue`s.
  - Clicking "Save Changes" or "Save Preferences" triggers no event handler.
  - Migration file `supabase/phase7_settings.sql` is missing.

### 3.2 SQL Migration: `supabase/phase7_settings.sql`
```sql
-- ==========================================
-- Phase 7: Settings & Schema Extensions
-- ==========================================

-- 1. Company Settings (Key-Value Store)
CREATE TABLE IF NOT EXISTS company_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Policies for company_settings
CREATE POLICY "Allow public select on company_settings" ON company_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on company_settings" ON company_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on company_settings" ON company_settings FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on company_settings" ON company_settings FOR DELETE TO public USING (true);

-- Seed default settings
INSERT INTO company_settings (key, value) VALUES
  ('company_name', 'Sandune Construction LLC'),
  ('registration_number', 'CR-9382012'),
  ('address', '123 Business Bay, Dubai, UAE'),
  ('currency', 'INR (₹)'),
  ('date_format', 'DD/MM/YYYY'),
  ('timezone', 'UTC - Standard'),
  ('email_notifications', 'true'),
  ('in_app_alerts', 'true')
ON CONFLICT (key) DO NOTHING;

-- 2. Schema extensions referenced across other requirements
-- R15: Purchase order line items
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS line_items jsonb DEFAULT '[]'::jsonb;

-- R19: Equipment maintenance notes
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_notes text;

-- R21: Payroll tax and deductions
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS pf_pct numeric DEFAULT 12;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS esi_pct numeric DEFAULT 1.75;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS tax_deduction numeric DEFAULT 0;
```

### 3.3 Implementation Blueprint for `src/app/settings/page.tsx`
1. **Load Settings**: On mount, query `.from('company_settings').select('*')` and convert rows into a key-value object.
2. **Form State**:
   - `company_name`, `registration_number`, `address`
   - `currency`, `date_format`, `email_notifications`, `in_app_alerts`
3. **Persist Settings**:
   - For each modified key, perform `upsert` (`supabase.from('company_settings').upsert({ key, value, updated_at: new Date().toISOString() })`).
   - Provide visual feedback ("Settings saved successfully!").

---

## 4. R7: Fix `/projects/new` Broken Route

### 4.1 Observations & Current Code Analysis
- **File**: `src/app/projects/new/page.tsx`
- **Problem**: 
  - Contains `export { default } from "../../create/page";`.
  - `src/app/create/page.tsx` only handles Employee creation (and otherwise triggers a dummy `alert()`), failing to create projects.
  - The route `/projects/new` therefore fails to create real project records in the database.

### 4.2 Implementation Blueprint
Implement `src/app/projects/new/page.tsx` as a dedicated standalone project creation page:
- Form fields:
  - Project Code (auto-generated e.g. `PRJ-${Date.now().toString().slice(-5)}`)
  - Project Name (`input required`)
  - Client (`select` populated from `getClients()`)
  - Status (`select` from `PROJECT_STATUSES`, default `'Planning'`)
  - Location (`input`)
  - Start Date & End Date (`input type="date"`)
  - Budget (`input type="number"`)
  - Project Manager (`select` populated from `getEmployees()`)
  - Description (`textarea`)
- Handler: calls `createProject()` from `src/lib/services/projectService.ts` and navigates to `/projects` on success.

---

## 5. R8: Task Editing Modal in `/tasks` and `/tasks/board`

### 5.1 Observations & Current Code Analysis
- **Files**:
  - `src/app/tasks/page.tsx` (Table view)
  - `src/app/tasks/board/page.tsx` (Kanban Board view)
  - `src/lib/services/taskService.ts` (contains `updateTask(id, updates)`, but it is unused)
- **Problem**:
  - In `/tasks`: The page only renders a read-only table with no Edit button or modal.
  - In `/tasks/board`: The page only allows drag-and-drop status changes and task creation. Clicking a task card does nothing.
  - Users have no way to edit task title, description, assigned employee, priority, status, due date, or project.

### 5.2 Implementation Blueprint
1. **In `src/app/tasks/page.tsx`**:
   - Load `projects` via `getProjects()` and `employees` via `getEmployees()`.
   - Add an "Actions" column to the table with an "Edit" button.
   - Add an Edit Task Modal with form inputs for:
     - `title`, `description`, `project_id`, `assigned_to`, `status`, `priority`, `due_date`.
   - On submission: execute `await updateTask(task.id, formUpdates)` and refresh list via `getAllTasks()`.
2. **In `src/app/tasks/board/page.tsx`**:
   - Refactor modal state to support `editingTask: Task | null`.
   - Add `onClick={() => openEditModal(task)}` to each task card.
   - When editing, pre-fill form with the clicked task's data.
   - On submission: if `editingTask` is present, call `updateTask(editingTask.id, formUpdates)`; otherwise call `createTask(formUpdates)`.
   - Refresh board via `load()`.

---

## 6. R12: Project → Client Linkage in `/projects` and `/projects/[id]`

### 6.1 Observations & Current Code Analysis
- **Files**:
  - `src/app/projects/page.tsx` (Line 149 uses `<input value={form.client} placeholder="Client name" />`)
  - `src/app/projects/[id]/page.tsx` (Edit form does not include `client` input at all; view mode does not display client details clearly)
  - `src/lib/services/crmService.ts` (exports `getClients(): Promise<Client[]>`)
  - `src/lib/services/projectService.ts` (`Project.client` is a string field)

### 6.2 Implementation Blueprint
1. **In `src/app/projects/page.tsx`**:
   - Import `getClients`, `Client` from `@/lib/services/crmService`.
   - Load clients on mount alongside projects and employees:
     ```typescript
     const [p, e, c] = await Promise.all([getProjects(), getEmployees(), getClients()]);
     setClients(c);
     ```
   - Replace the free-text client `<input>` with:
     ```tsx
     <div className={styles.fg}>
       <label className={styles.fl}>Client</label>
       <select
         value={form.client}
         onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
         className={styles.fi}
       >
         <option value="">Select Client...</option>
         {clients.map(c => (
           <option key={c.id} value={c.name}>{c.name}</option>
         ))}
       </select>
     </div>
     ```
2. **In `src/app/projects/[id]/page.tsx`**:
   - Import `getClients`, `Client` from `@/lib/services/crmService`.
   - Load `clients` in `load()`: `const [p, t, c] = await Promise.all([getProject(id), getTasksByProject(id), getClients()]);`.
   - In Edit Form: Add Client `<select>` dropdown populated from `clients`.
   - In View Mode: Display client in the summary card / header info badge.

---

## 7. Verification & TypeScript Compatibility Plan

1. **TypeScript Type Safety**:
   - Ensure all service return types and component prop types align.
   - Run `npx tsc --noEmit` to verify 0 type errors.
2. **Unit & Integration Tests**:
   - Ensure unit test files (`page.test.tsx`, `projects/new/page.test.tsx`, `tasks/page.test.tsx`, `settings/page.test.tsx`) pass.
   - Verify `localDb.ts` supports any mock tables (`company_settings`) needed by test runners.

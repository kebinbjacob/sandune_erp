## 2026-08-08T14:39:35Z
You are worker_m2_1. Your working directory is c:/Users/kelvin babu/Downloads/sandune-main/sandune-main/.agents/teamwork_preview_worker_m2_1. Create this directory if it doesn't exist.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Objective is to implement R1, R2, and R3 requirements for Sandune Core HR & Supabase Integration:

### 1. Database Schema & RBAC SQL (`supabase/schema.sql`):
- Create `supabase/schema.sql` with full DDL for Core HR:
  - Table `employees` (id uuid default gen_random_uuid() primary key, employee_id text, name text not null, email text, phone text, role text not null, department text, project text, status text not null default 'Active', joining_date date default current_date, salary numeric, created_at timestamptz default now(), updated_at timestamptz default now()).
  - Table `attendance` (id uuid default gen_random_uuid() primary key, employee_id uuid references employees(id) on delete cascade, date date default current_date, check_in text, check_out text, status text not null default 'Present', notes text, created_at timestamptz default now()).
  - Table `leave_requests` (id uuid default gen_random_uuid() primary key, employee_id uuid references employees(id) on delete cascade, leave_type text not null, start_date date not null, end_date date not null, status text not null default 'Pending', reason text, approved_by uuid references employees(id), created_at timestamptz default now()).
- Enable Row Level Security (RLS) on all three tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
- Add RLS policies permitting public/anon and authenticated users to SELECT, INSERT, UPDATE, DELETE Core HR data.
- Add seed INSERT statements in `schema.sql` for initial employees (EMP-001 John Doe, EMP-002 Sarah Smith, EMP-003 Mike Johnson, EMP-004 Emily Chen).
- Execute SQL / apply schema script to the live Supabase instance using `@supabase/supabase-js` or HTTP REST/Management API or node script using standard environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) from `.env.local`. Verify tables exist or can be queried/inserted.

### 2. Frontend Supabase Client & Core HR Integration:
- Install `@supabase/supabase-js` package if not already in `package.json` (`npm install @supabase/supabase-js`).
- Create `@/lib/supabase/client.ts` (or `src/lib/supabase/client.ts`) exporting initialized Supabase client reading `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Create employee service `@/lib/services/employeeService.ts` providing `getEmployees()` and `createEmployee(data)`.
- Update `/employees` page (`src/app/employees/page.tsx`):
  - Fetch live employee records from Supabase `employees` table.
  - Render employee table using existing `<Table>` and `<Card>` components.
  - Retain existing glassmorphic Vanilla CSS styling system, status badges (`styles.statusActive`, `styles.statusLeave`), buttons, and layout intact.
- Update Add Employee form (`src/app/create/page.tsx` & `src/app/employees/new/page.tsx`):
  - Update form inputs to collect employee details (Name, Role, Department, Project, Email, Phone, Status).
  - Connect form submission to insert record into Supabase `employees` table.
  - Handle success/error state gracefully and navigate to `/employees`.
  - Maintain glassmorphic Vanilla CSS inputs (`styles.searchInput`), card containers, and button styling.

### 3. Jest Tests & Build Verification:
- Update `jest.setup.js` to set default mock environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and global Supabase client mock if needed for test environment.
- Ensure all Jest tests (`npm test`) pass cleanly.
- Run `npm test` and `npm run build` (or Next.js build verification command) and verify output.

Document all created/modified files, test execution outputs, and verification steps in `c:/Users/kelvin babu/Downloads/sandune-main/sandune-main/.agents/teamwork_preview_worker_m2_1/handoff.md`.
Update `progress.md` in your working directory as you proceed. Send a message to orchestrator when completed.

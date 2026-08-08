# Project: Sandune Core HR & Supabase Integration

## Architecture
- Next.js 16 App Router frontend (`src/app/`)
- Supabase PostgreSQL Database backend with Row Level Security (RLS)
- Glassmorphic Vanilla CSS design system (`globals.css` + CSS Modules)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Codebase, routing, tests & Supabase inspection | None | DONE |
| 2 | Schema & RBAC Creation | Core HR tables (`employees`, `attendance`, `leave_requests`) & RLS SQL | M1 | DONE |
| 3 | Frontend & Supabase Integration | Client helper, `/employees` live fetching, Add Employee form insertion | M2 | DONE |
| 4 | Test Verification & Audit | Jest tests, CSS preservation & forensic integrity check | M3 | IN_REMEDIATION |

## Interface Contracts
### Supabase Core HR Client Service ↔ Next.js Pages
- `@/lib/supabase/client.ts`: Exports `supabase` client initialized from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `@/lib/services/employeeService.ts`:
  - `getEmployees()`: fetches employee list from `employees` table in Supabase.
  - `createEmployee(data)`: inserts new employee record into `employees` table in Supabase.

## Code Layout
- `src/app/`: Next.js App Router pages (`employees`, `create`, `attendance`, `leave`)
- `src/lib/supabase/`: Supabase client initialization
- `src/lib/services/`: Core HR service functions for Supabase data operations
- `src/components/`: Reusable UI components (`Card`, `Table`, `Navbar`, `Sidebar`)
- `supabase/`: `schema.sql` migration and RLS RBAC policy definitions

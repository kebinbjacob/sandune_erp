# Changes Log - Milestone 2 (Test Framework & Local DB Infrastructure Setup)

## Summary of Changes

### 1. Installed DevDependencies (`package.json`)
- Installed `vitest`, `jsdom`, `@vitejs/plugin-react`, and `vite-tsconfig-paths` using `npm install --legacy-peer-deps -D`.

### 2. Created Vitest Configuration (`vitest.config.ts`)
- Created `vitest.config.ts` at project root with:
  - React 19 JSX plugin (`@vitejs/plugin-react`)
  - Path alias resolution plugin (`vite-tsconfig-paths`)
  - Test environment: `jsdom`
  - Globals enabled (`globals: true`)
  - Setup files configured: `['./vitest.setup.ts']`
  - Parallel execution thread pool configured: `pool: 'threads'`

### 3. Created Vitest Setup Script (`vitest.setup.ts`)
- Created `vitest.setup.ts` at project root with:
  - Imported `@testing-library/jest-dom`
  - Configured global `jest` alias `(globalThis as any).jest = vi`
  - Configured `process.env` defaults (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NODE_ENV = 'test'`)
  - Automated reset of local database state (`testDb.reset()`) before each test
  - Global `vi.mock('@/lib/supabase/client')` wrapping `createTestSupabaseClient(testDb)` for stateful DB execution and spy assertion compatibility

### 4. Local Database Infrastructure (Requirement R2)
- Created `src/lib/db/localDb.ts`:
  - `LocalDatabase`: Stateful in-memory database engine supporting table storage (`employees`, `app_users`, `auth_users`, `attendance`, `attendance_audit_log`, `leave_requests`, `payroll_runs`) pre-seeded with initial schema data.
  - `LocalQueryBuilder`: Executes genuine Create, Read, Update, Delete queries with filtering (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `is`, `like`, `ilike`), ordering (`order`), limiting (`limit`), single row unwrapping (`single`), relational joins (`select('*, employees(*)')`), and upserts (`upsert`).
  - `LocalAuth`: Real authentication user state tracking (`signUp`, `signInWithPassword`, `signOut`, `getUser`).
- Created `src/lib/supabase/testDb.ts`:
  - Client helper exporting `testDb` singleton instance, `createTestSupabaseClient`, `resetTestDb`, `seedTestDb`, and `getTestDbRows`.
- Created `src/lib/services/__tests__/localDbIntegration.test.ts`:
  - Integration test suite executing true backend service integration testing (`authService`, `userService`, `employeeService`, `attendanceService`, `leaveService`, `payrollService`) against the local database infrastructure.

### 5. Updated npm Scripts (`package.json`)
- Updated `"test": "vitest run"`
- Added `"test:vitest": "vitest run"`

### 6. Updated Tests
- Updated `src/lib/services/__tests__/employeeService.test.ts` to expect genuine state outcomes from `LocalDatabase`.

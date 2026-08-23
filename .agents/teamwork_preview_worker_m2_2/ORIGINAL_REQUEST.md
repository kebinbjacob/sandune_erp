## 2026-08-11T19:37:36Z

Your working directory is: c:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_worker_m2_2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your mission: Milestone 2 — Test Framework & Local DB Infrastructure Setup for Sandune.

Tasks:
1. Install missing devDependencies for Vitest + React Testing Library: `vitest`, `jsdom`, `@vitejs/plugin-react`, `vite-tsconfig-paths` (and any local DB packages if needed).
2. Create `vitest.config.ts` at project root with:
   - React 19 JSX plugin (`@vitejs/plugin-react`)
   - Path alias plugin (`vite-tsconfig-paths`)
   - Environment: `jsdom`
   - Globals: `true`
   - Setup files: `['./vitest.setup.ts']`
   - Thread pool / parallel worker execution configured (`pool: 'threads'`).
3. Create `vitest.setup.ts` at project root:
   - Import `@testing-library/jest-dom`
   - Configure global jest alias `(globalThis as any).jest = vi`
   - Set process.env defaults for test execution.
4. Set up local database integration infrastructure (Requirement R2: Local database setup for true backend service integration testing):
   - Create a local database setup / client helper (e.g. `@/lib/supabase/testDb.ts` or `@/lib/db/localDb.ts` or SQLite / PostgreSQL / local Supabase adapter) that provides real table storage (`users`, `auth_users`, `employees`, etc.) and executes genuine SQL/CRUD operations.
   - Ensure backend services (`authService`, `userService`, `employeeService`) can execute Create, Read, Update, Delete queries against this local database during integration testing.
5. Update `package.json` scripts to include `"test:vitest": "vitest run"` and `"test": "vitest run"`.
6. Run `npx vitest run` to verify that Vitest initializes and runs cleanly.
7. Write full changes log to `c:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_worker_m2_2\changes.md` and handoff report to `c:\Users\kelvin babu\Downloads\sandune-main\sandune-main\.agents\teamwork_preview_worker_m2_2\handoff.md`.

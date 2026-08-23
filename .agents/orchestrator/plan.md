# Execution Plan — Sandune Vitest & Database Integration Testing Suite

## Overview
This plan governs the setup of Vitest + React Testing Library (RTL) for parallel execution in Next.js, local database (Supabase/PostgreSQL/SQLite) integration for true backend CRUD testing, and implementation of UI component and backend service test suites with zero failures.

## Milestones

### Milestone 1: Exploration & Codebase Analysis
- Explore codebase structure: package.json dependencies, Next.js config, tsconfig.json path aliases (`@/*`).
- Inspect existing services (`authService`, `userService`, `employeeService`, etc.) and UI components (`Login` page, login forms, employee forms, etc.).
- Inspect local DB setup, Supabase environment, Docker/Local Postgres availability, or SQLite/embedded DB fallback capabilities.

### Milestone 2: Test Framework & Local DB Infrastructure Setup
- Install/configure `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`/`happy-dom`, `@vitejs/plugin-react` if needed.
- Create/configure `vitest.config.ts` with parallel worker execution, React JSX support, path alias resolution (`@/` -> `./src/` or `./`), and setup files.
- Set up local test database harness (e.g. Supabase local CLI, local Postgres, or local DB instance) for backend service integration testing.
- Add test script commands to `package.json` (`npm run test:vitest`, `npx vitest run`).

### Milestone 3: Test Implementation (UI & Backend Service CRUD)
- Write UI component unit & interaction tests (e.g. Login form rendering, user input, submit behavior).
- Write backend service integration tests performing real CRUD operations against the local database (`authService`, `userService`, `employeeService`).
- Ensure parallel execution across test files and 100% pass rate.

### Milestone 4: Verification, Adversarial Testing & Forensic Audit
- Verify test assertions are non-trivial and truly validate functionality.
- Perform adversarial tests to ensure failures occur when breaking changes are introduced.
- Run Forensic Integrity Audit to guarantee zero hardcoded/mocked facade tricks or swallowed errors.


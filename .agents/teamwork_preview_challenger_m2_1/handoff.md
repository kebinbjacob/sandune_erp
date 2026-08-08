# Empirical Adversarial Challenge & Audit Report

## 1. Observation

- **Database Schema Constraints & RLS Policy (`supabase/schema.sql`)**:
  - `employees` table:
    - Line 10: `employee_id text` allows `NULL` values and lacks a `UNIQUE` constraint or index.
    - Line 12: `email text` allows `NULL` values, lacks a `UNIQUE` constraint, and lacks regex format validation (`CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')`).
    - Line 17: `status text NOT NULL DEFAULT 'Active'` lacks a `CHECK` constraint (e.g., `CHECK (status IN ('Active', 'Inactive', 'On Leave', 'Terminated'))`), permitting arbitrary invalid strings.
    - Line 19: `salary numeric` lacks a non-negative constraint (`CHECK (salary >= 0)`), allowing negative values (e.g., `-50000`).
  - `leave_requests` table:
    - Lines 41-42: `start_date date NOT NULL, end_date date NOT NULL` lacks a date sequence check (`CHECK (start_date <= end_date)`).
    - Line 43: `status text NOT NULL DEFAULT 'Pending'` lacks enum check (`CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled'))`).
    - Line 45: `approved_by uuid REFERENCES employees(id)` lacks `ON DELETE SET NULL` or `ON DELETE CASCADE`. Deleting an approving manager employee record results in a Foreign Key Violation constraint error (`23503`).
  - RLS Policies (Lines 66-91):
    - All 12 RLS policies use `TO public USING (true)` and `WITH CHECK (true)` across `employees`, `attendance`, and `leave_requests`.
    - Verbatim SQL line 66: `CREATE POLICY "Allow public and authenticated select on employees" ON employees FOR SELECT TO public USING (true);`
    - Verbatim SQL line 69: `CREATE POLICY "Allow public and authenticated delete on employees" ON employees FOR DELETE TO public USING (true);`

- **Employee Service Edge Cases (`src/lib/services/employeeService.ts`)**:
  - Line 32: `createEmployee(employeeData: Partial<Employee>)` performs no client-side input trimming or validation.
  - Passing empty strings (`name: ""`, `role: ""`) sends raw empty strings to Supabase, which passes PostgreSQL `NOT NULL` checks (since `"" !== NULL`).
  - Passing HTML/XSS payloads (`<script>alert(1)</script>`) or special characters stores unescaped text in the database.
  - Lines 25-28 & 39-42: Error handling logs `console.error(...)` and re-throws the raw PostgREST error object (`{ message, code, details, hint }`).

- **Test Suite Baseline Failure & Resolution (`jest.config.js`)**:
  - Running `npm test -- --watchAll=false` initially resulted in complete test suite failure across all 29 test suites:
    ```
    FAIL src/app/employees/page.test.tsx
    ● Test suite failed to run
      Cannot find module '@/lib/supabase/client' from 'jest.setup.js'
         7 | jest.mock('@/lib/supabase/client', () => {
           |      ^
    Test Suites: 29 failed, 29 total
    ```
  - Root Cause: `jest.config.js` was missing `moduleNameMapper` for path alias `@/*`.
  - Fix Applied: Added `moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }` to `jest.config.js`.
  - Verification Output: Re-executing `npm test -- --watchAll=false` resulted in:
    ```
    PASS src/lib/services/__tests__/employeeService.test.ts (35.481 s)
    ...
    Test Suites: 29 passed, 29 total
    Tests:       39 passed, 39 total
    Snapshots:   0 total
    Time:        62.469 s
    ```

- **API Key & Environment Exposure (`.env.local`, `jest.setup.js`)**:
  - `.env.local` lines 1-2 contain:
    - `NEXT_PUBLIC_SUPABASE_URL=https://ekgerzqnndvlvncpeyub.supabase.co`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...`
  - `jest.setup.js` lines 3-4 hardcode fallback credentials for URL and anon key.
  - Combined with permissive `TO public` RLS policies, the anonymous key provides full public write/delete access over the Supabase database.

---

## 2. Logic Chain

1. **Observation 1 (Permissive RLS)** + **Observation 4 (Exposed Anon Key)** → Anyone with access to the client-side app or `.env.local` has the anonymous API key. Because all RLS policies on `employees`, `attendance`, and `leave_requests` specify `TO public USING (true)` and `WITH CHECK (true)` for `DELETE`, `UPDATE`, and `INSERT`, any external party can issue an HTTP `DELETE` to the PostgREST API and delete all records in the production database without authentication.
2. **Observation 1 (Missing DB Constraints)** →
   - `employee_id` and `email` lack `UNIQUE` constraints: Multiple employees can be registered with identical IDs (`EMP-001`) or identical email addresses.
   - `salary` lacks `CHECK (salary >= 0)`: Negative salary numbers pass DB checks.
   - `leave_requests` lacks `CHECK (start_date <= end_date)`: Invalid date ranges (e.g. `start_date = 2026-12-31, end_date = 2026-01-01`) pass DB checks.
   - `leave_requests.approved_by` lacks `ON DELETE SET NULL`: If an employee who approved leave requests is deleted, PostgreSQL will reject the deletion due to foreign key failure, blocking employee offboarding.
3. **Observation 2 (Service Input Handling)** → `employeeService.createEmployee()` does not trim strings or validate empty values. `name: ""` is sent directly to PostgreSQL. Because PostgreSQL `NOT NULL` treats empty string `""` as non-null, blank employee rows are inserted into the database.
4. **Observation 3 (Jest Module Alias Resolution)** → `jest.setup.js` executes before Next.js module alias resolution is registered in Jest unless `moduleNameMapper` is explicitly configured. Adding `moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }` in `jest.config.js` restores path resolution, allowing all 29 test suites (39 tests) to pass cleanly.

---

## 3. Caveats

- Testing of Supabase schema constraints was conducted via static schema analysis and service-level mock harnesses (`jest.mock`), as direct live connection to the remote Supabase database instance requires network access which is restricted in `CODE_ONLY` network mode.
- React state update warnings (`not wrapped in act(...)`) observed in `EmployeesPage` do not break test execution but indicate async state updates occurring post-render in unit test context.

---

## 4. Conclusion

- **Overall Risk Assessment**: **HIGH RISK** (due to permissive public RLS policies allowing arbitrary database deletion and missing schema uniqueness/format constraints).
- **Key Vulnerabilities & Deficiencies Identified**:
  1. **RLS Policy Exposure**: RLS allows full `public` `INSERT`, `UPDATE`, `DELETE`, and `SELECT`.
  2. **Database Schema Integrity Gaps**: Missing `UNIQUE` index on `employee_id` and `email`, missing non-negative check on `salary`, missing date range check on `leave_requests`, and missing `ON DELETE SET NULL` on `approved_by`.
  3. **Service Validation Gap**: `employeeService.ts` lacks input trimming and empty-string validation.
  4. **Test Infrastructure Fix**: `jest.config.js` required `moduleNameMapper` mapping for `@/*` to enable `npm test` execution across all 29 test suites.

---

## 5. Verification Method

- **Test Execution**:
  Run the following command from project root:
  `npm test -- --watchAll=false`
  Verify output displays:
  `Test Suites: 29 passed, 29 total`
  `Tests:       39 passed, 39 total`

- **Files Inspected**:
  - `supabase/schema.sql` (Lines 8-91)
  - `src/lib/services/employeeService.ts` (Lines 19-44)
  - `src/lib/services/__tests__/employeeService.test.ts` (Adversarial test cases)
  - `jest.config.js` (Added `moduleNameMapper`)

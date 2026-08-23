# Empirical Adversarial Challenge Report: Vitest & Local DB Infrastructure Setup

## Challenge Summary

**Overall Risk Assessment**: **HIGH**

Empirical adversarial verification of the Vitest configuration (`vitest.config.ts`), test setup environment (`vitest.setup.ts`), local database emulator (`src/lib/db/localDb.ts`), and Supabase test database interface (`src/lib/supabase/testDb.ts`) revealed critical structural vulnerabilities in state isolation, error handling, query validation, and parallel test execution compatibility.

---

## Challenges

### [HIGH] Challenge 1: Global Singleton State Causes Cross-Test Leakage in Concurrent Execution
- **Assumption Challenged**: `testDb` singleton instance can handle parallel or concurrent test execution without cross-test state pollution.
- **Attack Scenario**:
  - `src/lib/supabase/testDb.ts` (line 4) exports a single shared instance: `export const testDb = new LocalDatabase();`.
  - `vitest.setup.ts` (lines 16–18) registers `beforeEach(() => { testDb.reset(); })`.
  - When tests within a test suite run concurrently using `describe.concurrent` or `it.concurrent`, or when asynchronous operations span across `beforeEach` boundaries:
    1. Test A inserts a temporary employee record `EMP-999` and executes an async query.
    2. Test B concurrently invokes `testDb.reset()` via its `beforeEach` hook or mutates tables.
    3. Test A reads from `testDb` mid-reset or observes Test B's mutated records, resulting in non-deterministic test failures or false passes.
- **Blast Radius**: Flaky test failures in CI/CD pipelines, inability to run concurrent test suites within files, state leakage across async test boundaries.
- **Mitigation**: Factory-based test database creation (`createIsolatedTestDb()`) per test context or request context instead of a global shared singleton `testDb`.

---

### [HIGH] Challenge 2: `LocalQueryBuilder.single()` Permits Multi-Row Results Without PGRST116 Error (False Positive Risk)
- **Assumption Challenged**: `.single()` accurately mimics PostgREST / Supabase behavior by returning an error when multiple rows match a query.
- **Attack Scenario**:
  - In `src/lib/db/localDb.ts` (lines 500–502):
    ```typescript
    if (this.isSingle) {
      if (processed.length === 0) {
        return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
      }
      return { data: processed[0], error: null };
    }
    ```
  - When a query matching multiple rows (e.g. `supabase.from('employees').select('*').single()`) is executed, PostgREST returns error `PGRST116`.
  - In `localDb.ts`, when `processed.length > 1`, it silently returns `processed[0]` with `error: null`.
- **Blast Radius**: High false-positive risk. Application code relying on `.single()` constraint enforcement will pass tests even when queries match multiple records, masking production query bugs.
- **Mitigation**: Update `LocalQueryBuilder.execute()` in `localDb.ts` to check `if (processed.length !== 1)` when `isSingle` is `true` and return the `PGRST116` error for both 0 and >1 matched rows.

---

### [MEDIUM] Challenge 3: Silent Success on Non-Existent Record Updates & Deletions
- **Assumption Challenged**: Updating or deleting non-existent IDs in `localDb.ts` alerts callers to missing records.
- **Attack Scenario**:
  - In `src/lib/services/employeeService.ts` (lines 47–50):
    ```typescript
    export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
      const { error } = await supabase.from('employees').update(updates).eq('id', id);
      if (error) throw error;
    }
    ```
  - In `src/lib/db/localDb.ts` (lines 394–414): `update()` loops over rows matching `eq('id', id)`. When 0 rows match and `.single()` is not chained, `update()` returns `{ data: [], error: null }`.
  - Calling `updateEmployee('invalid-non-existent-uuid', { salary: 100000 })` completes silently without throwing any error.
- **Blast Radius**: False positive test passes when code attempts to update or delete non-existent entities; missing error feedback in UI services.
- **Mitigation**: Ensure update and delete query builders validate affected row counts or expose explicit row count status if strict existence checks are expected.

---

### [MEDIUM] Challenge 4: Module-Level Mocking in `vitest.setup.ts` Instantiates Shared Spies Across Tests
- **Assumption Challenged**: `vi.mock('@/lib/supabase/client')` creates fresh isolated spies per test.
- **Attack Scenario**:
  - In `vitest.setup.ts` (lines 21–33):
    ```typescript
    vi.mock('@/lib/supabase/client', () => {
      const testClient = createTestSupabaseClient(testDb);
      const fromSpy = vi.fn((table: string) => testClient.from(table));
      return { supabase: { from: fromSpy, auth: testClient.auth, db: testDb } };
    });
    ```
  - `fromSpy` is initialized once during module compilation.
  - If Test Suite 1 asserts `expect(supabase.from).toHaveBeenCalledTimes(2)`, and Test Suite 2 ran previously without `clearMocks: true` in `vitest.config.ts`, `fromSpy.mockCalls` contains accumulated call history from prior tests.
- **Blast Radius**: False test failures due to spy state pollution across test execution order.
- **Mitigation**: Add `clearMocks: true`, `restoreMocks: true`, or `mockReset: true` to `test` configuration in `vitest.config.ts`.

---

### [LOW] Challenge 5: Incomplete Relation Joins & Strict Type Filters in `localDb.ts`
- **Assumption Challenged**: `LocalDatabase` handles generalized relational joins and query filtering edge cases.
- **Attack Scenario**:
  - `attachRelations` in `localDb.ts` (lines 316–343) only parses `employees` table joins. Queries attempting to join other tables (e.g. `attendance_audit_log(users(...))`) silently return un-joined raw rows.
  - Pattern matching (`like`/`ilike`) in `matchesFilters` (lines 301–311) silently filters out `null` or `undefined` column values by returning `false` instead of adhering to standard SQL null propagation rules.
- **Blast Radius**: Unhandled relations in complex integration tests; subtle discrepancy between local DB behavior and real Postgres/Supabase SQL execution.
- **Mitigation**: Extend `attachRelations` to support generic relational resolution or document table join limits for local integration tests.

---

## Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| Query `.select('*').single()` on table with 4 rows | Returns error `PGRST116` (multiple rows returned) | Returns `processed[0]` with `error: null` | ❌ **FAIL (False Positive Pass)** |
| `updateEmployee('non-existent-id', {...})` | Throws error or reports 0 rows updated | Returns `{ error: null }` silently | ❌ **FAIL (Silent Failure)** |
| Concurrent tests (`it.concurrent`) updating `testDb` | Isolated state per test | Shared `testDb` Map overwritten mid-test | ❌ **FAIL (State Leakage)** |
| Service fetching seeded default employees | Returns 4 employees (`John Doe`, `Sarah Smith`, etc.) | Returns 4 employees | ✅ **PASS** |
| Auth login with invalid password | Rejects with `Incorrect password` | Rejects with `Incorrect password` | ✅ **PASS** |

---

## Unchallenged Areas

- **Frontend UI Component Rendering**: Component tests in `src/app/__tests__/empirical_adversarial.test.tsx` for `EmployeesPage` and `CreatePage` using React Testing Library mocks are functioning as intended.
- **Glassmorphic Styling Verification**: CSS rule checks in `empirical_adversarial.test.tsx` verifying `globals.css` variables (`--bg-primary`, `--bg-secondary`) and `backdrop-filter: blur(12px)`.

# Adversarial Test Findings: Backend Service CRUD Test Suites

**Date**: 2026-08-11
**Target Scope**: 
- `src/__tests__/integration/authService.test.ts`
- `src/__tests__/integration/employeeServiceCrud.test.ts`
- `src/__tests__/integration/userServiceCrud.test.ts`
- `src/lib/services/authService.ts`
- `src/lib/services/employeeService.ts`
- `src/lib/services/userService.ts`

---

## Challenge Summary

**Overall Risk Assessment**: **HIGH**

Empirical mutation analysis and structural evaluation of the backend CRUD integration test suites revealed **3 distinct False-Positive Pass Vulnerabilities**, **1 Service Implementation Defect**, and **2 Error-Handling Coverage Gaps**. 

While the test suites successfully catch core state modifications (such as broken updates or failed deletes on individual items), they rely heavily on weak assertions (such as `.toHaveLength()` or incomplete field checks) when testing collection reads and object creations. As a result, critical breaking changes—such as dropping relational table joins, losing insertion attributes, or misordering queries—pass through `employeeServiceCrud.test.ts` and `userServiceCrud.test.ts` completely undetected.

---

## Challenges & Mutation Vulnerabilities

### [High] Vulnerability 1: Relational Join Erasure in `getUsers()` Causes False Positive Pass

- **Target File**: `src/lib/services/userService.ts` (`getUsers`)
- **Test Suite**: `src/__tests__/integration/userServiceCrud.test.ts`
- **Assumption Challenged**: Tests verify that `getUsers()` properly returns `app_users` records along with their joined `employees` relation.
- **Attack Scenario / Mutation**:
  Mutate `getUsers()` to strip out the relational query `employees (*)`:
  ```typescript
  // src/lib/services/userService.ts
  export async function getUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*') // MUTATION: dropped '*, employees (*)'
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  ```
- **Blast Radius**: Frontend components relying on `user.employees.name` (e.g. User Management table, Navigation header) encounter runtime `TypeError: Cannot read properties of undefined (reading 'name')` or render empty employee fields across the app.
- **Adversarial Result**: **FALSE POSITIVE PASS**. In `userServiceCrud.test.ts`, `getUsers()` is called on lines 39 and 64, but the test only checks `expect(allUsers.length).toBe(3)` and `expect(finalUsers.length).toBe(2)`. It never asserts that `user.employees` exists or is populated for items in the list.
- **Mitigation**: Add explicit relation assertions to `userServiceCrud.test.ts`:
  ```typescript
  expect(allUsers[0].employees).toBeDefined();
  expect(allUsers[0].employees?.name).toBeDefined();
  ```

---

### [High] Vulnerability 2: Field Loss in `createEmployee()` & `createUser()` Passes Undetected

- **Target Files**: `src/lib/services/employeeService.ts` (`createEmployee`), `src/lib/services/userService.ts` (`createUser`)
- **Test Suites**: `src/__tests__/integration/employeeServiceCrud.test.ts`, `src/__tests__/integration/userServiceCrud.test.ts`
- **Assumption Challenged**: Tests verify that all payload attributes passed into `createEmployee()` and `createUser()` are persisted and returned.
- **Attack Scenario / Mutation**:
  Mutate `createEmployee()` to drop optional fields such as `joining_date`, `email`, `phone`, `department`, `project`:
  ```typescript
  // src/lib/services/employeeService.ts
  export async function createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    const { joining_date, phone, department, ...rest } = employeeData; // MUTATION: field stripping
    const { data, error } = await supabase.from('employees').insert([rest]).select().single();
    if (error) throw error;
    return data;
  }
  ```
- **Blast Radius**: New employees created through the backend service lose critical business metadata (joining date, contact info, assigned department), leading to data corruption in local DB / Supabase.
- **Adversarial Result**: **FALSE POSITIVE PASS**. In `employeeServiceCrud.test.ts` (lines 32-38), `newEmpInput` includes `joining_date`, `email`, `phone`, `department`, `project`, `status`, but assertions ONLY check `id`, `name`, `employee_id`, `salary`, `created_at`. Missing fields are never asserted. Similarly, `userServiceCrud.test.ts` passes `department: 'Safety'` in `newUserInput` but only asserts `id`, `email`, `role`, `status`.
- **Mitigation**: Expand creation assertions in both test suites to cover all input fields:
  ```typescript
  expect(createdEmp.joining_date).toBe('2026-02-01');
  expect(createdEmp.department).toBe('Executive');
  expect(createdEmp.phone).toBe('+1-555-0110');
  ```

---

### [Medium] Vulnerability 3: Query Ordering Contract Invalidation in `getEmployees()` Passes Undetected

- **Target File**: `src/lib/services/employeeService.ts` (`getEmployees`)
- **Test Suite**: `src/__tests__/integration/employeeServiceCrud.test.ts`
- **Assumption Challenged**: Tests enforce the chronological ordering contract (`order('created_at', { ascending: true })`) specified in `getEmployees()`.
- **Attack Scenario / Mutation**:
  Invert query ordering in `getEmployees()` from ascending to descending:
  ```typescript
  // src/lib/services/employeeService.ts
  export async function getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false }); // MUTATION: inverted order
    if (error) throw error;
    return data || [];
  }
  ```
- **Blast Radius**: Employee listings display records in reverse chronological order or arbitrary database sequence, violating UI layout and audit expectations.
- **Adversarial Result**: **FALSE POSITIVE PASS**. `employeeServiceCrud.test.ts` only asserts `toHaveLength(5)` and `toHaveLength(4)`. It does not check array order or relative timestamps.
- **Mitigation**: Assert ordering contract in `employeeServiceCrud.test.ts`:
  ```typescript
  expect(new Date(employeesList[0].created_at!).getTime())
    .toBeLessThanOrEqual(new Date(employeesList[1].created_at!).getTime());
  ```

---

### [High] Implementation Defect: Stale `last_login` Return in `authService.ts`

- **Target File**: `src/lib/services/authService.ts` (`loginWithEmail`, lines 5-30)
- **Test Suite**: `src/__tests__/integration/authService.test.ts` (lines 22-35)
- **Defect Analysis**:
  In `authService.ts`:
  ```typescript
  export async function loginWithEmail(email: string, password?: string): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*, employees(*)')
      .eq('email', email)
      .single(); // 1. Data selected BEFORE last_login is updated

    if (error || !data) { ... }
    if (data.password && data.password !== password) { ... }
    if (data.status !== 'Active') { ... }

    // 2. Update last login in database
    await supabase
      .from('app_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    // 3. Stale data object returned to caller!
    return data as AppUser;
  }
  ```
  Because `data` is queried on line 5 *before* `last_login` is updated on line 25, the returned `AppUser` object contains `last_login: undefined` (for pre-seeded users without an existing `last_login`).
- **Test Suite Behavior**: `authService.test.ts` line 26 asserts `expect(user.last_login).toBeDefined()`. When executed, this assertion fails!
- **Mitigation / Fix in Service**: Update `data.last_login` in memory or re-assign before returning:
  ```typescript
  const now = new Date().toISOString();
  await supabase.from('app_users').update({ last_login: now }).eq('id', data.id);
  data.last_login = now;
  return data as AppUser;
  ```

---

### [Medium] Error-Handling Gap: Non-Existent ID Updates/Deletes Silently Succeed

- **Target Files**: `src/lib/services/employeeService.ts` (`updateEmployee`, `deleteEmployee`), `src/lib/services/userService.ts` (`updateUser`, `deleteUser`)
- **Test Suites**: `employeeServiceCrud.test.ts`, `userServiceCrud.test.ts`
- **Defect Analysis**:
  Calling `updateEmployee('non-existent-id', updates)` executes:
  `await supabase.from('employees').update(updates).eq('id', id)` (without `.single()`).
  Supabase / `LocalQueryBuilder` returns `{ data: [], error: null }` when zero rows match. Thus, `error` is `null`, and the function silently resolves without throwing or signaling that zero records were affected.
- **Adversarial Result**: **UNTESTED EDGE CASE**. Integration suites test raw Supabase queries with `.single()`, but never test calling the service functions with non-existent IDs.

---

## Stress Test Verification Matrix

| ID | Target Function | Mutation / Scenario | Expected Behavior | Actual Test Suite Behavior | Result |
|---|---|---|---|---|---|
| ST-01 | `getUsers()` | Remove `employees(*)` relation join | Test suite fails on missing relation | `userServiceCrud.test.ts` passes (`toHaveLength(3)`) | **FAIL (False Positive)** |
| ST-02 | `createEmployee()` | Strip `joining_date`, `phone`, `department` | Test suite fails on missing fields | `employeeServiceCrud.test.ts` passes (only checks 5 fields) | **FAIL (False Positive)** |
| ST-03 | `createUser()` | Strip `department`, `employee_id` | Test suite fails on missing fields | `userServiceCrud.test.ts` passes (only checks 4 fields) | **FAIL (False Positive)** |
| ST-04 | `getEmployees()` | Invert order (`ascending: false`) | Test suite fails on order mismatch | `employeeServiceCrud.test.ts` passes (`toHaveLength(5)`) | **FAIL (False Positive)** |
| ST-05 | `loginWithEmail()` | Execute authentication flow | Return user with defined `last_login` | `authService.test.ts` fails (`user.last_login` is undefined) | **FAIL (Service Defect)** |
| ST-06 | `updateEmployee()` | Return without updating DB (no-op) | Test suite fails on field check | `employeeServiceCrud.test.ts` fails (`role` mismatch) | **PASS (True Catch)** |
| ST-07 | `deleteEmployee()` | Return without deleting record (no-op) | Test suite fails on post-delete fetch | `employeeServiceCrud.test.ts` fails (`postDelete` not null) | **PASS (True Catch)** |
| ST-08 | `loginWithEmail()` | Bypass password check | Test suite fails on invalid password | `authService.test.ts` fails (expected exception missed) | **PASS (True Catch)** |
| ST-09 | `loginWithEmail()` | Bypass suspended status check | Test suite fails on suspended login | `authService.test.ts` fails (expected exception missed) | **PASS (True Catch)** |

---

## Unchallenged Areas

- **`attendanceService.ts` & `leaveService.ts`**: Evaluated in `localDbIntegration.test.ts`; out of primary scope for `src/__tests__/integration/*.test.ts`.
- **Database transaction locks & concurrency**: Local DB environment executes synchronously in-memory.

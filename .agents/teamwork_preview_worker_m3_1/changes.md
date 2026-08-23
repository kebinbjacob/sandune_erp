# Changes Made - Milestone 3: Parallel UI Component & Backend Service CRUD Test Implementation

## Files Created / Modified

### 1. `src/lib/services/employeeService.ts`
- **Changes**: Added `getEmployeeById(id: string)` and `deleteEmployee(id: string)` functions.
- **Rationale**: Completes the full CRUD service API for employees, enabling authentic read and delete operations against the local database (`testDb`).

### 2. `src/lib/services/userService.ts`
- **Changes**: Added `getUserById(id: string)` and `deleteUser(id: string)` functions.
- **Rationale**: Completes the full CRUD service API for app users, enabling authentic single-user fetch (with joined employee relations) and deletion operations against `testDb`.

### 3. `src/__tests__/ui/login.test.tsx`
- **Changes**: Created UI component unit & interaction test suite for `LoginPage`.
- **Test Coverage**:
  - Rendering of login card, logo, header text, email input, password input, and submit button.
  - User interaction and input field value updates via `userEvent` and `fireEvent`.
  - Form submission invoking `AuthContext` login handler with entered credentials.
  - Error handling and rendering of error message box when authentication fails.
  - Button and input disabled state during active submission loading state.

### 4. `src/__tests__/ui/createEmployeeForm.test.tsx`
- **Changes**: Created UI component unit & interaction test suite for Employee Creation Form (`CreatePage`).
- **Test Coverage**:
  - Rendering of form header, labels, input fields (Full Name, Role, Department, Project, Email, Phone, Status dropdown, Employee ID), and action buttons.
  - State updates on typing in inputs and selecting dropdown options.
  - Form submission calling `createEmployee` service with entered data and navigating to `/employees` via `router.push`.
  - Display of user-friendly error message on unique constraint failure (PGRST / Supabase error code `23505`).
  - Navigation back via `router.back()` when Cancel button is clicked.

### 5. `src/__tests__/integration/authService.test.ts`
- **Changes**: Created backend integration test suite for `authService` against `testDb`.
- **Test Coverage**:
  - Authentic `loginWithEmail` user authentication with valid credentials against stateful local database.
  - Automated update of `last_login` timestamp in `app_users` table upon successful login.
  - Failure cases: non-existent email, incorrect password, suspended account status.
  - `LocalAuth` client operations (`signUp`, `signInWithPassword`, `signOut`, `getUser`).

### 6. `src/__tests__/integration/userServiceCrud.test.ts`
- **Changes**: Created backend integration test suite for `userService` CRUD operations against `testDb`.
- **Test Coverage**:
  - Full CRUD lifecycle (Create user record, Read/Query with `employees` relation join, Update user attributes & status, Delete user record).
  - PostgREST error handling verification: `PGRST116` error code when `.single()` matches 0 or multiple (>1) rows across select, update, and delete operations.

### 7. `src/__tests__/integration/employeeServiceCrud.test.ts`
- **Changes**: Created backend integration test suite for `employeeService` CRUD operations against `testDb`.
- **Test Coverage**:
  - Full CRUD lifecycle (Create employee record, Read/Query all & single employee by ID, Update role/salary/status, Delete employee record).
  - PostgREST error handling verification (`PGRST116` when `.single()` fails to match exactly 1 row).
  - Query filtering and sorting evaluation against stateful `testDb`.

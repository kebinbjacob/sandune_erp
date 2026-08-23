import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, resetTestDb, createTestSupabaseClient } from '@/lib/supabase/testDb';
import { loginWithEmail } from '../authService';
import { getUsers, createUser, updateUser, updateUserStatus } from '../userService';
import { getEmployees, createEmployee, updateEmployee } from '../employeeService';
import { getDailyAttendance, markAttendance, bulkMarkAttendance, getAuditLog } from '../attendanceService';
import { getLeaveRequests, createLeaveRequest, updateLeaveStatus } from '../leaveService';
import { computePayroll, savePayrollRun, getPayrollHistory } from '../payrollService';

describe('Local Database Infrastructure & Integration Testing (Requirement R2)', () => {
  beforeEach(() => {
    resetTestDb();
  });

  describe('Employee Service Integration', () => {
    it('fetches pre-seeded employees from local database', async () => {
      const employees = await getEmployees();
      expect(employees).toHaveLength(4);
      expect(employees[0].name).toBe('John Doe');
      expect(employees[1].name).toBe('Sarah Smith');
    });

    it('creates a new employee and persists record in local database', async () => {
      const newEmpData = {
        employee_id: 'EMP-999',
        name: 'Alex Rivera',
        email: 'alex.rivera@sandune.com',
        phone: '+1-555-0999',
        role: 'Project Engineer',
        department: 'Engineering',
        project: 'Skyline Tower',
        status: 'Active',
        salary: 88000,
      };

      const created = await createEmployee(newEmpData);
      expect(created).toBeDefined();
      expect(created.name).toBe('Alex Rivera');

      // Verify persistence in state
      const employees = await getEmployees();
      expect(employees).toHaveLength(5);
      const persisted = employees.find((e) => e.email === 'alex.rivera@sandune.com');
      expect(persisted).toBeDefined();
      expect(persisted?.role).toBe('Project Engineer');
    });

    it('updates an existing employee in local database', async () => {
      const employees = await getEmployees();
      const empToUpdate = employees[0];

      await updateEmployee(empToUpdate.id!, { department: 'Management', salary: 92000 });

      const updatedList = await getEmployees();
      const updated = updatedList.find((e) => e.id === empToUpdate.id);
      expect(updated?.department).toBe('Management');
      expect(updated?.salary).toBe(92000);
    });
  });

  describe('Auth Service Integration', () => {
    it('logs in successfully with valid credentials from local database', async () => {
      const user = await loginWithEmail('john.doe@sandune.com', 'password123');
      expect(user).toBeDefined();
      expect(user.email).toBe('john.doe@sandune.com');
      expect(user.last_login).toBeDefined();
    });

    it('throws error for non-existent user', async () => {
      await expect(loginWithEmail('nonexistent@sandune.com', 'password123')).rejects.toThrow(
        'User not found. Please check your email.'
      );
    });

    it('throws error for incorrect password', async () => {
      await expect(loginWithEmail('john.doe@sandune.com', 'wrongpass')).rejects.toThrow(
        'Incorrect password.'
      );
    });

    it('throws error for suspended user', async () => {
      const users = await getUsers();
      const targetUser = users[0];
      await updateUserStatus(targetUser.id!, 'Suspended');

      await expect(loginWithEmail(targetUser.email, 'password123')).rejects.toThrow(
        'Your account is currently suspended.'
      );
    });
  });

  describe('User Service Integration', () => {
    it('fetches users with employee relations from local database', async () => {
      const users = await getUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].employees).toBeDefined();
      expect(users[0].employees?.name).toBe('John Doe');
    });

    it('creates a new user and updates status', async () => {
      const newUser = await createUser({
        employee_id: '123e4567-e89b-12d3-a456-426614174003',
        email: 'emily.chen@sandune.com',
        role: 'Architect',
        status: 'Active',
        department: 'Design',
        password: 'securepass123',
      });

      expect(newUser).toBeDefined();
      expect(newUser.email).toBe('emily.chen@sandune.com');

      await updateUserStatus(newUser.id!, 'Inactive');

      const users = await getUsers();
      const updatedUser = users.find((u) => u.email === 'emily.chen@sandune.com');
      expect(updatedUser?.status).toBe('Inactive');
    });
  });

  describe('Attendance Service Integration', () => {
    it('marks attendance and logs audit trail in local database', async () => {
      const date = '2026-08-11';
      const employees = await getEmployees();
      const targetEmp = employees[0];

      await markAttendance(
        targetEmp.id!,
        date,
        'Present',
        'Morning shift',
        'On time',
        undefined
      );

      const dailyAtt = await getDailyAttendance(date);
      const empRecord = dailyAtt.find((r) => r.employee_id === targetEmp.id);
      expect(empRecord?.status).toBe('Present');

      const auditLog = await getAuditLog(targetEmp.id!, date);
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].new_status).toBe('Present');
    });
  });

  describe('Leave Service Integration', () => {
    it('creates and updates leave requests in local database', async () => {
      const employees = await getEmployees();
      const targetEmp = employees[0];

      const leave = await createLeaveRequest({
        employee_id: targetEmp.id!,
        leave_type: 'Annual',
        start_date: '2026-09-01',
        end_date: '2026-09-05',
        reason: 'Vacation',
        status: 'Pending',
      });

      expect(leave.id).toBeDefined();

      await updateLeaveStatus(leave.id!, 'Approved');

      const leaveRequests = await getLeaveRequests();
      const updatedLeave = leaveRequests.find((l) => l.id === leave.id);
      expect(updatedLeave?.status).toBe('Approved');
    });
  });

  describe('LocalQueryBuilder Edge Cases & PGRST116 Error Handling', () => {
    it('returns PGRST116 error when .single() matches 0 rows in select', async () => {
      const { data, error } = await testDb
        .getTable('employees');
      const res = await createTestSupabaseClient().from('employees').select('*').eq('id', 'non-existent-id').single();
      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns PGRST116 error when .single() matches multiple (>1) rows in select', async () => {
      const res = await createTestSupabaseClient().from('employees').select('*').single();
      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns PGRST116 error when .single() matches 0 rows in update', async () => {
      const res = await createTestSupabaseClient()
        .from('employees')
        .update({ name: 'Non Existent' })
        .eq('id', 'non-existent-id')
        .single();
      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns empty array and null error when update targets non-existent ID without .single()', async () => {
      const res = await createTestSupabaseClient()
        .from('employees')
        .update({ name: 'Non Existent' })
        .eq('id', 'non-existent-id');
      expect(res.data).toEqual([]);
      expect(res.error).toBeNull();
    });

    it('returns PGRST116 error when .single() matches 0 rows in delete', async () => {
      const res = await createTestSupabaseClient()
        .from('employees')
        .delete()
        .eq('id', 'non-existent-id')
        .single();
      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns empty array and null error when delete targets non-existent ID without .single()', async () => {
      const res = await createTestSupabaseClient()
        .from('employees')
        .delete()
        .eq('id', 'non-existent-id');
      expect(res.data).toEqual([]);
      expect(res.error).toBeNull();
    });
  });
});

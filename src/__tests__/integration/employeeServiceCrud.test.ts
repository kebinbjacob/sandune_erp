import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, resetTestDb, createTestSupabaseClient } from '@/lib/supabase/testDb';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  getEmployeeById,
  deleteEmployee,
  Employee,
} from '@/lib/services/employeeService';

describe('Employee Service Stateful CRUD Integration Tests', () => {
  beforeEach(() => {
    resetTestDb();
  });

  it('executes full authentic CRUD lifecycle for employee records', async () => {
    // 1. CREATE: Insert new employee into stateful local database
    const newEmpInput: Partial<Employee> = {
      employee_id: 'EMP-010',
      name: 'Robert Vance',
      email: 'robert.vance@sandune.com',
      phone: '+1-555-0110',
      role: 'Project Director',
      department: 'Executive',
      project: 'Metro Station',
      status: 'Active',
      joining_date: '2026-02-01',
      salary: 120000,
    };

    const createdEmp = await createEmployee(newEmpInput);
    expect(createdEmp).toBeDefined();
    expect(createdEmp.id).toBeDefined();
    expect(createdEmp.name).toBe('Robert Vance');
    expect(createdEmp.employee_id).toBe('EMP-010');
    expect(createdEmp.salary).toBe(120000);
    expect(createdEmp.created_at).toBeDefined();

    const createdId = createdEmp.id!;

    // 2. READ: Query all employees and fetch single employee record by ID
    const employeesList = await getEmployees();
    expect(employeesList).toHaveLength(5); // 4 pre-seeded + 1 newly created

    const fetchedEmp = await getEmployeeById(createdId);
    expect(fetchedEmp).not.toBeNull();
    expect(fetchedEmp?.id).toBe(createdId);
    expect(fetchedEmp?.name).toBe('Robert Vance');
    expect(fetchedEmp?.role).toBe('Project Director');

    // 3. UPDATE: Modify employee attributes in local database
    await updateEmployee(createdId, {
      role: 'Senior Executive VP',
      salary: 135000,
      status: 'On Leave',
    });

    const updatedEmp = await getEmployeeById(createdId);
    expect(updatedEmp?.role).toBe('Senior Executive VP');
    expect(updatedEmp?.salary).toBe(135000);
    expect(updatedEmp?.status).toBe('On Leave');
    expect(updatedEmp?.updated_at).toBeDefined();

    // 4. DELETE: Remove employee record from local database
    await deleteEmployee(createdId);

    const postDeleteEmp = await getEmployeeById(createdId);
    expect(postDeleteEmp).toBeNull();

    const finalEmployees = await getEmployees();
    expect(finalEmployees).toHaveLength(4);
  });

  describe('PostgREST Error Handling & Edge Cases (PGRST116)', () => {
    it('returns PGRST116 error when querying non-existent employee with .single()', async () => {
      const client = createTestSupabaseClient();
      const res = await client
        .from('employees')
        .select('*')
        .eq('id', 'non-existent-employee-id')
        .single();

      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns PGRST116 error when .single() select matches multiple rows', async () => {
      const client = createTestSupabaseClient();
      const res = await client.from('employees').select('*').single();

      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns PGRST116 error on update targeting 0 rows with .single()', async () => {
      const client = createTestSupabaseClient();
      const res = await client
        .from('employees')
        .update({ salary: 100000 })
        .eq('id', 'non-existent-id')
        .single();

      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns PGRST116 error on delete targeting 0 rows with .single()', async () => {
      const client = createTestSupabaseClient();
      const res = await client
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

    it('queries employees using filtering and sorting rules', async () => {
      const client = createTestSupabaseClient();
      const { data, error } = await client
        .from('employees')
        .select('*')
        .eq('department', 'Engineering')
        .order('salary', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
      expect(data![0].department).toBe('Engineering');
    });
  });
});

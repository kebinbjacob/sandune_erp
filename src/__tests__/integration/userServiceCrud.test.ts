import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, resetTestDb, createTestSupabaseClient } from '@/lib/supabase/testDb';
import {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getUserById,
  deleteUser,
  AppUser,
} from '@/lib/services/userService';

describe('User Service Stateful CRUD Integration Tests', () => {
  beforeEach(() => {
    resetTestDb();
  });

  it('performs complete CRUD lifecycle for user records', async () => {
    // 1. CREATE: Insert a new user into app_users table
    const newUserInput: Partial<AppUser> = {
      employee_id: '123e4567-e89b-12d3-a456-426614174002', // Mike Johnson
      email: 'mike.johnson@sandune.com',
      role: 'Safety Officer',
      status: 'Active',
      department: 'Safety',
      password: 'password123',
    };

    const createdUser = await createUser(newUserInput);
    expect(createdUser).toBeDefined();
    expect(createdUser.id).toBeDefined();
    expect(createdUser.email).toBe('mike.johnson@sandune.com');
    expect(createdUser.role).toBe('Safety Officer');
    expect(createdUser.status).toBe('Active');

    const createdId = createdUser.id!;

    // 2. READ: Query users list and fetch single user by ID with relation join
    const allUsers = await getUsers();
    expect(allUsers.length).toBe(3); // 2 pre-seeded + 1 newly created

    const fetchedUser = await getUserById(createdId);
    expect(fetchedUser).not.toBeNull();
    expect(fetchedUser?.id).toBe(createdId);
    expect(fetchedUser?.email).toBe('mike.johnson@sandune.com');
    expect(fetchedUser?.employees).toBeDefined();
    expect(fetchedUser?.employees?.name).toBe('Mike Johnson');

    // 3. UPDATE: Update user fields and status
    await updateUser(createdId, { role: 'Senior Safety Lead', department: 'Executive' });
    await updateUserStatus(createdId, 'Inactive');

    const updatedUser = await getUserById(createdId);
    expect(updatedUser?.role).toBe('Senior Safety Lead');
    expect(updatedUser?.department).toBe('Executive');
    expect(updatedUser?.status).toBe('Inactive');

    // 4. DELETE: Purge user record from database
    await deleteUser(createdId);

    const postDeleteUser = await getUserById(createdId);
    expect(postDeleteUser).toBeNull();

    const finalUsers = await getUsers();
    expect(finalUsers.length).toBe(2);
  });

  describe('PostgREST Error Handling & Edge Cases (PGRST116)', () => {
    it('returns PGRST116 error when querying non-existent user with .single()', async () => {
      const client = createTestSupabaseClient();
      const res = await client
        .from('app_users')
        .select('*')
        .eq('id', 'non-existent-user-id')
        .single();

      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns PGRST116 error when .single() query matches multiple rows', async () => {
      const client = createTestSupabaseClient();
      const res = await client.from('app_users').select('*').single();

      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns PGRST116 error on updating non-existent user with .single()', async () => {
      const client = createTestSupabaseClient();
      const res = await client
        .from('app_users')
        .update({ role: 'Admin' })
        .eq('id', 'non-existent-id')
        .single();

      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('returns PGRST116 error on deleting non-existent user with .single()', async () => {
      const client = createTestSupabaseClient();
      const res = await client
        .from('app_users')
        .delete()
        .eq('id', 'non-existent-id')
        .single();

      expect(res.data).toBeNull();
      expect(res.error).toEqual({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      });
    });

    it('handles empty payload gracefully when updating or inserting users', async () => {
      const users = await getUsers();
      const targetUser = users[0];

      // Updating with empty object
      await updateUser(targetUser.id!, {});
      const afterEmptyUpdate = await getUserById(targetUser.id!);
      expect(afterEmptyUpdate?.email).toBe(targetUser.email);
    });
  });
});

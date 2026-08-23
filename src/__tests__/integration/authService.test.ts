import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, resetTestDb, createTestSupabaseClient } from '@/lib/supabase/testDb';
import { loginWithEmail } from '@/lib/services/authService';

describe('Auth Service Integration & Session Handling Tests', () => {
  beforeEach(() => {
    resetTestDb();
  });

  describe('loginWithEmail Service Function', () => {
    it('authenticates user with valid email and password and returns user record', async () => {
      const user = await loginWithEmail('john.doe@sandune.com', 'password123');

      expect(user).toBeDefined();
      expect(user.email).toBe('john.doe@sandune.com');
      expect(user.role).toBe('Site Engineer');
      expect(user.status).toBe('Active');
      expect(user.employees).toBeDefined();
      expect(user.employees?.name).toBe('John Doe');
    });

    it('updates last_login timestamp in local database on successful login', async () => {
      const beforeLoginTime = new Date().toISOString();
      const user = await loginWithEmail('john.doe@sandune.com', 'password123');

      expect(user.last_login).toBeDefined();
      expect(new Date(user.last_login!).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeLoginTime).getTime() - 1000
      );

      // Verify state persistence in testDb
      const appUsers = testDb.getTable('app_users');
      const persistedUser = appUsers.find((u) => u.email === 'john.doe@sandune.com');
      expect(persistedUser?.last_login).toBe(user.last_login);
    });

    it('throws error when user email is not found in database', async () => {
      await expect(loginWithEmail('unknown.user@sandune.com', 'password123')).rejects.toThrow(
        'User not found. Please check your email.'
      );
    });

    it('throws error when password does not match', async () => {
      await expect(loginWithEmail('john.doe@sandune.com', 'wrong-password')).rejects.toThrow(
        'Incorrect password.'
      );
    });

    it('throws error when account status is suspended', async () => {
      const appUsers = testDb.getTable('app_users');
      const johnUser = appUsers.find((u) => u.email === 'john.doe@sandune.com');
      if (johnUser) {
        johnUser.status = 'Suspended';
      }

      await expect(loginWithEmail('john.doe@sandune.com', 'password123')).rejects.toThrow(
        'Your account is currently suspended. Please contact your administrator.'
      );
    });
  });

  describe('LocalAuth Session & Authentication Client', () => {
    it('handles signUp for a new auth user in stateful test database', async () => {
      const client = createTestSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: 'newuser@sandune.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('newuser@sandune.com');

      // Verify auth_users table in testDb has been updated
      const authUsers = testDb.getTable('auth_users');
      expect(authUsers.some((u) => u.email === 'newuser@sandune.com')).toBe(true);
    });

    it('returns error when signUp email already exists in auth database', async () => {
      const client = createTestSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: 'john.doe@sandune.com',
        password: 'password123',
      });

      expect(data).toBeNull();
      expect(error).toEqual({
        message: 'User already registered',
        status: 400,
      });
    });

    it('handles signInWithPassword with valid credentials', async () => {
      const client = createTestSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: 'john.doe@sandune.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data.user.email).toBe('john.doe@sandune.com');
      expect(data.session.access_token).toBe('local-jwt-token');
    });

    it('returns error for invalid signInWithPassword credentials', async () => {
      const client = createTestSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: 'john.doe@sandune.com',
        password: 'wrongpassword',
      });

      expect(data).toBeNull();
      expect(error).toEqual({
        message: 'Invalid login credentials',
        status: 400,
      });
    });

    it('executes signOut successfully', async () => {
      const client = createTestSupabaseClient();
      const { error } = await client.auth.signOut();
      expect(error).toBeNull();
    });

    it('retrieves active auth user via getUser', async () => {
      const client = createTestSupabaseClient();
      const { data, error } = await client.auth.getUser();
      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('john.doe@sandune.com');
    });
  });
});

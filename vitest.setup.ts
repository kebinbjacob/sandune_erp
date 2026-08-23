import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { createTestSupabaseClient, testDb } from '@/lib/supabase/testDb';

// Configure global jest alias for Vitest test execution compatibility
(globalThis as any).jest = vi;

// Set process.env defaults for test execution
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekgerzqnndvlvncpeyub.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key';
process.env.NODE_ENV = 'test';

// Reset local integration database before each test
beforeEach(() => {
  testDb.reset();
});

// Configure global mock/spy for @/lib/supabase/client to use local database infrastructure
vi.mock('@/lib/supabase/client', () => {
  const testClient = createTestSupabaseClient(testDb);

  const fromSpy = vi.fn((table: string) => testClient.from(table));

  return {
    supabase: {
      from: fromSpy,
      auth: testClient.auth,
      db: testDb,
    },
  };
});

import { LocalDatabase, LocalQueryBuilder, LocalAuth } from '@/lib/db/localDb';

// Singleton instance of LocalDatabase for integration test execution
export const testDb = new LocalDatabase();

export function createTestSupabaseClient(db: LocalDatabase = testDb) {
  const authInstance = new LocalAuth(db);

  return {
    from: (tableName: string) => new LocalQueryBuilder(db, tableName),
    auth: authInstance,
    db,
  };
}

export function resetTestDb(): void {
  testDb.reset();
}

export function seedTestDb(table: string, rows: any[]): void {
  testDb.setTable(table, rows);
}

export function getTestDbRows(table: string): any[] {
  return testDb.getTable(table);
}

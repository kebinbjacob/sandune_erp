export interface DatabaseRow {
  id?: string;
  [key: string]: any;
}

export type QueryMode = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

export interface FilterRule {
  type: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is' | 'like' | 'ilike';
  column: string;
  value: any;
}

export interface OrderRule {
  column: string;
  ascending: boolean;
}

export class LocalDatabase {
  private tables: Map<string, DatabaseRow[]> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.tables.clear();
    this.seedDefaults();
  }

  public seedDefaults(): void {
    this.tables.set('employees', []);
    this.tables.set('app_users', []);
    this.tables.set('users', []);
    this.tables.set('auth_users', []);
    this.tables.set('attendance', []);
    this.tables.set('attendance_audit_log', []);
    this.tables.set('leave_requests', []);
    this.tables.set('payroll_runs', []);
  }

  public getTable(tableName: string): DatabaseRow[] {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    return this.tables.get(tableName)!;
  }

  public setTable(tableName: string, rows: DatabaseRow[]): void {
    this.tables.set(tableName, [...rows]);
  }

  public clearTable(tableName: string): void {
    this.tables.set(tableName, []);
  }
}

export class LocalQueryBuilder {
  private db: LocalDatabase;
  private tableName: string;
  private mode: QueryMode = 'select';
  private selectColumnsStr = '*';
  private payload: any = null;
  private filterRules: FilterRule[] = [];
  private orderRules: OrderRule[] = [];
  private limitCount: number | null = null;
  private isSingle = false;
  private upsertOptions: { onConflict?: string } = {};

  constructor(db: LocalDatabase, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  public select(columns = '*'): this {
    this.selectColumnsStr = columns;
    return this;
  }

  public insert(values: any): this {
    this.mode = 'insert';
    this.payload = values;
    return this;
  }

  public update(values: any): this {
    this.mode = 'update';
    this.payload = values;
    return this;
  }

  public upsert(values: any, options?: { onConflict?: string }): this {
    this.mode = 'upsert';
    this.payload = values;
    if (options) {
      this.upsertOptions = options;
    }
    return this;
  }

  public delete(): this {
    this.mode = 'delete';
    return this;
  }

  public eq(column: string, value: any): this {
    this.filterRules.push({ type: 'eq', column, value });
    return this;
  }

  public neq(column: string, value: any): this {
    this.filterRules.push({ type: 'neq', column, value });
    return this;
  }

  public gt(column: string, value: any): this {
    this.filterRules.push({ type: 'gt', column, value });
    return this;
  }

  public gte(column: string, value: any): this {
    this.filterRules.push({ type: 'gte', column, value });
    return this;
  }

  public lt(column: string, value: any): this {
    this.filterRules.push({ type: 'lt', column, value });
    return this;
  }

  public lte(column: string, value: any): this {
    this.filterRules.push({ type: 'lte', column, value });
    return this;
  }

  public in(column: string, values: any[]): this {
    this.filterRules.push({ type: 'in', column, value: values });
    return this;
  }

  public is(column: string, value: any): this {
    this.filterRules.push({ type: 'is', column, value });
    return this;
  }

  public like(column: string, pattern: string): this {
    this.filterRules.push({ type: 'like', column, value: pattern });
    return this;
  }

  public ilike(column: string, pattern: string): this {
    this.filterRules.push({ type: 'ilike', column, value: pattern });
    return this;
  }

  public order(column: string, options?: { ascending?: boolean }): this {
    const ascending = options?.ascending !== false;
    this.orderRules.push({ column, ascending });
    return this;
  }

  public limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  public single(): this {
    this.isSingle = true;
    return this;
  }

  private matchesFilters(row: DatabaseRow): boolean {
    for (const rule of this.filterRules) {
      const val = row[rule.column];
      switch (rule.type) {
        case 'eq':
          if (val !== rule.value) return false;
          break;
        case 'neq':
          if (val === rule.value) return false;
          break;
        case 'gt':
          if (!(val > rule.value)) return false;
          break;
        case 'gte':
          if (!(val >= rule.value)) return false;
          break;
        case 'lt':
          if (!(val < rule.value)) return false;
          break;
        case 'lte':
          if (!(val <= rule.value)) return false;
          break;
        case 'in':
          if (!Array.isArray(rule.value) || !rule.value.includes(val)) return false;
          break;
        case 'is':
          if (val !== rule.value) return false;
          break;
        case 'like':
          if (typeof val !== 'string') return false;
          const regLike = new RegExp('^' + rule.value.replace(/%/g, '.*') + '$');
          if (!regLike.test(val)) return false;
          break;
        case 'ilike':
          if (typeof val !== 'string') return false;
          const regIlike = new RegExp('^' + rule.value.replace(/%/g, '.*') + '$', 'i');
          if (!regIlike.test(val)) return false;
          break;
      }
    }
    return true;
  }

  private attachRelations(row: DatabaseRow): DatabaseRow {
    const cloned = { ...row };

    // Check if employees relation is requested in select columns
    if (this.selectColumnsStr.includes('employees')) {
      const employeesTable = this.db.getTable('employees');
      const empId = cloned.employee_id;
      const matchedEmp = employeesTable.find(
        (e) => e.id === empId || e.employee_id === empId
      );

      if (matchedEmp) {
        // Parse requested fields if specified e.g. employees(name, role, department)
        const matchSpec = this.selectColumnsStr.match(/employees(?::\w+!(?:\w+))?\(([^)]+)\)/);
        if (matchSpec && matchSpec[1] && matchSpec[1] !== '*') {
          const requestedFields = matchSpec[1].split(',').map((f) => f.trim());
          const empSubset: Record<string, any> = {};
          for (const f of requestedFields) {
            empSubset[f] = matchedEmp[f];
          }
          cloned.employees = empSubset;
        } else {
          cloned.employees = { ...matchedEmp };
        }
      } else {
        cloned.employees = null;
      }
    }

    // Filter root columns if explicit fields requested e.g. select('id, name, role')
    if (
      this.selectColumnsStr !== '*' &&
      !this.selectColumnsStr.startsWith('*,') &&
      !this.selectColumnsStr.includes('*')
    ) {
      const rawCols = this.selectColumnsStr
        .split(',')
        .map((c) => c.trim())
        .filter((c) => !c.includes('(') && !c.includes(')'));
      const projected: DatabaseRow = {};
      for (const col of rawCols) {
        if (col in cloned) {
          projected[col] = cloned[col];
        }
      }
      if ('employees' in cloned) {
        projected.employees = cloned.employees;
      }
      return projected;
    }

    return cloned;
  }

  public async execute(): Promise<{ data: any; error: any }> {
    const tableData = this.db.getTable(this.tableName);

    if (this.mode === 'insert') {
      const itemsToInsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: DatabaseRow[] = [];

      for (const item of itemsToInsert) {
        const newRow: DatabaseRow = {
          id: item.id || `local-id-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          created_at: item.created_at || new Date().toISOString(),
          ...item,
        };
        tableData.push(newRow);
        inserted.push(newRow);
      }

      const processed = inserted.map((row) => this.attachRelations(row));
      if (this.isSingle) {
        if (processed.length === 0 || processed.length > 1) {
          return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
        }
        return { data: processed[0], error: null };
      }
      return { data: processed, error: null };
    }

    if (this.mode === 'update') {
      const updated: DatabaseRow[] = [];
      for (let i = 0; i < tableData.length; i++) {
        if (this.matchesFilters(tableData[i])) {
          tableData[i] = {
            ...tableData[i],
            ...this.payload,
            updated_at: new Date().toISOString(),
          };
          updated.push(tableData[i]);
        }
      }

      const processed = updated.map((row) => this.attachRelations(row));
      if (this.isSingle) {
        if (processed.length === 0 || processed.length > 1) {
          return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
        }
        return { data: processed[0], error: null };
      }
      return { data: processed, error: null };
    }

    if (this.mode === 'upsert') {
      const itemsToUpsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const conflictKeys = this.upsertOptions.onConflict
        ? this.upsertOptions.onConflict.split(',').map((k) => k.trim())
        : ['id'];

      const result: DatabaseRow[] = [];

      for (const item of itemsToUpsert) {
        const existingIndex = tableData.findIndex((row) =>
          conflictKeys.every((key) => row[key] === item[key])
        );

        if (existingIndex >= 0) {
          tableData[existingIndex] = {
            ...tableData[existingIndex],
            ...item,
            updated_at: new Date().toISOString(),
          };
          result.push(tableData[existingIndex]);
        } else {
          const newRow: DatabaseRow = {
            id: item.id || `local-id-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            created_at: item.created_at || new Date().toISOString(),
            ...item,
          };
          tableData.push(newRow);
          result.push(newRow);
        }
      }

      const processed = result.map((row) => this.attachRelations(row));
      if (this.isSingle) {
        if (processed.length === 0 || processed.length > 1) {
          return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
        }
        return { data: processed[0], error: null };
      }
      return { data: processed, error: null };
    }

    if (this.mode === 'delete') {
      const deleted: DatabaseRow[] = [];
      const remaining: DatabaseRow[] = [];

      for (const row of tableData) {
        if (this.matchesFilters(row)) {
          deleted.push(row);
        } else {
          remaining.push(row);
        }
      }

      this.db.setTable(this.tableName, remaining);
      const processed = deleted.map((row) => this.attachRelations(row));
      if (this.isSingle) {
        if (processed.length === 0 || processed.length > 1) {
          return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
        }
        return { data: processed[0], error: null };
      }
      return { data: processed, error: null };
    }

    // SELECT mode
    let filtered = tableData.filter((row) => this.matchesFilters(row));

    // Apply ordering
    if (this.orderRules.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const rule of this.orderRules) {
          const valA = a[rule.column];
          const valB = b[rule.column];
          if (valA < valB) return rule.ascending ? -1 : 1;
          if (valA > valB) return rule.ascending ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      filtered = filtered.slice(0, this.limitCount);
    }

    const processed = filtered.map((row) => this.attachRelations(row));

    if (this.isSingle) {
      if (processed.length === 0 || processed.length > 1) {
        return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
      }
      return { data: processed[0], error: null };
    }

    return { data: processed, error: null };
  }

  public then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any): Promise<any> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export class LocalAuth {
  private db: LocalDatabase;

  constructor(db: LocalDatabase) {
    this.db = db;
  }

  public async signUp(credentials: { email: string; password?: string }): Promise<{ data: any; error: any }> {
    const authUsers = this.db.getTable('auth_users');
    const existing = authUsers.find((u) => u.email === credentials.email);

    if (existing) {
      return {
        data: null,
        error: { message: 'User already registered', status: 400 },
      };
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      email: credentials.email,
      password: credentials.password || '',
      created_at: new Date().toISOString(),
    };

    authUsers.push(newUser);
    return { data: { user: newUser, session: null }, error: null };
  }

  public async signInWithPassword(credentials: { email: string; password?: string }): Promise<{ data: any; error: any }> {
    const authUsers = this.db.getTable('auth_users');
    const user = authUsers.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      return {
        data: null,
        error: { message: 'Invalid login credentials', status: 400 },
      };
    }

    return { data: { user, session: { access_token: 'local-jwt-token' } }, error: null };
  }

  public async signOut(): Promise<{ error: any }> {
    return { error: null };
  }

  public async getUser(): Promise<{ data: any; error: any }> {
    const authUsers = this.db.getTable('auth_users');
    return { data: { user: authUsers[0] || null }, error: null };
  }
}

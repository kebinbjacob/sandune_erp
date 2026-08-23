# Codebase Build and Test Configuration Analysis

## Executive Summary
This document presents the detailed architectural investigation of the build and test configurations for **Sandune Core HR & Supabase Integration** (`sandune-crm`). The primary objective is to evaluate the existing Jest testing infrastructure and define a complete migration / parallel configuration strategy for **Vitest** + **React Testing Library** in a Next.js 16 (App Router) + React 19 environment.

---

## 1. Codebase & Build Configuration Inspection

### 1.1 `package.json` Audit
- **Project Name**: `sandune-crm` (v0.1.0)
- **Core Frameworks**:
  - `next`: `16.2.10` (App Router architecture)
  - `react`: `19.2.4`
  - `react-dom`: `19.2.4`
  - `@supabase/supabase-js`: `^2.112.2`
  - `recharts`: `^3.10.1`
- **Existing Test Dependencies**:
  - `@testing-library/react`: `^16.3.2` (React 19 compatible)
  - `@testing-library/jest-dom`: `^7.0.0`
  - `@testing-library/dom`: `^10.4.1`
  - `jest`: `^29.7.0`
  - `jest-environment-jsdom`: `^29.7.0`
  - `ts-node`: `^10.9.2`
- **Current Scripts**:
  - `"dev"`: `"next dev"`
  - `"build"`: `"next build"`
  - `"start"`: `"next start"`
  - `"lint"`: `"eslint"`
  - `"test"`: `"jest"`

### 1.2 `tsconfig.json` Audit
- **Target & Module**:
  - `"target": "ES2017"`
  - `"module": "esnext"`
  - `"moduleResolution": "bundler"`
  - `"jsx": "react-jsx"`
- **Path Mapping**:
  - `"baseUrl": "."`
  - `"paths": { "@/*": ["./src/*"] }`
- **Includes**: `["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"]`

### 1.3 `next.config.ts` Audit
- Minimal Next.js configuration importing `NextConfig` type from `"next"`. Standard App Router default setup.

### 1.4 Existing Test Infrastructure (`jest.config.js` & `jest.setup.js`)
- **`jest.config.js`**:
  - Uses `next/jest` transformer (`const nextJest = require('next/jest')`).
  - `setupFilesAfterEnv: ['<rootDir>/jest.setup.js']`
  - `testEnvironment: 'jest-environment-jsdom'`
  - `moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }`
- **`jest.setup.js`**:
  - Imports `@testing-library/jest-dom`
  - Defines `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` fallbacks.
  - Global `jest.mock('@/lib/supabase/client', ...)` mocking `supabase.from().select().insert().update().delete().order().limit().single()`.

---

## 2. Path Aliases Mapping & Resolution

### Current Mapping
- In `tsconfig.json`: `@/*` maps to `./src/*`.
- Examples across codebase:
  - `@/lib/supabase/client` -> `./src/lib/supabase/client.ts`
  - `@/lib/services/employeeService` -> `./src/lib/services/employeeService.ts`
  - `@/components/Card` -> `./src/components/Card.tsx`

### Vitest Resolution Mechanism
Vitest can resolve TypeScript path aliases using two complementary strategies:
1. **`vite-tsconfig-paths` Plugin**: Reads `tsconfig.json` directly and maps `@/*` to `./src/*` dynamically.
2. **Explicit `resolve.alias` in `vitest.config.ts`**:
   ```ts
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   }
   ```
   Combining both ensures rock-solid path alias resolution across unit tests, component tests, and service mocks.

---

## 3. Required Dependencies Breakdown for Vitest + React Testing Library

### 3.1 Installed vs Required Packages

| Package | Status in `package.json` | Purpose | Recommended Version |
|---|---|---|---|
| `@testing-library/react` | **Already Installed** (`^16.3.2`) | Component rendering & queries for React 19 | `^16.3.2` |
| `@testing-library/jest-dom` | **Already Installed** (`^7.0.0`) | DOM matchers (`toBeInTheDocument`, etc.) | `^7.0.0` |
| `@testing-library/dom` | **Already Installed** (`^10.4.1`) | Core DOM querying engine | `^10.4.1` |
| `vitest` | **Missing** | Fast Vite-native test runner | `^3.0.0` |
| `jsdom` (or `happy-dom`) | **Missing** | Simulated browser DOM environment for Vitest | `^26.0.0` (jsdom) or `^16.0.0` (happy-dom) |
| `@vitejs/plugin-react` | **Missing** | Vite plugin for React JSX/TSX transformations | `^4.3.0` |
| `vite-tsconfig-paths` | **Missing** | Auto-resolves `tsconfig.json` paths in Vitest | `^5.1.0` |
| `@vitest/coverage-v8` | **Missing (Optional)** | V8 code coverage provider | `^3.0.0` |

### 3.2 Installation Command
```bash
npm install --save-dev vitest jsdom @vitejs/plugin-react vite-tsconfig-paths @vitest/coverage-v8
```

---

## 4. Vitest Configuration Strategy (`vitest.config.ts`)

### 4.1 Configuration Architectural Requirements
1. **Next.js & React 19 Compatibility**: Process JSX via `@vitejs/plugin-react`.
2. **Parallel Execution**: Vitest uses worker threads/forks for file-level parallelism.
3. **Globals Support**: `globals: true` allows `describe`, `it`, `expect`, and `beforeEach`/`afterEach` without manual imports.
4. **Jest Mock Compatibility**: Provide a setup shim `vitest.setup.ts` to bridge `jest.mock` / `jest.fn()` calls in legacy tests to `vi.mock` / `vi.fn()`.

### 4.2 Proposed `vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    pool: 'threads',
    poolOptions: {
      threads: {
        isolate: true,
      },
    },
    resolveSnapshotPath: (testPath, snapExtension) =>
      testPath.replace(/\.test\.([tj]sx?)/, `${snapExtension}.$1`),
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 4.3 Supporting `vitest.setup.ts`
```ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Environment variables fallback
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekgerzqnndvlvncpeyub.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key';

// Global Jest compatibility shim for existing tests
if (typeof globalThis.jest === 'undefined') {
  (globalThis as any).jest = vi;
}

// Global Supabase client mock
vi.mock('@/lib/supabase/client', () => {
  const mockEmployee = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    employee_id: 'EMP-001',
    name: 'John Doe',
    email: 'john.doe@sandune.com',
    phone: '+1-555-0101',
    role: 'Site Engineer',
    department: 'Engineering',
    project: 'Skyline Tower',
    status: 'Active',
    joining_date: '2026-01-01',
    salary: 85000,
  };

  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockEmployee, error: null }),
    then: function (resolve: any) {
      return Promise.resolve({ data: [mockEmployee], error: null }).then(resolve);
    },
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(queryBuilder),
    },
  };
});
```

---

## 5. Parallel Execution & Performance Benchmarks

### Vitest Parallelism Capabilities
1. **Worker Pool Options**:
   - `pool: 'threads'`: Uses Node.js `worker_threads` for low overhead and fast execution across CPU cores.
   - `pool: 'forks'`: Uses `child_process.fork`, recommended if test files mutate process-level state.
2. **Isolation**: `isolate: true` ensures clean global state per test file, preventing cross-test pollution during concurrent execution.
3. **Execution Speed Comparison**: Vitest executes test suites in parallel without the high overhead of full Next.js/Webpack transformations required by `next/jest`.

---

## 6. Migration Matrix & Package Script Updates

### Recommended `package.json` scripts:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:jest": "jest"
}
```

This completes the comprehensive exploration of build and test configurations.

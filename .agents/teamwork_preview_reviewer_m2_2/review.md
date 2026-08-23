# Code & Architecture Review Report — Milestone 2 Vitest & Build Configuration

**Reviewer Agent**: `reviewer_m2_2`  
**Date**: 2026-08-11  
**Target Scope**: Vitest configuration (`vitest.config.ts`), Vitest setup (`vitest.setup.ts`), package scripts & dependencies (`package.json`)  
**Verdict**: **REQUEST_CHANGES**

---

## Review Summary

The Vitest configuration (`vitest.config.ts`), setup script (`vitest.setup.ts`), and npm script definitions in `package.json` meet all structural criteria specified in Milestone 2. Specifically:
1. `vitest.config.ts` incorporates `@vitejs/plugin-react`, `vite-tsconfig-paths`, `environment: 'jsdom'`, `globals: true`, and `pool: 'threads'`.
2. `package.json` defines `"test": "vitest run"` and `"test:vitest": "vitest run"`.
3. No integrity violations (hardcoded test results, facade implementations, or bypasses) were detected.

However, executing `npm test` fails immediately at startup due to a **package version mismatch** in `package.json`: `"@vitejs/plugin-react": "^6.0.5"` is incompatible with the installed `vite@7.3.6` / `vitest@3.2.7`, throwing an ESM loader error (`ERR_PACKAGE_PATH_NOT_EXPORTED`).

---

## Findings

### [Major] Finding 1: `@vitejs/plugin-react@6.0.5` is incompatible with `vite@7.3.6`, causing `npm test` startup crash

- **What**: Executing `npm test` or `npx vitest run` results in a startup error:
  ```
  Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './internal' is not defined by "exports" in node_modules/vite/package.json imported from node_modules/@vitejs/plugin-react/dist/index.js
  ```
- **Where**: `package.json` line 27 (`"@vitejs/plugin-react": "^6.0.5"`) and `node_modules/@vitejs/plugin-react/dist/index.js`.
- **Why**: `@vitejs/plugin-react` version `6.x` relies on internal APIs from Vite `8.x`. The installed version of Vite in `node_modules` is `7.3.6` (which explicitly exports `./types/internal/*: null` and does not export `./internal`).
- **Suggestion**: Downgrade `@vitejs/plugin-react` in `package.json` to `@vitejs/plugin-react": "^4.3.4"` or `@vitejs/plugin-react": "^5.0.0"`, then run `npm install` so that Vitest can load the configuration and execute tests successfully.

---

## Verified Claims & Checklist

| Requirement / Item | Verification Method | Status | Details |
|---|---|---|---|
| **React 19 JSX Plugin (`@vitejs/plugin-react`)** | Inspected `vitest.config.ts` line 2 & 6 | **PASS (Config)** | `react()` plugin imported and listed in `plugins` array. |
| **Path Alias Plugin (`vite-tsconfig-paths`)** | Inspected `vitest.config.ts` line 3 & 6 | **PASS (Config)** | `tsconfigPaths()` imported and listed in `plugins` array. |
| **Environment 'jsdom'** | Inspected `vitest.config.ts` line 8 | **PASS** | `environment: 'jsdom'` explicitly configured. |
| **Globals true** | Inspected `vitest.config.ts` line 9 | **PASS** | `globals: true` explicitly configured. |
| **Parallel worker pool ('threads')** | Inspected `vitest.config.ts` line 11 | **PASS** | `pool: 'threads'` explicitly configured. |
| **Script `"test": "vitest run"`** | Inspected `package.json` line 10 | **PASS** | Defined in `scripts`. |
| **Script `"test:vitest": "vitest run"`** | Inspected `package.json` line 11 | **PASS** | Defined in `scripts`. |
| **Test Execution Status** | Ran `npm test` | **FAIL** | Vitest crashes at startup due to `@vitejs/plugin-react@6.0.5` dependency conflict with `vite@7.3.6`. |
| **Integrity Audit** | Inspected `vitest.setup.ts` & test files | **PASS** | Real stateful DB reset and client mock delegate in place; no hardcoded test assertions. |

---

## Adversarial Stress-Testing (Critic Report)

### 1. Dependency Resolution & Version Pinning
- **Hypothesis**: Installing major version floating dependencies (`^6.0.5`) in devDependencies leads to breaking peer dependency conflicts when `vite` is managed transitively by `vitest@^3.2.7`.
- **Result**: CONFIRMED. NPM resolved `@vitejs/plugin-react` to `6.0.5` which expects `vite@^8.0.0`, breaking execution against `vite@7.3.6`.

### 2. Global Jest Compatibility Alias (`vitest.setup.ts`)
- **Hypothesis**: Standard Jest tests relying on `jest.fn()` or `jest.spyOn()` will throw `ReferenceError: jest is not defined` under Vitest unless globally aliased.
- **Result**: PASS. `vitest.setup.ts` correctly assigns `(globalThis as any).jest = vi;`, ensuring smooth migration from Jest to Vitest.

---

## Conclusion & Actionable Recommendation

Change request required:
Update `package.json` devDependencies to pin `@vitejs/plugin-react` to a version compatible with Vite 7 / Vitest 3 (e.g. `^4.3.4` or `^5.0.0`), re-run `npm install`, and verify that `npm test` executes cleanly.

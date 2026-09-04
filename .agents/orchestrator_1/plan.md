# Plan: Complete and Fix All 30 Pending Items (R1-R22)

## Overview
SanDune ERP & CRM system is a Next.js 15 App Router + Supabase (Postgres, Auth, Storage) application.
All 22 requirements must be fulfilled with clean TypeScript, live Supabase queries, proper security, full CRUD delete operations, and zero stub pages.

## Requirement Priority Categorization

### Priority 1: Critical (Security, Broken Routes, Data Integrity)
- **R1**: Security Fix — Remove Plaintext Password Storage in `/profile` & add current password check with `signInWithPassword()`.
- **R7**: Fix `/projects/new` Broken Route (redirect or standalone form).
- **R6**: Leave Balances — Auto-decrement on Approval (`leave/page.tsx`).
- **R5**: `marked_by` / `generated_by` — Replace hardcoded `'Admin'` with logged-in user context across `/attendance`, `/payroll`, `/safety`.

### Priority 2: High (Live Data, Persistence & Essential Operations)
- **R2**: Dashboard Live Data Aggregates (`dashboardService.ts` & `src/app/page.tsx`).
- **R3**: Settings Page — Persist Company Info (`phase7_settings.sql` & `src/app/settings/page.tsx`).
- **R4**: Delete Operation across all CRUD list pages (14 modules).
- **R8**: Task Editing Modal (`/tasks` & `/tasks/board`).
- **R12**: Project → Client Linkage (dynamic dropdown from `getClients()`).

### Priority 3: Medium (Stubs, Sub-pages & Workflow Enhancements)
- **R9**: `/shifts/schedules` — Implement Weekly Calendar Schedule View.
- **R10**: Attendance Sub-pages Stubs (`/attendance/timesheets`, `/attendance/corrections`, `/attendance/reports`).
- **R11**: Payroll History Tab on `/payroll` using `getAllPayrollRuns()`.
- **R14**: Expense Receipt Upload (`/expenses` + Supabase Storage `receipts` bucket).
- **R15**: Purchase Order Line Items in `/procurement` (`line_items` JSONB).
- **R17**: Leave Balance Validation warning on `/leave/apply`.
- **R18**: Attendance Auto-close Day / Auto-Mark Absent button on `/attendance`.
- **R19**: Equipment Maintenance Log / Notes on `/equipment`.
- **R20**: Safety Severity Summary Cards on `/safety`.
- **R22**: Project Completion Auto-Compute on `/projects/[id]`.

### Priority 4: Nice-to-have / Polish
- **R13**: Search & Filter on List Pages (`/tasks`, `/clients`, `/contractors`, `/vendors`, `/materials`, `/procurement`).
- **R16**: CSV Export on Key Pages (`/attendance`, `/payroll`, `/reports/site`, `/leave`).
- **R21**: Payroll Optional Deductions (PF %, ESI %, Tax).

## Milestone Architecture
- **Survey Phase**: 3 parallel Explorers to analyze all target files, existing services, schemas, and UI components.
- **Milestone 1: Critical Core & Dashboard** (R1, R2, R3, R7)
- **Milestone 2: Universal Delete & User Context** (R4, R5)
- **Milestone 3: Core Operations & Workflows** (R6, R8, R12, R14, R15, R17, R18, R19, R20, R22)
- **Milestone 4: Calendar, Attendance Stubs, Payroll & Polish** (R9, R10, R11, R13, R16, R21)
- **Final Milestone: Full Verification & Forensic Audit** (`npx tsc --noEmit` + Acceptance Criteria verification + Forensic Audit).

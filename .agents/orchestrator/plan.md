# Execution Plan — Sandune Core HR & Supabase Integration

## Overview
This plan governs the end-to-end implementation of Supabase Database Schema & RBAC for Core HR (Employees, Attendance, Leave), Next.js frontend integration, Vanilla CSS design system preservation, and test verification for the Sandune project.

## Milestones

### Milestone 1: Exploration & Codebase Analysis
- Explore existing codebase structure (Next.js app, package.json, dependencies, mock data, components, styles, tests).
- Audit current `/employees` page implementation and form components.
- Check Supabase connectivity using environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Milestone 2: Supabase Schema & RBAC Implementation
- Create robust SQL schema for Core HR:
  - `employees` table (id, first_name, last_name, email, phone, role, department, status, joining_date, etc.)
  - `attendance` table (id, employee_id, date, status, check_in, check_out, etc.)
  - `leave_requests` table (id, employee_id, leave_type, start_date, end_date, status, reason, etc.)
- Enable Row Level Security (RLS) and define policies for public/authenticated/role-based access.
- Generate migration/seed SQL script (`supabase/schema.sql` or `supabase/migrations/`) and apply to Supabase instance.

### Milestone 3: Frontend Integration & Supabase Services
- Add `@supabase/supabase-js` or existing Supabase client helper if needed.
- Connect Next.js application to Supabase via `@supabase/supabase-js` using standard env vars.
- Implement data access services for fetching employees, creating employee records, updating employee data, and managing attendance/leave.
- Wire `/employees` page to fetch and render live data from Supabase.
- Wire "Add Employee" form to validate and insert records into Supabase `employees` table.

### Milestone 4: Verification, Test Suite & UI/UX Audit
- Verify glassmorphic Vanilla CSS styling remains intact.
- Run Jest test suite (`npm test`) and update tests/components as needed to pass cleanly.
- Perform adversarial verification and forensic integrity audit.

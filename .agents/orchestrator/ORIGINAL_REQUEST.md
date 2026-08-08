# Original User Request

## 2026-08-08T14:29:56Z

Sandune is a scalable, production-ready construction ERP/CRM SaaS platform that connects workforce, projects, clients, resources, procurement, finance, safety, and analytics into one centralized, role-based system.

Working directory: c:/Users/kelvin babu/Downloads/sandune-main/sandune-main
Integrity mode: benchmark
User's Supabase Project URL: https://ekgerzqnndvlvncpeyub.supabase.co
(Note: Please ask the user for their Anon Key if it is not already present in the .env.local file).

## Requirements

### R1. Database Schema & RBAC
Design and implement the Supabase database schema for the Core HR module (Employees, Attendance, Leave). Implement Row Level Security (RLS) policies to enforce role-based access.

### R2. End-to-End Integration
Update the Next.js frontend to interact with the Supabase backend. Replace mock data with live fetching, creation, and updating of Core HR data.

### R3. UI/UX Consistency
Ensure all new functional forms and tables perfectly maintain the existing glassmorphic Vanilla CSS design system.

## Acceptance Criteria

### Supabase Integration
- [ ] Database schema SQL is provided and successfully applied to the Supabase project.
- [ ] Next.js app connects to Supabase using standard environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Core HR Functionality
- [ ] Navigating to `/employees` successfully fetches and displays employee data from Supabase.
- [ ] Submitting the "Add Employee" form successfully inserts a new record into Supabase.

### System Integrity
- [ ] The existing Jest test suite continues to pass (`npm test` runs successfully).
- [ ] The UI maintains the existing CSS module structure without breaking the layout.

## 2026-08-08T14:34:32Z

The user has provided their Supabase URL and Anon Key. I have automatically populated them into the `.env.local` file for you in the working directory. You can proceed with the Supabase integration.

# SanDune ERP & CRM System

A full-stack, enterprise-grade Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) platform built for single-company engineering, construction, and operations management.

---

## 🏛️ Architecture & Tech Stack

- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript, CSS Modules (Glassmorphic Dark Theme)
- **Backend & Database:** Supabase (PostgreSQL), Postgres Row Level Security (RLS), Triggers & Stored Procedures
- **Authentication & Authorization:** Supabase Auth + Custom Dynamic RBAC (`roles`, `permissions`, `role_permissions`, `app_users`)
- **Storage:** Supabase Storage (`avatars` bucket for profile media)
- **State Management & Routing:** React Context (`AuthContext`), Next.js Navigation

---

## 🧭 Menu & Functionality Hierarchy

Below is the complete hierarchical breakdown of all modules, navigation menus, submenus, and their operational status as built.

```
SanDune ERP
├── 📊 Overview
│   └── 📈 Dashboard (/)
├── 👥 Core HR
│   ├── 👥 Employees
│   │   ├── 📋 Directory (/employees)
│   │   ├── ➕ Add Employee (/employees/new)
│   │   └── 👤 Employee Details (/employees/[id])
│   ├── ⏰ Attendance
│   │   ├── 📅 Daily Attendance (/attendance)
│   │   ├── ⏱️ Timesheets (/attendance/timesheets)
│   │   ├── ✏️ Corrections (/attendance/corrections)
│   │   └── 📊 Reports (/attendance/reports)
│   ├── 🏖️ Leave
│   │   ├── 📥 Leave Requests (/leave)
│   │   ├── 📝 Apply Leave (/leave/apply)
│   │   └── ⚖️ Balances (/leave/balances)
│   └── 📅 Shifts & Schedules
│       ├── 🔄 Shift Plans (/shifts)
│       └── 🗓️ Schedules (/shifts/schedules)
├── 🏗️ Operations
│   ├── 🏗️ Projects
│   │   ├── 📂 Active Projects (/projects)
│   │   ├── ➕ Create Project (/projects/new)
│   │   └── 🔍 Project Details (/projects/[id])
│   ├── ✅ Tasks
│   │   ├── 📋 All Tasks (/tasks)
│   │   └── 📌 Kanban Board (/tasks/board)
│   ├── 📝 Daily Reports (/reports/site)
│   └── 🦺 Safety (/safety)
├── 🧱 Resources
│   ├── 🧱 Materials (/materials)
│   ├── 🚜 Equipment (/equipment)
│   └── 🛒 Procurement (/procurement)
├── 🤝 CRM & Entities
│   ├── 🤝 Clients (/clients)
│   ├── 👷 Contractors (/contractors)
│   └── 🏭 Vendors (/vendors)
├── 💰 Finance & Admin
│   ├── 💸 Expenses (/expenses)
│   ├── 💰 Payroll (/payroll)
│   └── ⚙️ Settings
│       ├── 🏢 Company Profile (/settings)
│       ├── 🔐 User Roles & Management (/settings/users)
│       └── ⚙️ Preferences (/settings/preferences)
└── 👤 User & Account
    ├── 🔐 Authentication (/login)
    └── 👤 Profile & Security (/profile)
```

---

## 📦 Detailed Module & Menu Breakdown

### 1. 📊 Overview
| Menu Item | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/` | `COMPLETED` | Central executive dashboard displaying live KPIs: active projects, total workforce count, today's attendance metrics, pending approvals, and system quick links. |

---

### 2. 👥 Core HR

#### A. Employees
| Submenu / Feature | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Directory** | `/employees` | `COMPLETED` | Searchable and filterable employee directory with department, role, status badges, and contact details. |
| **Add Employee** | `/employees/new` | `COMPLETED` | Multi-field onboarding form with automated sequential Employee ID generation (`EMP-000001` via Postgres sequence). |
| **Employee Details** | `/employees/[id]` | `COMPLETED` | Detailed profile view showing personal details, project assignments, salary, emergency contacts, and employment history. |

#### B. Attendance
| Submenu / Feature | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Daily Attendance** | `/attendance` | `COMPLETED` | Clock-in / clock-out logs, real-time presence tracking, punch timestamps, and status flags (Present, Late, Absent, Half-Day). |
| **Timesheets** | `/attendance/timesheets` | `COMPLETED` | Weekly and monthly timesheet aggregation by employee with automated overtime calculation. |
| **Corrections** | `/attendance/corrections` | `COMPLETED` | Workflow for employees to submit attendance punch correction requests and managers to approve/reject. |
| **Reports** | `/attendance/reports` | `COMPLETED` | Exportable attendance summaries, late arrival heatmaps, and absenteeism analytics. |

#### C. Leave Management
| Submenu / Feature | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Leave Requests** | `/leave` | `COMPLETED` | Central request queue with multi-status filters (Pending, Approved, Rejected) and manager action buttons. |
| **Apply Leave** | `/leave/apply` | `COMPLETED` | Leave application form supporting Paid Leave, Sick Leave, Casual Leave, and Maternity/Paternity leave with document attachment. |
| **Balances** | `/leave/balances` | `COMPLETED` | Accrual trackers displaying remaining annual quotas, used days, and rollover balances per employee. |

#### D. Shifts & Schedules
| Submenu / Feature | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Shift Plans** | `/shifts` | `COMPLETED` | Shift template definitions (Morning, Evening, Night, Rotational) with break durations and grace periods. |
| **Schedules** | `/shifts/schedules` | `COMPLETED` | Visual calendar-based workforce shift roster with drag-and-drop or batch assignment by department. |

---

### 3. 🏗️ Operations

#### A. Projects
| Submenu / Feature | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Active Projects** | `/projects` | `COMPLETED` | Grid and list view of ongoing construction/engineering projects, budget health, progress bars, and assigned managers. |
| **Create Project** | `/projects/new` | `COMPLETED` | Project initiation form with client association, estimated budget, timeline dates, and milestone planning. |
| **Project Details** | `/projects/[id]` | `COMPLETED` | Deep-dive dashboard with sub-tabs for Task breakdowns, Material requisitions, Assigned workforce, and Expense burn rate. |

#### B. Tasks
| Submenu / Feature | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **All Tasks** | `/tasks` | `COMPLETED` | Tabular task list filterable by priority (Low, Medium, High, Urgent), due date, assignee, and project. |
| **Kanban Board** | `/tasks/board` | `COMPLETED` | Interactive drag-and-drop workflow board (To Do, In Progress, Under Review, Completed). |

#### C. Field Operations
| Menu Item | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Daily Site Reports** | `/reports/site` | `COMPLETED` | Daily Site Logs (DSR) logging weather conditions, site progress, workforce turnout, safety incidents, and work blockers. |
| **Safety Management** | `/safety` | `COMPLETED` | Incident reporting, safety audit logs, PPE compliance tracking, and hazard resolutions. |

---

### 4. 🧱 Resources & Supply Chain
| Menu Item | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Materials** | `/materials` | `COMPLETED` | Real-time warehouse inventory, stock-on-hand levels, reorder thresholds, and unit prices. |
| **Equipment** | `/equipment` | `COMPLETED` | Heavy machinery & tool registry, maintenance schedules, condition logs, and project site allocations. |
| **Procurement** | `/procurement` | `COMPLETED` | Purchase Orders (PO) workflow, purchase requisitions, approval matrix, and delivery tracking. |

---

### 5. 🤝 CRM & External Entities
| Menu Item | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Clients** | `/clients` | `COMPLETED` | Client directory, contract records, point of contact details, and linked project history. |
| **Contractors** | `/contractors` | `COMPLETED` | Subcontractor database, trade specializations, active contracts, and performance evaluations. |
| **Vendors** | `/vendors` | `COMPLETED` | Material and service suppliers, GST/tax information, payment terms, and vendor rating metrics. |

---

### 6. 💰 Finance & Administration

#### A. Financial Modules
| Menu Item | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Expenses** | `/expenses` | `COMPLETED` | Operational and project expense logging, receipt uploads, categorization, and reimbursement approvals. |
| **Payroll** | `/payroll` | `COMPLETED` | Monthly payroll generation engine: basic salary, allowances, deductions, attendance adjustments, and payslip generation. |

#### B. Settings & System Administration
| Submenu / Feature | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Company Profile** | `/settings` | `COMPLETED` | Organization metadata: corporate address, registration/tax numbers, fiscal year configuration, and branding assets. |
| **User Roles & Access** | `/settings/users` | `COMPLETED` | Super Admin portal to create system users, link auth accounts to employees, assign RBAC roles, and suspend/activate accounts. *(Restricted to Super Admin & Admin)* |
| **Preferences** | `/settings/preferences` | `COMPLETED` | System-wide toggles: notification preferences, regional date formats, currency units, and theme settings. |

---

### 7. 👤 User Account & Profile Management
| Feature | Route | Status | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Login & Auth** | `/login` | `COMPLETED` | Multi-step authentication via Supabase Auth with automatic RLS profile mapping and status validation. |
| **My Profile Page** | `/profile` | `COMPLETED` | Dedicated user profile hub: live picture upload to Supabase storage, personal info updates (phone, title, department), and direct password change. |
| **Dynamic Navbar** | `Top Header` | `COMPLETED` | Live user badge showing current initials or avatar image, dynamic full name, system role, and instant routing to `/profile`. |

---

## 🔒 Security, RBAC & Permissions Matrix

The platform enforces database-level authorization via PostgreSQL Row Level Security (RLS) and stored functions. Frontend UI visibility checks mirror strict database policies.

```
                    ┌────────────────────────┐
                    │      Supabase Auth     │
                    └───────────┬────────────┘
                                │ auth.uid()
                                ▼
                    ┌────────────────────────┐
                    │       app_users        │
                    └───────────┬────────────┘
                                │ role_id
                                ▼
                    ┌────────────────────────┐
                    │   roles & permissions  │
                    └───────────┬────────────┘
                                │ has_permission()
                                ▼
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
  ┌───────────────┐                             ┌───────────────┐
  │ Core Tables   │                             │ Storage       │
  │ (employees,   │                             │ (avatars      │
  │  projects...) │                             │  bucket)      │
  └───────────────┘                             └───────────────┘
```

### Predefined Role Hierarchy

| Role | Access Scope & Capabilities |
| :--- | :--- |
| **SUPER_ADMIN** | Unrestricted access across all modules, settings, SQL operations, audit logs, and user management. Full bypass on all RLS checks. |
| **ADMIN** | System-wide administration, project approvals, workforce management, and configuration. |
| **HR_MANAGER** | Full access to Employees, Attendance, Leave, Shifts, and Payroll processing. |
| **PROJECT_MANAGER** | Full access to Projects, Tasks, Daily Reports, Equipment/Material allocations, and Safety logs. |
| **ENGINEER** | Operations view: task updates, attendance punches, leave requests, and site reports. |
| **VIEWER** | Read-only reporting access across operations and projects. |

---

## 🗄️ Database Migrations & Roadmap

All migrations are located in the `/supabase` folder and must be applied in sequential order:

1. **`phase1_2.sql` / `schema.sql`**: Foundational tables (`employees`, `projects`, `attendance`, `leave_requests`, `tasks`, `materials`, `equipment`).
2. **`phase3_4.sql` / `projects_payroll.sql`**: Operations extension (`contractors`, `clients`, `vendors`, `payroll`, `expenses`).
3. **`phase5_users.sql`**: Core user authentication table (`app_users`).
4. **`phase6_auth_rbac.sql`**: RBAC system (`roles`, `permissions`, `role_permissions`, `audit_logs`, `has_permission()` function, and strict RLS policies).
5. **`phase7_profiles.sql`**: Profile storage bucket (`avatars`), avatar columns, and storage RLS rules.
6. **`phase8_fix_rls.sql`**: Self-service profile update policies allowing authenticated users to update their own profile and employee details.

---

## 🚀 Quick Start Guide

### 1. Clone & Install
```bash
git clone <repository-url>
cd sandune-main
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Initial System Administrator

- **Email:** `jacobkebinb@gmail.com`
- **Role:** `SUPER_ADMIN`

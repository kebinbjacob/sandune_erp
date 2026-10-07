# SanDune ERP – User Manual

Welcome to the SanDune ERP system! This comprehensive management platform is designed to streamline your Core HR operations, project execution, resource tracking, and financial administration. 

This manual will guide you through the features and modules available in the system.

---

## 1. Getting Started

### Roles & Access
SanDune ERP uses a strict Role-Based Access Control (RBAC) system. Your access to specific menus, buttons, and data depends on your assigned role (e.g., SUPER_ADMIN, Admin, HR_MANAGER, PROJECT_MANAGER, ENGINEER). 
* **Super Admins** have unrestricted access to all modules and system settings.
* **Menu Visibility:** If you do not see a specific module (like "Payroll" or "Company Documents") in your left-hand sidebar, your role does not have the required permissions.

---

## 2. Core HR

The Core HR section is the heart of your employee management, handling everything from basic records to tracking time off and securely storing personnel files.

### Employees
* **Directory:** View a complete list of all active and inactive employees. You can search by name or filter by department.
* **Add Employee:** Create a new employee profile. This automatically links their profile to the organizational hierarchy.

### Attendance
* **Daily Attendance:** Mark employees as Present, Absent, or Late for the current day. You can also use the **Auto-close Day** feature to automatically mark any unmarked employees as Absent.
* **Timesheets:** View weekly breakdowns of hours worked per employee.
* **Corrections & Reports:** View audit logs of who changed attendance records and generate monthly attendance percentage summaries.

### Leave & Time Off
* **Apply Leave:** Submit new leave requests (Annual, Sick, Casual). The system will warn you if you exceed your available balance.
* **Leave Requests (Approvals):** HR Managers and Admins can approve or reject leave requests. *Note: Approving a request automatically deducts the days from the employee's leave balance.*
* **Balances:** View and manually adjust the remaining leave days for any employee.

### Shifts & Schedules
* Manage recurring shift plans and view weekly calendar schedules showing which employees are assigned to which shift timings.

### Documents (Employee Records)
* **Structure:** This module acts as a secure file explorer. Every employee has their own root folder.
* **Usage:** Click on an employee's name to open their folder. From there, you can create sub-folders (e.g., "Contracts", "Certifications") and upload files (PDFs, images, etc.).

---

## 3. Operations

Track the physical execution of your construction or internal projects.

### Projects
* **Active Projects:** View all ongoing projects, their statuses, and client linkages.
* **Project Dashboard:** Clicking into a project shows its automated completion percentage (calculated directly from completed vs. total tasks).

### Tasks
* **All Tasks / Kanban Board:** Manage task assignments. You can view tasks in a standard list or a visual Kanban board (To Do, In Progress, Review, Done).
* **Editing:** Click on any task to update its status, priority, due date, or assigned personnel.

### Daily Reports & Safety
* **Site Reports:** Log daily progress, weather conditions, and site blockers.
* **Safety:** Record safety incidents. The safety dashboard includes summary cards highlighting total incidents, open cases, and critical severity events.

---

## 4. Resources & CRM

Manage the physical assets, materials, and external relationships required to run your operations.

* **Materials:** Track inventory levels. The system will flag materials that fall below their designated reorder level.
* **Equipment:** Track machinery, vehicles, and tools. Includes a maintenance log to record service history for each asset.
* **Procurement:** Generate and manage Purchase Orders (POs) with multiple line items and auto-calculated totals.
* **CRM (Clients, Contractors, Vendors):** Maintain directories of your external partners, including contact details, statuses, and performance notes.

---

## 5. Finance & Admin

Handle the financial outputs and global system configurations.

### Expenses
* Log company expenses. You can upload scanned receipts or invoices directly to an expense record for auditing purposes.

### Payroll
* **Processing:** Generate monthly payroll runs. The system supports custom tax deductions, Provident Fund (PF), and ESI deductions.
* **History:** View past payroll runs and export the data to CSV for your accounting department.

### Company Documents
*(Admin Only)*
* **Global Storage:** Unlike HR Documents which are tied to specific employees, this module stores global company files such as company-wide policies, blank forms, tax certificates, and letterheads.
* **Usage:** Operates exactly like a desktop file explorer. Create nested folders and upload multiple files at once.

### Settings & User Management
*(Admin Only)*
* **User Management:** Control system access. Here you can link an employee profile to a login account, reset passwords, and assign system roles.
* **Company Profile:** Update global settings like the company name, address, and default currency/timezone.
* **Hierarchy Management:** Super Admins can define the exact read/write/delete permissions for every role across every menu in the system.

---

## Tips & Tricks
1. **CSV Exports:** Look for the "Export CSV" button on pages like Attendance, Payroll, and Site Reports to instantly download your data to Excel.
2. **Deleting Records:** Almost all lists support record deletion. Simply click the red "Delete" button. The system will ask for confirmation to prevent accidental data loss.
3. **Data Grids:** Clicking the column headers on most tables will allow you to sort the data alphabetically or by date.

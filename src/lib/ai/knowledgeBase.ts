export interface RouteInfo {
  name: string;
  category: string;
  href: string;
  icon: string;
  description: string;
  keywords: string[];
  requiredRoles?: string[]; // If undefined, accessible by all
  actions: string[];
  tips: string;
}

export interface WorkflowGuide {
  title: string;
  category: string;
  steps: string[];
  targetRoute: string;
  requiredRole?: string;
  keywords: string[];
}

export const SYSTEM_ROUTES: RouteInfo[] = [
  // Overview
  {
    name: "Dashboard",
    category: "Overview",
    href: "/",
    icon: "📊",
    description: "Main overview showing key metrics, active projects count, workforce statistics, and daily attendance summaries.",
    keywords: ["home", "dashboard", "overview", "main", "metrics", "stats", "kpi", "summary"],
    actions: ["View project status", "Inspect today's attendance", "Check pending approvals count"],
    tips: "This is the executive hub. Use it for a high-level snapshot of company operations."
  },

  // Core HR - Employees
  {
    name: "Employee Directory",
    category: "Core HR",
    href: "/employees",
    icon: "👥",
    description: "Full searchable list of all employees with department, job title, contact details, and status.",
    keywords: ["employee", "employees", "staff", "workers", "directory", "people", "team", "colleagues", "list employees", "find employee"],
    actions: ["Search employees by name/dept", "View employee profiles", "Check employment status"],
    tips: "Click any employee card to view full details including contact info and salary."
  },
  {
    name: "Add Employee",
    category: "Core HR",
    href: "/employees/new",
    icon: "➕",
    description: "Onboarding form to register a new employee with auto-generated Employee ID.",
    keywords: ["add employee", "new employee", "create employee", "hire", "onboard", "register employee", "add staff"],
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
    actions: ["Enter personal details", "Set department & job title", "Assign starting salary & joining date"],
    tips: "The Employee ID (e.g. EMP-000001) will be generated automatically upon saving."
  },

  // Core HR - Attendance
  {
    name: "Daily Attendance",
    category: "Core HR",
    href: "/attendance",
    icon: "⏰",
    description: "Real-time attendance tracker displaying today's clock-in/out timestamps and presence status.",
    keywords: ["attendance", "daily attendance", "clock in", "clock out", "present", "absent", "late", "punches", "check in", "attendance log"],
    actions: ["Check today's attendance", "Filter by department", "Inspect late arrivals"],
    tips: "Displays real-time logs for all employees on site or in office today."
  },
  {
    name: "Timesheets",
    category: "Core HR",
    href: "/attendance/timesheets",
    icon: "⏱️",
    description: "Weekly and monthly employee timesheets with total work hours and overtime calculations.",
    keywords: ["timesheet", "timesheets", "work hours", "overtime", "total hours", "shift hours", "hours worked"],
    actions: ["Review weekly hours", "Calculate overtime", "Export timesheet logs"],
    tips: "Use timesheets before running payroll to ensure accurate hours."
  },
  {
    name: "Attendance Corrections",
    category: "Core HR",
    href: "/attendance/corrections",
    icon: "✏️",
    description: "Review and approve/reject missed punch correction requests submitted by employees.",
    keywords: ["corrections", "attendance correction", "missed punch", "punch correction", "adjust attendance", "fix attendance"],
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "PROJECT_MANAGER"],
    actions: ["Approve correction requests", "Reject invalid punches", "View correction reasons"],
    tips: "Check employee remarks before approving punch adjustment requests."
  },
  {
    name: "Attendance Reports",
    category: "Core HR",
    href: "/attendance/reports",
    icon: "📊",
    description: "Analytical reports, attendance trends, absenteeism heatmaps, and exportable logs.",
    keywords: ["attendance reports", "attendance summary", "absenteeism report", "attendance trends"],
    actions: ["Export attendance CSV", "Analyze department turnout", "Identify absenteeism trends"],
    tips: "Select custom date ranges to generate monthly compliance summaries."
  },

  // Core HR - Leave
  {
    name: "Leave Requests",
    category: "Core HR",
    href: "/leave",
    icon: "🏖️",
    description: "Central queue of submitted employee leave applications awaiting management approval.",
    keywords: ["leave", "leave requests", "leaves", "time off", "vacation requests", "pending leave", "holiday requests"],
    actions: ["Approve leave", "Reject leave", "Filter by status (Pending/Approved/Rejected)"],
    tips: "Pending leave requests show the number of requested days and reason."
  },
  {
    name: "Apply Leave",
    category: "Core HR",
    href: "/leave/apply",
    icon: "📝",
    description: "Form for employees to apply for Paid Leave, Sick Leave, Casual Leave, or Maternity/Paternity Leave.",
    keywords: ["apply leave", "request leave", "take leave", "sick leave", "casual leave", "paid leave", "vacation application", "time off request"],
    actions: ["Select leave type", "Pick start and end dates", "Submit reason"],
    tips: "Make sure you have sufficient remaining balance before submitting."
  },
  {
    name: "Leave Balances",
    category: "Core HR",
    href: "/leave/balances",
    icon: "⚖️",
    description: "Employee annual leave balance tracker showing available, used, and rollover quotas.",
    keywords: ["leave balance", "leave balances", "remaining leave", "leave quota", "available leaves", "vacation balance"],
    actions: ["Check your leave balance", "Inspect team leave quotas", "Review annual allocations"],
    tips: "Displays balances separated by Casual, Sick, and Earned/Privilege leave."
  },

  // Core HR - Shifts
  {
    name: "Shift Plans",
    category: "Core HR",
    href: "/shifts",
    icon: "🔄",
    description: "Configuration of shift timings, morning/evening/night shifts, and grace periods.",
    keywords: ["shifts", "shift plans", "shift timing", "morning shift", "night shift", "working hours schedule"],
    actions: ["Create shift plan", "Configure break duration", "Set shift start/end times"],
    tips: "Define shift templates here before assigning them to schedules."
  },
  {
    name: "Schedules",
    category: "Core HR",
    href: "/shifts/schedules",
    icon: "🗓️",
    description: "Visual weekly/monthly workforce shift roster and schedule assignment.",
    keywords: ["schedules", "roster", "shift schedule", "work schedule", "assign shifts", "shift roster"],
    actions: ["Assign employees to shifts", "View calendar roster", "Manage rotational shifts"],
    tips: "Use bulk assignment to assign entire departments to a shift at once."
  },

  // Operations - Projects
  {
    name: "Active Projects",
    category: "Operations",
    href: "/projects",
    icon: "🏗️",
    description: "Overview of all active and completed construction/engineering projects, milestones, and budgets.",
    keywords: ["project", "projects", "active projects", "sites", "construction projects", "project list", "all projects"],
    actions: ["View project progress", "Filter by status", "Inspect project budgets"],
    tips: "Click on any project to view its detailed task board, materials, and expenses."
  },
  {
    name: "Create Project",
    category: "Operations",
    href: "/projects/new",
    icon: "➕",
    description: "Initiation form to set up a new project with client, timeline, and allocated budget.",
    keywords: ["create project", "new project", "add project", "start project", "project setup"],
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"],
    actions: ["Set project title & code", "Assign client & project manager", "Define budget and target end date"],
    tips: "Ensure a client is created in CRM before linking to a project."
  },

  // Operations - Tasks
  {
    name: "All Tasks",
    category: "Operations",
    href: "/tasks",
    icon: "✅",
    description: "Tabular list of operational and engineering tasks filterable by priority, due date, and assignee.",
    keywords: ["task", "tasks", "all tasks", "task list", "my tasks", "assigned tasks", "todos", "work items"],
    actions: ["Search tasks", "Filter by priority (Urgent/High/Medium/Low)", "Mark tasks as complete"],
    tips: "Filter by assignee to see tasks assigned directly to you."
  },
  {
    name: "Kanban Board",
    category: "Operations",
    href: "/tasks/board",
    icon: "📌",
    description: "Interactive drag-and-drop Kanban task board (To Do, In Progress, Under Review, Done).",
    keywords: ["kanban", "kanban board", "task board", "drag and drop tasks", "sprint board", "progress board"],
    actions: ["Drag tasks between columns", "Update task progress", "Create quick tasks"],
    tips: "Drag tasks to 'Under Review' when waiting on quality/manager signoff."
  },
  {
    name: "Daily Site Reports",
    category: "Operations",
    href: "/reports/site",
    icon: "📝",
    description: "Site activity logs capturing weather, workforce turnout, progress notes, and daily blockers.",
    keywords: ["site report", "daily report", "daily site report", "dsr", "site logs", "site activity", "field report"],
    actions: ["Submit daily log", "Record weather conditions", "Log site incidents and progress"],
    tips: "Submit daily logs by end of shift for accurate operational tracking."
  },
  {
    name: "Safety Management",
    category: "Operations",
    href: "/safety",
    icon: "🦺",
    description: "Incident logging, safety audit records, hazard prevention, and PPE compliance.",
    keywords: ["safety", "safety management", "incident", "accidents", "hazard", "ppe", "safety audit", "safety report"],
    actions: ["Report safety incident", "Log safety inspection", "Track hazard resolutions"],
    tips: "Ensure all incidents are logged within 24 hours for safety compliance."
  },

  // Resources
  {
    name: "Materials",
    category: "Resources",
    href: "/materials",
    icon: "🧱",
    description: "Warehouse inventory tracking, raw material stock levels, unit costs, and reorder warnings.",
    keywords: ["materials", "inventory", "stock", "raw materials", "warehouse", "supplies", "items", "material stock"],
    actions: ["Check stock quantity", "View low-stock warnings", "Log material usage"],
    tips: "Items below their reorder threshold will be flagged automatically."
  },
  {
    name: "Equipment",
    category: "Resources",
    href: "/equipment",
    icon: "🚜",
    description: "Heavy machinery and tool tracking, maintenance logs, and site deployment allocations.",
    keywords: ["equipment", "machinery", "tools", "vehicles", "assets", "maintenance", "heavy equipment"],
    actions: ["View equipment status", "Schedule maintenance", "Assign equipment to site"],
    tips: "Track maintenance dates to prevent equipment breakdowns on site."
  },
  {
    name: "Procurement",
    category: "Resources",
    href: "/procurement",
    icon: "🛒",
    description: "Purchase orders (PO), requisition workflows, supplier approvals, and order tracking.",
    keywords: ["procurement", "purchase orders", "po", "orders", "requisition", "purchase request", "buy materials"],
    actions: ["Create purchase order", "Approve PO", "Track supplier delivery"],
    tips: "Ensure vendor is selected to auto-populate default payment terms."
  },

  // CRM & Entities
  {
    name: "Clients",
    category: "CRM & Entities",
    href: "/clients",
    icon: "🤝",
    description: "Client directory, company contacts, active service contracts, and billing information.",
    keywords: ["client", "clients", "customers", "client list", "client directory", "accounts"],
    actions: ["Add client", "View client contracts", "Inspect client projects"],
    tips: "You can view all past and current projects linked to each client."
  },
  {
    name: "Contractors",
    category: "CRM & Entities",
    href: "/contractors",
    icon: "👷",
    description: "Subcontractor database, specialized trades, contract scopes, and performance ratings.",
    keywords: ["contractor", "contractors", "subcontractors", "sub contractors", "trades"],
    actions: ["Register contractor", "Assign project scope", "Track contractor invoices"],
    tips: "Store specialty licenses and compliance certificates with each contractor."
  },
  {
    name: "Vendors",
    category: "CRM & Entities",
    href: "/vendors",
    icon: "🏭",
    description: "Material suppliers and service providers, GST/tax IDs, payment terms, and catalogues.",
    keywords: ["vendor", "vendors", "suppliers", "supplier list", "vendor list", "dealers"],
    actions: ["Add vendor", "Check vendor terms", "Link vendor to procurement orders"],
    tips: "Used directly when raising Purchase Orders in the Procurement module."
  },

  // Finance & Admin
  {
    name: "Expenses",
    category: "Finance & Admin",
    href: "/expenses",
    icon: "💸",
    description: "Expense tracking, receipt uploads, project cost allocation, and reimbursement approvals.",
    keywords: ["expenses", "expense claim", "reimbursement", "bills", "spending", "receipts", "costs", "claims"],
    actions: ["Submit expense claim", "Upload receipts", "Approve employee expenses"],
    tips: "Tag each expense with a project ID to accurately track project burn rate."
  },
  {
    name: "Payroll",
    category: "Finance & Admin",
    href: "/payroll",
    icon: "💰",
    description: "Monthly payroll processing, basic pay, overtime, attendance deductions, and payslip generation.",
    keywords: ["payroll", "salary", "salaries", "payslip", "wages", "compensation", "payout"],
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
    actions: ["Generate monthly payroll", "Review salary deductions", "Download payslips"],
    tips: "Run payroll after verifying attendance timesheets and approved leave requests."
  },
  {
    name: "Company Profile",
    category: "Finance & Admin",
    href: "/settings",
    icon: "🏢",
    description: "Company organization details, tax numbers, corporate address, and currency settings.",
    keywords: ["company settings", "company profile", "organization", "company info", "settings"],
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    actions: ["Update company info", "Set fiscal year", "Configure tax defaults"],
    tips: "These details appear automatically on generated purchase orders and payslips."
  },
  {
    name: "User Roles & Access",
    category: "Finance & Admin",
    href: "/settings/users",
    icon: "🔐",
    description: "Super Admin portal to manage system logins, assign RBAC roles, and activate/suspend users.",
    keywords: ["user roles", "user management", "users", "roles", "rbac", "permissions", "create user", "admin users", "manage users"],
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    actions: ["Add new system user", "Assign RBAC role", "Suspend/activate user logins", "Reset access"],
    tips: "Restricted strictly to Super Admins and Admins. Only users linked to employees can log in."
  },
  {
    name: "Preferences",
    category: "Finance & Admin",
    href: "/settings/preferences",
    icon: "⚙️",
    description: "System-wide preferences, notifications, theme toggles, and regional date formats.",
    keywords: ["preferences", "system preferences", "notifications", "regional settings", "theme"],
    actions: ["Configure notification alerts", "Set date format", "Adjust display options"],
    tips: "Preferences apply to your user session and system alerts."
  },

  // Account
  {
    name: "My Profile",
    category: "Account",
    href: "/profile",
    icon: "👤",
    description: "Personal user profile page to upload avatar, change password, and update contact details.",
    keywords: ["profile", "my profile", "account", "change password", "profile picture", "avatar", "update phone", "my details"],
    actions: ["Upload profile picture", "Update phone & title", "Change login password"],
    tips: "Click on your avatar or name in the top right navbar anytime to access your profile."
  }
];

export const WORKFLOW_GUIDES: WorkflowGuide[] = [
  {
    title: "How to Add a New Employee",
    category: "Core HR",
    keywords: ["how to add employee", "new employee guide", "onboard employee", "create employee step"],
    targetRoute: "/employees/new",
    requiredRole: "HR_MANAGER",
    steps: [
      "Navigate to **Core HR &rarr; Employees &rarr; Add Employee** (or click the button below).",
      "Enter the employee's **Full Name**, **Email**, and **Phone Number**.",
      "Select their **Department** (e.g. Engineering, Management, Operations).",
      "Set their **Job Title**, **Starting Salary**, and **Joining Date**.",
      "Click **Save Employee**. The system will automatically generate a sequential Employee ID (e.g. `EMP-000001`).",
      "Optional: Go to **Settings &rarr; User Roles** if you wish to grant them system login access."
    ]
  },
  {
    title: "How to Apply for Leave",
    category: "Core HR",
    keywords: ["how to apply leave", "leave application steps", "take vacation", "request time off"],
    targetRoute: "/leave/apply",
    steps: [
      "Go to **Core HR &rarr; Leave &rarr; Apply Leave**.",
      "Check your remaining leave balance in **Balances** tab if needed.",
      "Select the **Leave Type** (Casual Leave, Sick Leave, or Paid Leave).",
      "Pick your **Start Date** and **End Date**.",
      "Provide a clear **Reason for Leave**.",
      "Click **Submit Application**. Your manager will be notified for review."
    ]
  },
  {
    title: "How to Create and Track a Project",
    category: "Operations",
    keywords: ["how to create project", "new project guide", "start construction project", "project setup steps"],
    targetRoute: "/projects/new",
    requiredRole: "PROJECT_MANAGER",
    steps: [
      "Go to **Operations &rarr; Projects &rarr; Create Project**.",
      "Enter the **Project Title**, **Site Location**, and assign a **Client**.",
      "Set the **Budget Limit** and target **Start/End Dates**.",
      "Assign a **Project Manager**.",
      "Click **Create Project**. Once created, open the project to assign tasks, equipment, and track material requests."
    ]
  },
  {
    title: "How to Change Your Password or Profile Picture",
    category: "Account",
    keywords: ["how to change password", "change profile picture", "update avatar", "edit profile guide"],
    targetRoute: "/profile",
    steps: [
      "Click your avatar/name in the top-right Navbar or open **My Profile**.",
      "To change your picture: Click on the circular avatar and upload any image file.",
      "To update your details: Modify your phone or title and click **Save Changes**.",
      "To change your password: Scroll to **Security & Password**, enter your new password twice, and click **Update Password**."
    ]
  },
  {
    title: "How to Process Monthly Payroll",
    category: "Finance & Admin",
    keywords: ["how to process payroll", "run payroll guide", "salary payout steps", "generate payslips"],
    targetRoute: "/payroll",
    requiredRole: "HR_MANAGER",
    steps: [
      "First, review all **Attendance Timesheets** and approved **Leave Requests** for the month.",
      "Navigate to **Finance & Admin &rarr; Payroll**.",
      "Select the **Pay Period / Month** and click **Calculate Payroll**.",
      "Review calculated basic salary, overtime additions, and absence deductions.",
      "Click **Approve & Generate Payslips**."
    ]
  }
];

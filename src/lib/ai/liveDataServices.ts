import { supabase } from '@/lib/supabase/client';

export interface PendingApprovalsSummary {
  leaveRequests: Array<{
    id: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
  }>;
  expenses: Array<{
    id: string;
    employeeName: string;
    category: string;
    amount: number;
    description: string;
    date: string;
  }>;
  totalCount: number;
}

export interface TaskSummaryItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: string;
  project?: string;
}

export interface EntitySummary {
  type: 'project' | 'employee' | 'client' | 'vendor' | 'site_report' | 'general';
  title: string;
  subtitle?: string;
  status?: string;
  metrics: Array<{ label: string; value: string | number }>;
  highlights: string[];
  actionLink?: { href: string; label: string };
}

/**
 * Fetch all pending approvals across Leave Requests and Expenses
 */
export async function getPendingApprovals(): Promise<PendingApprovalsSummary> {
  const result: PendingApprovalsSummary = {
    leaveRequests: [],
    expenses: [],
    totalCount: 0,
  };

  try {
    // 1. Pending Leave Requests
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*, employees(name)')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (leaves && leaves.length > 0) {
      result.leaveRequests = leaves.map(l => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
        return {
          id: l.id,
          employeeName: l.employees?.name || l.employee_name || 'Staff Member',
          leaveType: l.leave_type || 'Leave',
          startDate: l.start_date,
          endDate: l.end_date,
          days: diffDays,
          reason: l.reason || 'No reason specified',
        };
      });
    }

    // 2. Pending Expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (expenses && expenses.length > 0) {
      result.expenses = expenses.map(e => ({
        id: e.id,
        employeeName: e.employee_name || 'Staff Member',
        category: e.category || 'Operational',
        amount: Number(e.amount) || 0,
        description: e.description || 'Expense claim',
        date: e.date || new Date().toISOString().split('T')[0],
      }));
    }

    result.totalCount = result.leaveRequests.length + result.expenses.length;
  } catch (err) {
    console.error('Error fetching pending approvals:', err);
  }

  return result;
}

/**
 * Fetch tasks with optional filtering (status, priority, query)
 */
export async function getTasksSummary(options?: {
  priority?: string;
  status?: string;
  query?: string;
}): Promise<TaskSummaryItem[]> {
  try {
    let q = supabase.from('tasks').select('*, projects(title), employees(name)');

    if (options?.priority) {
      q = q.ilike('priority', `%${options.priority}%`);
    }
    if (options?.status) {
      q = q.ilike('status', `%${options.status}%`);
    }

    const { data, error } = await q.order('due_date', { ascending: true }).limit(10);

    if (error || !data) {
      // Return fallback task structure if table query fails
      return [];
    }

    let items = data.map(t => ({
      id: t.id,
      title: t.title || t.name || 'Untitled Task',
      status: t.status || 'To Do',
      priority: t.priority || 'Medium',
      dueDate: t.due_date || t.deadline || 'No due date',
      assignedTo: t.employees?.name || t.assignee || 'Unassigned',
      project: t.projects?.title || t.project_name || 'General',
    }));

    if (options?.query) {
      const lower = options.query.toLowerCase();
      items = items.filter(
        i =>
          i.title.toLowerCase().includes(lower) ||
          i.assignedTo.toLowerCase().includes(lower) ||
          i.project.toLowerCase().includes(lower)
      );
    }

    return items;
  } catch (err) {
    console.error('Error fetching tasks summary:', err);
    return [];
  }
}

/**
 * Deep summarization of a particular entity (project, employee, client, vendor)
 */
export async function summarizeParticularEntity(
  query: string
): Promise<EntitySummary | null> {
  const clean = query.trim();

  // Try matching Project
  try {
    const { data: projects } = await supabase
      .from('projects')
      .select('*, clients(name)')
      .or(`title.ilike.%${clean}%,code.ilike.%${clean}%`)
      .limit(1);

    if (projects && projects.length > 0) {
      const p = projects[0];
      const budgetFormatted = p.budget ? `$${Number(p.budget).toLocaleString()}` : 'Not specified';
      const spentFormatted = p.spent ? `$${Number(p.spent).toLocaleString()}` : '$0';
      const progress = p.progress !== undefined ? `${p.progress}%` : 'In Progress';

      return {
        type: 'project',
        title: `Project: ${p.title}`,
        subtitle: `Code: ${p.code || 'N/A'} | Client: ${p.clients?.name || p.client_name || 'Direct'}`,
        status: p.status || 'Active',
        metrics: [
          { label: 'Budget', value: budgetFormatted },
          { label: 'Spent to Date', value: spentFormatted },
          { label: 'Progress', value: progress },
          { label: 'Target Completion', value: p.end_date || p.deadline || 'Ongoing' },
        ],
        highlights: [
          `Location: ${p.location || 'Main Site'}`,
          `Project Manager: ${p.manager || 'Assigned Lead'}`,
          `Current Phase: ${p.status || 'Active Execution'}`,
        ],
        actionLink: { href: `/projects/${p.id}`, label: 'Open Full Project Dashboard' },
      };
    }
  } catch (e) {
    // continue
  }

  // Try matching Employee
  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .or(`name.ilike.%${clean}%,email.ilike.%${clean}%,employee_id.ilike.%${clean}%`)
      .limit(1);

    if (employees && employees.length > 0) {
      const emp = employees[0];
      return {
        type: 'employee',
        title: `Staff: ${emp.name}`,
        subtitle: `${emp.employee_id || 'ID Pending'} • ${emp.role || 'Staff'}`,
        status: emp.status || 'Active',
        metrics: [
          { label: 'Department', value: emp.department || 'General' },
          { label: 'Joined', value: emp.joining_date || 'Active' },
          { label: 'Phone', value: emp.phone || 'Not listed' },
          { label: 'Current Assignment', value: emp.project || 'Available / Site' },
        ],
        highlights: [
          `Email: ${emp.email || 'N/A'}`,
          `Designation: ${emp.role || 'Team Member'}`,
          `Status: ${emp.status || 'Active'}`,
        ],
        actionLink: { href: `/employees/${emp.id}`, label: 'View Employee Profile' },
      };
    }
  } catch (e) {
    // continue
  }

  // Try matching Client
  try {
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${clean}%,email.ilike.%${clean}%`)
      .limit(1);

    if (clients && clients.length > 0) {
      const c = clients[0];
      return {
        type: 'client',
        title: `Client: ${c.name}`,
        subtitle: c.company || 'Corporate Client',
        status: c.status || 'Active Partner',
        metrics: [
          { label: 'Email', value: c.email || 'N/A' },
          { label: 'Phone', value: c.phone || 'N/A' },
          { label: 'Industry', value: c.industry || 'Commercial' },
          { label: 'Total Projects', value: c.total_projects || 1 },
        ],
        highlights: [
          `Primary Contact: ${c.contact_person || c.name}`,
          `Billing Terms: ${c.payment_terms || 'Standard Net-30'}`,
        ],
        actionLink: { href: '/clients', label: 'View in Client CRM' },
      };
    }
  } catch (e) {
    // continue
  }

  return null;
}

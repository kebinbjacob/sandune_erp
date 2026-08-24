export interface DraftEmail {
  type: 'project_update' | 'leave_notice' | 'task_assignment' | 'vendor_po' | 'attendance_notice' | 'custom';
  title: string;
  recipient: string;
  subject: string;
  body: string;
  mailtoUrl: string;
}

/**
 * Generate a ready-to-send formal business email based on user intent and parameters
 */
export function composeSmartEmail(params: {
  intent: string;
  recipientName?: string;
  recipientEmail?: string;
  projectName?: string;
  taskTitle?: string;
  leaveStatus?: 'Approved' | 'Rejected';
  leaveDates?: string;
  senderName?: string;
}): DraftEmail {
  const sender = params.senderName || 'SanDune Operations Management';
  const query = params.intent.toLowerCase();

  // 1. Leave Approval / Decision Notice
  if (query.includes('leave') || query.includes('vacation')) {
    const isApproved = !query.includes('reject') && !query.includes('decline');
    const recipient = params.recipientEmail || 'employee@sandune.com';
    const name = params.recipientName || 'Team Member';
    const dates = params.leaveDates || 'the requested period';

    const subject = `Leave Request Notification: ${isApproved ? 'Approved' : 'Status Update'}`;
    const body = `Dear ${name},

We are writing to formally inform you that your leave request for ${dates} has been ${
      isApproved ? 'APPROVED' : 'REVIEWED & CANNOT BE APPROVED AT THIS TIME'
    }.

${
  isApproved
    ? 'Please ensure all your active tasks are properly delegated to your team lead prior to your departure.'
    : 'Please connect with your department manager if you would like to discuss alternative scheduling or rescheduling.'
}

If you have any questions regarding your leave balance, feel free to review your account on the SanDune ERP portal.

Best regards,
${sender}
SanDune ERP Human Resources`;

    return {
      type: 'leave_notice',
      title: isApproved ? 'Leave Approval Notice' : 'Leave Decision Notice',
      recipient,
      subject,
      body,
      mailtoUrl: generateMailto(recipient, subject, body),
    };
  }

  // 2. Project Status / Progress Update to Client
  if (query.includes('project') || query.includes('client') || query.includes('progress')) {
    const project = params.projectName || 'Construction Project Phase 1';
    const recipient = params.recipientEmail || 'client@partner.com';
    const name = params.recipientName || 'Valued Client';

    const subject = `Project Milestone & Progress Update: ${project}`;
    const body = `Dear ${name},

We are pleased to provide you with an operational progress update regarding ${project}.

Key Highlights:
• Current Milestones: All scheduled deliverables for the current sprint are on track.
• Site Activities: Active workforce and machinery deployment are operating under full safety compliance.
• Next Steps: Structural inspections and material quality checks will proceed as scheduled next week.

Should you require any detailed cost breakdowns or architectural logs, our team is available to assist.

Thank you for your continued partnership.

Warm regards,
${sender}
SanDune Operations Team`;

    return {
      type: 'project_update',
      title: 'Project Progress Report (Client)',
      recipient,
      subject,
      body,
      mailtoUrl: generateMailto(recipient, subject, body),
    };
  }

  // 3. Task Assignment Notification
  if (query.includes('task') || query.includes('assign')) {
    const task = params.taskTitle || 'Site Inspection & Material Verification';
    const recipient = params.recipientEmail || 'engineer@sandune.com';
    const name = params.recipientName || 'Engineer / Team Lead';

    const subject = `New Task Assignment: ${task}`;
    const body = `Hi ${name},

A new operational task has been assigned to you in the SanDune ERP system:

• Task Title: ${task}
• Priority: High
• Action Required: Please review the task board, inspect the site requirements, and update the task progress accordingly.

You can view the full task specifications on the ERP Task Kanban board.

Best,
${sender}`;

    return {
      type: 'task_assignment',
      title: 'Task Assignment Email',
      recipient,
      subject,
      body,
      mailtoUrl: generateMailto(recipient, subject, body),
    };
  }

  // 4. Vendor / Purchase Order Inquiry
  if (query.includes('vendor') || query.includes('supplier') || query.includes('procurement') || query.includes('po')) {
    const recipient = params.recipientEmail || 'sales@vendor.com';
    const name = params.recipientName || 'Vendor Sales Department';

    const subject = `Purchase Order & Requisition Inquiry - SanDune ERP`;
    const body = `Dear ${name},

We are reaching out to inquire regarding our recent material requisition and quotation for upcoming site deliveries.

Please find the details below:
• Organization: SanDune Construction & Engineering
• Requirements: Standard procurement specifications as per our agreement.
• Expected Delivery: Urgent site requirement.

Please provide us with the latest stock availability, delivery timeline, and updated invoice estimate at your earliest convenience.

Kind regards,
${sender}
SanDune Procurement Dept`;

    return {
      type: 'vendor_po',
      title: 'Vendor Purchase Order Inquiry',
      recipient,
      subject,
      body,
      mailtoUrl: generateMailto(recipient, subject, body),
    };
  }

  // 5. Default General Business Memo
  const recipient = params.recipientEmail || 'team@sandune.com';
  const subject = `Notice: Operational Update from SanDune ERP`;
  const body = `Dear Team,

Please take note of the following operational update regarding ongoing site and administrative workflows.

• Key Details: Operational standards, timesheet compliance, and safety protocols remain in full effect.
• Next Action: Please log into the SanDune ERP dashboard to review any pending tasks or notifications assigned to your department.

Sincerely,
${sender}`;

  return {
    type: 'custom',
    title: 'Formal Business Communication',
    recipient,
    subject,
    body,
    mailtoUrl: generateMailto(recipient, subject, body),
  };
}

function generateMailto(to: string, subject: string, body: string): string {
  const encTo = encodeURIComponent(to);
  const encSub = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  return `mailto:${encTo}?subject=${encSub}&body=${encBody}`;
}

import { SYSTEM_ROUTES, WORKFLOW_GUIDES, RouteInfo } from './knowledgeBase';
import {
  getPendingApprovals,
  getTasksSummary,
  summarizeParticularEntity,
  PendingApprovalsSummary,
  TaskSummaryItem,
  EntitySummary,
} from './liveDataServices';
import { composeSmartEmail, DraftEmail } from './emailComposer';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionCard?: {
    type: 'navigation' | 'approvals' | 'tasks' | 'summary' | 'email';
    title: string;
    route?: string;
    routeLabel?: string;
    approvalsData?: PendingApprovalsSummary;
    tasksData?: TaskSummaryItem[];
    summaryData?: EntitySummary;
    emailData?: DraftEmail;
  };
  suggestedPrompts?: string[];
}

export interface ProcessQueryContext {
  query: string;
  currentRoute?: string;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Main AI Engine Process Function
 */
export async function processAIQuery(ctx: ProcessQueryContext): Promise<ChatMessage> {
  const query = ctx.query.trim().toLowerCase();
  const role = ctx.userRole || 'VIEWER';
  const name = ctx.userName || 'there';

  // 1. Check for Pending Approvals Intent
  if (
    query.includes('approval') ||
    query.includes('pending') ||
    query.includes('leave request') ||
    query.includes('review leaves')
  ) {
    const approvals = await getPendingApprovals();
    const count = approvals.totalCount;

    if (count === 0) {
      return {
        id: generateId(),
        sender: 'assistant',
        text: `✨ Great news! There are currently **no pending approvals** in the queue. All leave applications and expense submissions are up to date.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard: {
          type: 'navigation',
          title: 'Review Leave Management Queue',
          route: '/leave',
          routeLabel: 'Open Leave Requests',
        },
        suggestedPrompts: ['Show my tasks', 'How to apply for leave', 'Check today attendance'],
      };
    }

    return {
      id: generateId(),
      sender: 'assistant',
      text: `🔔 Found **${count} pending approval${count > 1 ? 's' : ''}** requiring attention (Leave requests & Expense claims). Here is the live status:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        type: 'approvals',
        title: `Pending Approvals Queue (${count})`,
        approvalsData: approvals,
        route: '/leave',
        routeLabel: 'Go to Approvals Portal',
      },
      suggestedPrompts: ['Show high priority tasks', 'Summarize active projects', 'Draft approval email'],
    };
  }

  // 2. Check for Tasks Intent
  if (
    query.includes('task') ||
    query.includes('todo') ||
    query.includes('work item') ||
    query.includes('assigned to me')
  ) {
    const isUrgent = query.includes('urgent') || query.includes('high');
    const tasks = await getTasksSummary({ priority: isUrgent ? 'High' : undefined });

    return {
      id: generateId(),
      sender: 'assistant',
      text: `📋 Here are the **active ${isUrgent ? 'high-priority ' : ''}tasks** currently registered in the system:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        type: 'tasks',
        title: isUrgent ? 'Urgent & High Priority Tasks' : 'All Active Tasks',
        tasksData: tasks,
        route: '/tasks/board',
        routeLabel: 'Open Kanban Task Board',
      },
      suggestedPrompts: ['Check pending approvals', 'Where is project management?', 'Draft task update email'],
    };
  }

  // 3. Check for Email / Message Composition Intent
  if (
    query.includes('mail') ||
    query.includes('email') ||
    query.includes('draft') ||
    query.includes('compose') ||
    query.includes('write letter') ||
    query.includes('send notice')
  ) {
    const emailDraft = composeSmartEmail({
      intent: query,
      senderName: ctx.userName || 'Operations Lead',
    });

    return {
      id: generateId(),
      sender: 'assistant',
      text: `✉️ I have drafted a formal business communication for you (**${emailDraft.title}**). You can review, copy, or launch it directly in your email client:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        type: 'email',
        title: emailDraft.title,
        emailData: emailDraft,
      },
      suggestedPrompts: ['Draft another email for project update', 'Show pending approvals', 'Find employee'],
    };
  }

  // 4. Check for Deep Entity Summarization Intent
  if (
    query.includes('summarize') ||
    query.includes('summary of') ||
    query.includes('overview of') ||
    query.includes('details of') ||
    query.includes('tell me about')
  ) {
    // Extract target query
    const target = query
      .replace(/summarize|summary of|overview of|details of|tell me about/gi, '')
      .replace(/project|employee|staff|client|vendor/gi, '')
      .trim();

    if (target.length > 1) {
      const summary = await summarizeParticularEntity(target);
      if (summary) {
        return {
          id: generateId(),
          sender: 'assistant',
          text: `📊 Here is the consolidated summary for **${summary.title}**:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionCard: {
            type: 'summary',
            title: summary.title,
            summaryData: summary,
            route: summary.actionLink?.href,
            routeLabel: summary.actionLink?.label,
          },
          suggestedPrompts: ['Draft email about this project', 'Show all tasks', 'Help me navigate'],
        };
      }
    }
  }

  // 5. Check for Step-by-step Workflow Guides
  const matchedGuide = WORKFLOW_GUIDES.find(g =>
    g.keywords.some(k => query.includes(k)) || query.includes(g.title.toLowerCase())
  );

  if (matchedGuide) {
    const formattedSteps = matchedGuide.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n');

    return {
      id: generateId(),
      sender: 'assistant',
      text: `📖 **Guide: ${matchedGuide.title}**\n\n${formattedSteps}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        type: 'navigation',
        title: `Jump to ${matchedGuide.category}`,
        route: matchedGuide.targetRoute,
        routeLabel: `Go directly to ${matchedGuide.title.replace('How to ', '')}`,
      },
      suggestedPrompts: ['Show next steps', 'Are there any pending approvals?', 'Help me navigate'],
    };
  }

  // 6. Navigation & Route Matching
  const matchedRoute = findBestMatchingRoute(query);

  if (matchedRoute) {
    // Permission check
    const isRestricted =
      matchedRoute.requiredRoles &&
      !matchedRoute.requiredRoles.includes(role) &&
      role !== 'SUPER_ADMIN';

    if (isRestricted) {
      return {
        id: generateId(),
        sender: 'assistant',
        text: `🔒 The **${matchedRoute.name}** module is restricted to authorized administrators (${matchedRoute.requiredRoles?.join(
          ', '
        )}). Your current system role is **${role}**.\n\nPlease contact a Super Admin if you require access to this area.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: ['Show my accessible modules', 'Where is my profile?', 'Check my tasks'],
      };
    }

    return {
      id: generateId(),
      sender: 'assistant',
      text: `🧭 **${matchedRoute.icon} ${matchedRoute.name}** (${matchedRoute.category})\n\n${matchedRoute.description}\n\n💡 **Tip:** ${matchedRoute.tips}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        type: 'navigation',
        title: matchedRoute.name,
        route: matchedRoute.href,
        routeLabel: `🚀 Open ${matchedRoute.name}`,
      },
      suggestedPrompts: [
        `What can I do in ${matchedRoute.name}?`,
        'Show pending approvals',
        'Check active tasks',
      ],
    };
  }

  // 7. Contextual / Page-Specific Help
  if (query.includes('where am i') || query.includes('current page') || query.includes('this page')) {
    const current = SYSTEM_ROUTES.find(r => r.href === ctx.currentRoute) || SYSTEM_ROUTES[0];
    return {
      id: generateId(),
      sender: 'assistant',
      text: `📍 You are currently on **${current.icon} ${current.name}** (${current.category}).\n\n${current.description}\n\n**Common actions on this screen:**\n${current.actions.map(a => `• ${a}`).join('\n')}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        type: 'navigation',
        title: current.name,
        route: current.href,
        routeLabel: `Stay on ${current.name}`,
      },
      suggestedPrompts: ['Show pending approvals', 'Draft an email update', 'List all tasks'],
    };
  }

  // 8. General Help / Default Greeting (or Gemini API Agent Fallback)
  if (process.env.GEMINI_API_KEY) {
    const { runGeminiAgent } = require('./geminiAgent');
    const agentResponse = await runGeminiAgent(ctx);
    if (agentResponse) return agentResponse;
  }

  return {
    id: generateId(),
    sender: 'assistant',
    text: `👋 Hello **${name}**! I am your SanDune ERP Intelligent Assistant.\n\nI can assist you with:\n• **Navigation:** Ask *"Where is payroll?"*, *"Show employee directory"*, or *"How to apply leave"*\n• **Approvals:** Ask *"Do I have pending approvals?"*\n• **Tasks:** Ask *"Show my tasks"* or *"List high priority todos"*\n• **Summaries:** Ask *"Summarize Project [Name]"* or *"Summarize staff [Name]"*\n• **Email Composer:** Ask *"Draft email to client about project delay"*\n\nHow can I help you right now?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedPrompts: [
      '🔔 Check Pending Approvals',
      '📋 Show My Tasks',
      '🏗️ Active Projects',
      '⏰ Daily Attendance',
      '✉️ Draft an Email',
    ],
  };
}

function findBestMatchingRoute(query: string): RouteInfo | null {
  const clean = query.toLowerCase();

  // Exact or keyword matching
  let bestMatch: RouteInfo | null = null;
  let highestScore = 0;

  for (const route of SYSTEM_ROUTES) {
    let score = 0;

    if (clean === route.name.toLowerCase() || clean === route.href.replace('/', '')) {
      return route;
    }

    for (const kw of route.keywords) {
      if (clean.includes(kw)) {
        score += kw.length;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = route;
    }
  }

  return highestScore >= 3 ? bestMatch : null;
}

function generateId(): string {
  return 'msg_' + Math.random().toString(36).substring(2, 9);
}

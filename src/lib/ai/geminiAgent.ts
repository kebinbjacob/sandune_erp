import { GoogleGenerativeAI, FunctionDeclaration, SchemaType, Tool } from '@google/generative-ai';
import { getEmployees } from '../services/employeeService';
import { getAllTasks, createTask, updateTaskStatus, TASK_STATUSES, TASK_PRIORITIES } from '../services/taskService';
import { updateLeaveStatus } from '../services/leaveService';
import { ChatMessage, ProcessQueryContext } from './aiEngine';
import { getPendingApprovals, getTasksSummary, summarizeParticularEntity } from './liveDataServices';
import { composeSmartEmail } from './emailComposer';
import { SYSTEM_ROUTES } from './knowledgeBase';

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_employees',
        description: 'Get a list of all employees in the company. Includes their name, role, department, and contact info.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'get_tasks',
        description: 'Get all active tasks on the Kanban board.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task on the Kanban board. MUST ask for user confirmation before executing.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: 'Title of the task' },
            description: { type: SchemaType.STRING, description: 'Detailed description' },
            priority: { type: SchemaType.STRING, description: 'Priority: Low, Medium, High, or Critical' },
            project_id: { type: SchemaType.STRING, description: 'ID of the project (use a placeholder if unknown)' },
            assigned_to: { type: SchemaType.STRING, description: 'Employee name or ID to assign to' },
            confirmed: { type: SchemaType.BOOLEAN, description: 'Set to true ONLY if the user has explicitly confirmed they want to create this task.' }
          },
          required: ['title', 'priority', 'confirmed'],
        },
      },
      {
        name: 'approve_leave',
        description: 'Approve or Reject an employee leave request. MUST ask for confirmation first.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            request_id: { type: SchemaType.STRING, description: 'ID of the leave request' },
            status: { type: SchemaType.STRING, description: 'Approved or Rejected' },
            confirmed: { type: SchemaType.BOOLEAN, description: 'Set to true ONLY if the user has explicitly confirmed they want to execute this.' }
          },
          required: ['request_id', 'status', 'confirmed'],
        },
      },
      {
        name: 'get_pending_approvals',
        description: 'Get pending leave requests and expense claims that require approval. Note the IDs so you can approve them.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'navigate_to_page',
        description: 'Find the best system page to navigate to based on the users request (e.g. "go to payroll", "where is attendance").',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            page_name: { type: SchemaType.STRING, description: 'Name or description of the page' },
          },
          required: ['page_name'],
        },
      }
    ],
  },
];

export async function runGeminiAgent(ctx: ProcessQueryContext): Promise<ChatMessage | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      tools: tools,
    });

    const formattedHistory = (ctx.history || []).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `You are the SanDune ERP Assistant. The current user is ${ctx.userName} (Role: ${ctx.userRole}). You can retrieve data and perform actions.
Always format lists (like employees or tasks) as clean Markdown tables.

TOOL USAGE RULES - follow these strictly:
1. navigate_to_page: ONLY use this when the user explicitly wants to GO somewhere, e.g. "take me to", "go to", "show me the page", "open", "navigate to". NEVER call navigate_to_page when the user says "create", "add", "make" or "I want to create".
2. create_task: NEVER call this immediately. You MUST first run the TASK CREATION WORKFLOW below.

TASK CREATION WORKFLOW (mandatory when user says "create a task", "add a task", "new task", or similar):
Step 1 - Ask: "What should be the task title?"
Step 2 - Ask: "Can you describe what needs to be done?"
Step 3 - Ask: "What priority? (Low / Medium / High / Critical)"
Step 4 - Ask: "Who should this be assigned to?"
Step 5 - Show a clear summary of all the details and ask: "Shall I create this task? (Yes/No)"
Step 6 - ONLY when the user says yes, call create_task with confirmed=true.

If the user provides multiple details in one message (e.g. "create a High priority task to Fix the roof"), you may skip the questions for details already provided, but you MUST still show a summary and ask for confirmation at Step 5.` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I will never auto-navigate when asked to create a task. I will guide the user through the task creation workflow step by step, collecting title, description, priority, and assignee before showing a summary and asking for confirmation.' }],
        },
        ...formattedHistory
      ],
    });

    // ─── Pre-flight: Detect task creation intent ────────────────────────────
    // Bypass Gemini entirely when user clearly wants to CREATE a task.
    // This prevents Gemini from misreading intent and showing task list / navigation.
    const lowerQuery = ctx.query.toLowerCase().replace(/[*?!.,]/g, '').trim();
    const isCreateTaskIntent =
      /\b(create|add|make|new)\b/.test(lowerQuery) &&
      /\btask\b/.test(lowerQuery) &&
      !/\b(show|list|get|view|open|go to|take me|board|where|all|my)\b/.test(lowerQuery);

    if (isCreateTaskIntent) {
      // Return the first question of the task creation workflow immediately.
      // The user's next replies will be sent through Gemini normally with history,
      // where Gemini will collect the remaining details step by step.
      return {
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        sender: 'assistant',
        text: `Sure! Let me help you create a task. I'll ask you a few quick questions.\n\n**Step 1 of 4 — What should be the task title?**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: ['Fix the scaffolding', 'Inspect site equipment', 'Review safety report'],
      };
    }

    let result = await chat.sendMessage(ctx.query);
    let functionCall = result.response.functionCalls() && result.response.functionCalls()![0];

    // Handle Tool Calls
    if (functionCall) {
      let functionResponse: any = {};
      const { name, args } = functionCall;

      if (name === 'get_employees') {
        const employees = await getEmployees();
        // RBAC: Hide salary if not admin/HR
        const safeEmployees = employees.map(e => ({
          name: e.name,
          role: e.role,
          department: e.department,
          status: e.status,
          ...(ctx.userRole === 'SUPER_ADMIN' || ctx.userRole === 'HR_MANAGER' ? { salary: e.salary } : {})
        }));
        functionResponse = safeEmployees;
      } 
      else if (name === 'get_tasks') {
        const tasks = await getAllTasks();
        functionResponse = tasks.map(t => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          assigned_to: t.employees?.name || 'Unassigned',
          project: t.projects?.name || 'Unknown'
        }));
      }
      else if (name === 'create_task') {
        const { title, description, priority, project_id, assigned_to, confirmed } = args as any;
        
        if (!confirmed) {
          functionResponse = { status: 'pending_confirmation', message: 'Ask the user if they are sure they want to create this task.' };
        } else {
          // Verify Permissions
          if (ctx.userRole === 'VIEWER') {
            functionResponse = { error: 'Permission Denied. Viewers cannot create tasks.' };
          } else {
            try {
              const taskData = {
                title,
                description,
                priority: priority || 'Medium',
                status: 'To Do',
                project_id: project_id || '00000000-0000-0000-0000-000000000000',
              };
              const created = await createTask(taskData);
              functionResponse = { status: 'success', task: created };
            } catch (e: any) {
              functionResponse = { error: e.message };
            }
          }
        }
      }
      else if (name === 'approve_leave') {
        const { request_id, status, confirmed } = args as any;
        if (!confirmed) {
          functionResponse = { status: 'pending_confirmation', message: `Ask the user if they are sure they want to ${status} this leave request.` };
        } else {
          if (ctx.userRole === 'VIEWER' || ctx.userRole === 'ENGINEER') {
            functionResponse = { error: 'Permission Denied. Only Admins and HR can approve leave requests.' };
          } else {
            try {
              await updateLeaveStatus(request_id, status);
              functionResponse = { status: 'success', message: `Leave request ${status} successfully.` };
            } catch (e: any) {
              functionResponse = { error: e.message };
            }
          }
        }
      }
      else if (name === 'get_pending_approvals') {
        functionResponse = await getPendingApprovals();
      }
      else if (name === 'navigate_to_page') {
        const pageName = (args as any).page_name.toLowerCase();
        const route = SYSTEM_ROUTES.find(r => r.name.toLowerCase().includes(pageName) || r.keywords.some(k => pageName.includes(k)));
        if (route) {
          functionResponse = { found: true, route: route.href, name: route.name, description: route.description };
        } else {
          functionResponse = { found: false, message: 'Page not found' };
        }
      }

      // Send the result back to Gemini to get the final text response
      result = await chat.sendMessage([{
        functionResponse: {
          name: name,
          response: functionResponse
        }
      }]);
    }

    const finalResponseText = result.response.text();
    
    // Check if the AI wants us to navigate based on its response or prior tool call
    let actionCard: any = undefined;
    if (functionCall?.name === 'navigate_to_page' && !finalResponseText.toLowerCase().includes('not found')) {
      const pageName = (functionCall.args as any).page_name.toLowerCase();
      const route = SYSTEM_ROUTES.find(r => r.name.toLowerCase().includes(pageName) || r.keywords.some(k => pageName.includes(k)));
      if (route) {
        actionCard = {
          type: 'navigation',
          title: route.name,
          route: route.href,
          routeLabel: `🚀 Open ${route.name}`,
        };
      }
    }

    return {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      sender: 'assistant',
      text: finalResponseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard,
      suggestedPrompts: ['Show my tasks', 'List all employees', 'Check pending approvals'],
    };

  } catch (error) {
    console.error('Gemini Agent Error:', error);
    return null;
  }
}

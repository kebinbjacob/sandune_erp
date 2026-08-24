import { NextResponse } from 'next/server';
import { processAIQuery } from '@/lib/ai/aiEngine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, currentRoute, userRole, userName, userEmail } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message query is required' }, { status: 400 });
    }

    const response = await processAIQuery({
      query: message,
      history,
      currentRoute,
      userRole,
      userName,
      userEmail,
    });

    return NextResponse.json({ success: true, message: response });
  } catch (error: any) {
    console.error('Error in /api/ai/chat route:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal AI processing error',
      },
      { status: 500 }
    );
  }
}

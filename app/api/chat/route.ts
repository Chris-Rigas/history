import { NextResponse } from 'next/server';
import { askGemini, generateSuggestedQuestions, prepareTimelineContext } from '@/lib/gemini';

type ConversationMessage = {
  role: 'user' | 'model';
  parts: string;
};

type TimelineContext = Parameters<typeof prepareTimelineContext>[0];

type ChatRequestBody = {
  action?: 'suggest';
  question?: string;
  context?: TimelineContext;
  conversationHistory?: ConversationMessage[];
};

function buildContextString(context?: TimelineContext): string {
  if (!context) {
    return '';
  }

  try {
    return prepareTimelineContext(context);
  } catch (error) {
    console.error('Error preparing context:', error);
    return '';
  }
}

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json();
    const { action, question, context, conversationHistory = [] } = body;

    const contextString = buildContextString(context);

    if (action === 'suggest') {
      if (!context) {
        return NextResponse.json(
          { error: 'Context is required to generate suggested questions.' },
          { status: 400 },
        );
      }

      const questions = await generateSuggestedQuestions(contextString);
      return NextResponse.json({ questions });
    }

    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    const answer = await askGemini({
      context: contextString,
      question,
      conversationHistory,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      { error: 'Failed to process the chat request. Please try again later.' },
      { status: 500 },
    );
  }
}

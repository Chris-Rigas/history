import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Get Gemini model with 1M token context window
export const getGeminiModel = () => {
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-pro', // 1M token context window
  });
};

// System prompt for historical Q&A
const HISTORY_TUTOR_PROMPT = `You are a knowledgeable and engaging history tutor. Your role is to answer questions about historical timelines, events, and people based ONLY on the provided context.

Guidelines:
- Use only the information provided in the context
- When referring to dates, events, or people, cite them clearly
- Keep answers concise (3-6 sentences unless more detail is requested)
- If the answer isn't in the provided context, say so politely
- Maintain an educational, engaging tone
- Use specific examples from the context when possible
- Connect events and people to broader historical patterns when relevant

Never make up information or reference anything not in the provided context.`;

interface GeminiChatOptions {
  context: string;
  question: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    parts: string;
  }>;
}

/**
 * Send a question to Gemini with historical context
 */
export async function askGemini(options: GeminiChatOptions): Promise<string> {
  const { context, question, conversationHistory = [] } = options;

  try {
    const model = getGeminiModel();

    // Build the full prompt with context
    const fullPrompt = `${HISTORY_TUTOR_PROMPT}

CONTEXT:
${context}

QUESTION: ${question}

Please provide a clear, concise answer based on the context above.`;

    // If there's conversation history, use chat mode
    if (conversationHistory.length > 0) {
      const chat = model.startChat({
        history: conversationHistory.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.parts }],
        })),
      });

      const result = await chat.sendMessage(fullPrompt);
      return result.response.text();
    }

    // Otherwise, use single completion
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to get response from Gemini. Please try again.');
  }
}

/**
 * Generate suggested questions based on the context
 */
export async function generateSuggestedQuestions(context: string): Promise<string[]> {
  try {
    const model = getGeminiModel();

    const prompt = `Based on the following historical context, generate 5 interesting questions that a curious learner might ask. Questions should be specific to the content and encourage deeper understanding.

CONTEXT:
${context}

Return ONLY the questions, one per line, without numbering or additional text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse questions from response
    const questions = text
      .split('\n')
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && q.includes('?'))
      .slice(0, 5);

    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    // Return fallback questions
    return [
      'What were the most significant events during this period?',
      'Who were the key figures and what roles did they play?',
      'What were the main causes and consequences?',
      'How did this period influence later history?',
      'What are the most interesting aspects of this timeline?',
    ];
  }
}

/**
 * Prepare context string from timeline data
 */
export function prepareTimelineContext(data: {
  timeline: {
    title: string;
    start_year: number;
    end_year: number;
    region?: string | null;
    summary?: string | null;
    interpretation_html?: string | null;
  };
  events?: Array<{
    title: string;
    start_year: number;
    end_year?: number | null;
    summary?: string | null;
    description_html?: string | null;
    tags: string[];
  }>;
  people?: Array<{
    name: string;
    birth_year?: number | null;
    death_year?: number | null;
    bio_short?: string | null;
    bio_long?: string | null;
  }>;
}): string {
  const { timeline, events = [], people = [] } = data;

  let context = `TIMELINE: ${timeline.title}\n`;
  context += `Period: ${timeline.start_year} - ${timeline.end_year}\n`;
  
  if (timeline.region) {
    context += `Region: ${timeline.region}\n`;
  }
  
  if (timeline.summary) {
    context += `\nSummary: ${timeline.summary}\n`;
  }

  if (timeline.interpretation_html) {
    // Strip HTML tags for context
    const interpretation = timeline.interpretation_html.replace(/<[^>]*>/g, ' ').trim();
    context += `\nInterpretation: ${interpretation}\n`;
  }

  // Add events
  if (events.length > 0) {
    context += '\n\nKEY EVENTS:\n';
    events.forEach((event) => {
      context += `\n- ${event.title} (${event.start_year}`;
      if (event.end_year && event.end_year !== event.start_year) {
        context += `-${event.end_year}`;
      }
      context += `)\n`;
      
      if (event.summary) {
        context += `  ${event.summary}\n`;
      }
      
      if (event.description_html) {
        const description = event.description_html.replace(/<[^>]*>/g, ' ').trim();
        context += `  ${description.substring(0, 500)}...\n`;
      }
    });
  }

  // Add people
  if (people.length > 0) {
    context += '\n\nKEY PEOPLE:\n';
    people.forEach((person) => {
      context += `\n- ${person.name}`;
      if (person.birth_year || person.death_year) {
        context += ` (${person.birth_year || '?'} - ${person.death_year || '?'})`;
      }
      context += '\n';
      
      if (person.bio_short) {
        context += `  ${person.bio_short}\n`;
      }
    });
  }

  return context;
}

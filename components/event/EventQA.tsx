'use client';

import { useState, useEffect } from 'react';
import type { Timeline, Event, Person } from '@/lib/database.types';

interface EventQAProps {
  timeline: Timeline;
  event: Event;
  people: Person[];
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function EventQA({ timeline, event, people }: EventQAProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Load suggested questions on mount
  useEffect(() => {
    loadSuggestedQuestions();
  }, []);

  const loadSuggestedQuestions = async () => {
    try {
      setLoadingSuggestions(true);
      
      // Prepare context specific to this event
      const eventContext = {
        timeline: {
          title: timeline.title,
          start_year: timeline.start_year,
          end_year: timeline.end_year,
          region: timeline.region,
          summary: timeline.summary,
        },
        events: [{
          title: event.title,
          start_year: event.start_year,
          end_year: event.end_year,
          summary: event.summary,
          description_html: event.description_html,
          tags: event.tags,
        }],
        people: people.map(p => ({
          name: p.name,
          birth_year: p.birth_year,
          death_year: p.death_year,
          bio_short: p.bio_short,
        })),
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest',
          context: eventContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      // Set event-specific fallback questions
      setSuggestedQuestions([
        `What were the main causes of ${event.title}?`,
        `What were the immediate consequences of this event?`,
        `Who were the key people involved and what roles did they play?`,
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion('');
    
    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userQuestion },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Prepare event-specific context
      const eventContext = {
        timeline: {
          title: timeline.title,
          start_year: timeline.start_year,
          end_year: timeline.end_year,
          region: timeline.region,
          summary: timeline.summary,
        },
        events: [{
          title: event.title,
          start_year: event.start_year,
          end_year: event.end_year,
          summary: event.summary,
          description_html: event.description_html,
          tags: event.tags,
        }],
        people: people.map(p => ({
          name: p.name,
          birth_year: p.birth_year,
          death_year: p.death_year,
          bio_short: p.bio_short,
          bio_long: p.bio_long,
        })),
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuestion,
          context: eventContext,
          conversationHistory: messages.map((msg) => ({
            role: msg.role,
            parts: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add model response
      setMessages([
        ...newMessages,
        { role: 'model', content: data.answer },
      ]);
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages([
        ...newMessages,
        {
          role: 'model',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (suggestedQ: string) => {
    setQuestion(suggestedQ);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Ask About This Event
        </h2>
        <p className="text-gray-600">
          Have questions about {event.title}? Get AI-powered insights based on the event details.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="p-6 border-b border-gray-200 max-h-96 overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'History Tutor'}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggested Questions */}
        {messages.length === 0 && !loadingSuggestions && suggestedQuestions.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Suggested Questions:
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="w-full text-left px-4 py-3 bg-parchment-50 hover:bg-parchment-100 rounded-lg text-gray-700 text-sm transition-colors border border-parchment-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex space-x-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this event..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  width={20}
                  height={20}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                'Ask'
              )}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            Answers are generated by AI based on the event content and may not be perfect.
          </p>
        </form>
      </div>
    </div>
  );
}

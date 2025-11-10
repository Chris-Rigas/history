import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Client-side Supabase client (uses anon key, respects RLS)
export const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side Supabase client (uses service role key, bypasses RLS)
// Only use this in server components, API routes, or generation scripts
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper to get the appropriate client based on environment
export function getSupabaseClient(isServer: boolean = false) {
  return isServer ? supabaseAdmin : supabaseClient;
}

// Type-safe table helpers
export const Tables = {
  Timelines: 'timelines',
  Events: 'events',
  People: 'people',
  TimelineEvents: 'timeline_events',
  EventPeople: 'event_people',
  TimelinePeople: 'timeline_people',
} as const;

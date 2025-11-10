// Database types generated from Supabase schema
// These types match the schema.sql structure

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      timelines: {
        Row: {
          id: string;
          title: string;
          slug: string;
          start_year: number;
          end_year: number;
          region: string | null;
          summary: string | null;
          interpretation_html: string | null;
          map_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          start_year: number;
          end_year: number;
          region?: string | null;
          summary?: string | null;
          interpretation_html?: string | null;
          map_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          start_year?: number;
          end_year?: number;
          region?: string | null;
          summary?: string | null;
          interpretation_html?: string | null;
          map_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          start_year: number;
          end_year: number | null;
          location: string | null;
          type: string | null;
          tags: string[];
          importance: number | null;
          summary: string | null;
          description_html: string | null;
          significance_html: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          start_year: number;
          end_year?: number | null;
          location?: string | null;
          type?: string | null;
          tags?: string[];
          importance?: number | null;
          summary?: string | null;
          description_html?: string | null;
          significance_html?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          start_year?: number;
          end_year?: number | null;
          location?: string | null;
          type?: string | null;
          tags?: string[];
          importance?: number | null;
          summary?: string | null;
          description_html?: string | null;
          significance_html?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      people: {
        Row: {
          id: string;
          name: string;
          slug: string;
          birth_year: number | null;
          death_year: number | null;
          bio_short: string | null;
          bio_long: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          birth_year?: number | null;
          death_year?: number | null;
          bio_short?: string | null;
          bio_long?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          birth_year?: number | null;
          death_year?: number | null;
          bio_short?: string | null;
          bio_long?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      timeline_events: {
        Row: {
          timeline_id: string;
          event_id: string;
          display_order: number | null;
          created_at: string;
        };
        Insert: {
          timeline_id: string;
          event_id: string;
          display_order?: number | null;
          created_at?: string;
        };
        Update: {
          timeline_id?: string;
          event_id?: string;
          display_order?: number | null;
          created_at?: string;
        };
      };
      event_people: {
        Row: {
          event_id: string;
          person_id: string;
          role: string | null;
          created_at: string;
        };
        Insert: {
          event_id: string;
          person_id: string;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          person_id?: string;
          role?: string | null;
          created_at?: string;
        };
      };
      timeline_people: {
        Row: {
          timeline_id: string;
          person_id: string;
          role: string | null;
          display_order: number | null;
          created_at: string;
        };
        Insert: {
          timeline_id: string;
          person_id: string;
          role?: string | null;
          display_order?: number | null;
          created_at?: string;
        };
        Update: {
          timeline_id?: string;
          person_id?: string;
          role?: string | null;
          display_order?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for working with the database
export type Timeline = Database['public']['Tables']['timelines']['Row'];
export type TimelineInsert = Database['public']['Tables']['timelines']['Insert'];
export type TimelineUpdate = Database['public']['Tables']['timelines']['Update'];

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type Person = Database['public']['Tables']['people']['Row'];
export type PersonInsert = Database['public']['Tables']['people']['Insert'];
export type PersonUpdate = Database['public']['Tables']['people']['Update'];

export type TimelineEvent = Database['public']['Tables']['timeline_events']['Row'];
export type EventPerson = Database['public']['Tables']['event_people']['Row'];
export type TimelinePerson = Database['public']['Tables']['timeline_people']['Row'];

// Extended types with relations for use in queries
export type TimelineWithEvents = Timeline & {
  events: Event[];
};

export type TimelineWithPeople = Timeline & {
  people: Person[];
};

export type EventWithPeople = Event & {
  people: Person[];
};

export type EventWithTimeline = Event & {
  timeline: Timeline;
};

export type PersonWithEvents = Person & {
  events: Event[];
};

export type PersonWithTimeline = Person & {
  timeline: Timeline;
};

// Full timeline data with all relations
export type TimelineFull = Timeline & {
  events: Event[];
  people: Person[];
};

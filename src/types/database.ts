export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          character_config: Json | null
          created_at: string | null
          id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          character_config?: Json | null
          created_at?: string | null
          id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          character_config?: Json | null
          created_at?: string | null
          id?: string
          username?: string
        }
      }
      sessions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          last_seen: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          last_seen?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          last_seen?: string | null
          user_id?: string
        }
      }
      world_positions: {
        Row: {
          direction: string | null
          map: string | null
          updated_at: string | null
          user_id: string
          x: number | null
          y: number | null
        }
        Insert: {
          direction?: string | null
          map?: string | null
          updated_at?: string | null
          user_id: string
          x?: number | null
          y?: number | null
        }
        Update: {
          direction?: string | null
          map?: string | null
          updated_at?: string | null
          user_id?: string
          x?: number | null
          y?: number | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      active_session_count: { Args: Record<string, never>; Returns: number }
      expire_sessions: { Args: Record<string, never>; Returns: undefined }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type WorldPosition = Database['public']['Tables']['world_positions']['Row']

export interface MessageWithProfile extends Message {
  profile: Profile
}

export interface CharacterConfig {
  skinTone: string
  hairColor: string
  hairStyle: number
  outfitColor: string
  pantsColor: string
  hatIndex: number // -1 = no hat
}

export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  skinTone: '#FDBCB4',
  hairColor: '#4A3728',
  hairStyle: 0,
  outfitColor: '#5A7A3A',
  pantsColor: '#8B5E3C',
  hatIndex: -1,
}

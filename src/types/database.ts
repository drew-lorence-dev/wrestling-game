export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; avatar_url: string | null; created_at: string }
        Insert: { id: string; username: string; avatar_url?: string | null; created_at?: string }
        Update: { username?: string; avatar_url?: string | null }
      }
      leagues: {
        Row: {
          id: string; name: string; commissioner_id: string; invite_code: string
          max_gms: number; roster_size: number; active_roster_size: number
          waiver_type: string; created_at: string
        }
        Insert: {
          id?: string; name: string; commissioner_id: string; invite_code?: string
          max_gms?: number; roster_size?: number; active_roster_size?: number
          waiver_type?: string; created_at?: string
        }
        Update: { name?: string; max_gms?: number; roster_size?: number; active_roster_size?: number }
      }
      league_members: {
        Row: { id: string; league_id: string; profile_id: string; display_name: string; joined_at: string }
        Insert: { id?: string; league_id: string; profile_id: string; display_name: string; joined_at?: string }
        Update: { display_name?: string }
      }
      wrestlers: {
        Row: {
          id: string; name: string; slug: string; image_url: string | null
          gender: string; is_active: boolean; is_custom: boolean; created_at: string
        }
        Insert: {
          id?: string; name: string; slug: string; image_url?: string | null
          gender?: string; is_active?: boolean; is_custom?: boolean; created_at?: string
        }
        Update: { name?: string; image_url?: string | null; is_active?: boolean }
      }
      quarters: {
        Row: {
          id: string; league_id: string; quarter_number: number; year: number
          start_date: string; end_date: string; status: string
          winner_member_id: string | null; created_at: string
        }
        Insert: {
          id?: string; league_id: string; quarter_number: number; year: number
          start_date: string; end_date: string; status?: string
          winner_member_id?: string | null; created_at?: string
        }
        Update: { status?: string; winner_member_id?: string | null }
      }
      draft_sessions: {
        Row: {
          id: string; quarter_id: string; status: string; current_pick: number
          pick_deadline: string | null; snake_order: Json; started_at: string | null; completed_at: string | null
        }
        Insert: {
          id?: string; quarter_id: string; status?: string; current_pick?: number
          pick_deadline?: string | null; snake_order?: Json; started_at?: string | null; completed_at?: string | null
        }
        Update: { status?: string; current_pick?: number; pick_deadline?: string | null; completed_at?: string | null }
      }
      draft_picks: {
        Row: {
          id: string; draft_session_id: string; quarter_id: string; pick_number: number
          round: number; pick_in_round: number; member_id: string
          wrestler_id: string | null; is_auto_pick: boolean; picked_at: string | null
        }
        Insert: {
          id?: string; draft_session_id: string; quarter_id: string; pick_number: number
          round: number; pick_in_round: number; member_id: string
          wrestler_id?: string | null; is_auto_pick?: boolean; picked_at?: string | null
        }
        Update: { wrestler_id?: string | null; is_auto_pick?: boolean; picked_at?: string | null }
      }
      rosters: {
        Row: {
          id: string; quarter_id: string; member_id: string; wrestler_id: string
          acquired_via: string; added_at: string; dropped_at: string | null
        }
        Insert: {
          id?: string; quarter_id: string; member_id: string; wrestler_id: string
          acquired_via?: string; added_at?: string; dropped_at?: string | null
        }
        Update: { dropped_at?: string | null }
      }
      weeks: {
        Row: {
          id: string; quarter_id: string; week_number: number
          start_date: string; end_date: string; lineup_lock_at: string
        }
        Insert: {
          id?: string; quarter_id: string; week_number: number
          start_date: string; end_date: string; lineup_lock_at: string
        }
        Update: { lineup_lock_at?: string }
      }
      lineups: {
        Row: {
          id: string; week_id: string; member_id: string
          wrestler_id: string; slot: string; locked_at: string | null
        }
        Insert: {
          id?: string; week_id: string; member_id: string
          wrestler_id: string; slot?: string; locked_at?: string | null
        }
        Update: { slot?: string; locked_at?: string | null }
      }
      shows: {
        Row: {
          id: string; name: string; show_type: string; air_date: string
          scoring_multiplier: number; scraped_at: string | null
        }
        Insert: {
          id?: string; name: string; show_type: string; air_date: string
          scoring_multiplier?: number; scraped_at?: string | null
        }
        Update: { scraped_at?: string | null; scoring_multiplier?: number }
      }
      matches: {
        Row: {
          id: string; show_id: string; match_order: number; match_type: string
          title_match: boolean; title_name: string | null; duration_seconds: number | null; notes: string | null
        }
        Insert: {
          id?: string; show_id: string; match_order: number; match_type?: string
          title_match?: boolean; title_name?: string | null; duration_seconds?: number | null; notes?: string | null
        }
        Update: { duration_seconds?: number | null; notes?: string | null }
      }
      match_participants: {
        Row: {
          id: string; match_id: string; wrestler_id: string; team: number | null
          outcome: string; win_method: string | null; is_title_change: boolean
        }
        Insert: {
          id?: string; match_id: string; wrestler_id: string; team?: number | null
          outcome: string; win_method?: string | null; is_title_change?: boolean
        }
        Update: { outcome?: string; win_method?: string | null; is_title_change?: boolean }
      }
      segments: {
        Row: { id: string; show_id: string; segment_type: string; description: string | null }
        Insert: { id?: string; show_id: string; segment_type: string; description?: string | null }
        Update: { description?: string | null }
      }
      segment_participants: {
        Row: { id: string; segment_id: string; wrestler_id: string }
        Insert: { id?: string; segment_id: string; wrestler_id: string }
        Update: Record<string, never>
      }
      scoring_rules: {
        Row: { id: string; league_id: string; action: string; points: number; description: string | null }
        Insert: { id?: string; league_id: string; action: string; points: number; description?: string | null }
        Update: { points?: number; description?: string | null }
      }
      wrestler_scores: {
        Row: {
          id: string; week_id: string; show_id: string; wrestler_id: string
          points_breakdown: Json; total_points: number; calculated_at: string
        }
        Insert: {
          id?: string; week_id: string; show_id: string; wrestler_id: string
          points_breakdown?: Json; total_points?: number; calculated_at?: string
        }
        Update: { points_breakdown?: Json; total_points?: number }
      }
      member_scores: {
        Row: { id: string; week_id: string; member_id: string; total_points: number; calculated_at: string }
        Insert: { id?: string; week_id: string; member_id: string; total_points?: number; calculated_at?: string }
        Update: { total_points?: number }
      }
      waiver_requests: {
        Row: {
          id: string; week_id: string; member_id: string; add_wrestler_id: string
          drop_wrestler_id: string | null; priority: number; status: string
          processed_at: string | null; fail_reason: string | null; created_at: string
        }
        Insert: {
          id?: string; week_id: string; member_id: string; add_wrestler_id: string
          drop_wrestler_id?: string | null; priority: number; status?: string
          processed_at?: string | null; fail_reason?: string | null; created_at?: string
        }
        Update: { status?: string; processed_at?: string | null; fail_reason?: string | null }
      }
      trades: {
        Row: {
          id: string; quarter_id: string; proposing_member_id: string; receiving_member_id: string
          status: string; commissioner_reviewed: boolean; proposed_at: string; resolved_at: string | null
        }
        Insert: {
          id?: string; quarter_id: string; proposing_member_id: string; receiving_member_id: string
          status?: string; commissioner_reviewed?: boolean; proposed_at?: string; resolved_at?: string | null
        }
        Update: { status?: string; commissioner_reviewed?: boolean; resolved_at?: string | null }
      }
      trade_items: {
        Row: { id: string; trade_id: string; from_member_id: string; wrestler_id: string }
        Insert: { id?: string; trade_id: string; from_member_id: string; wrestler_id: string }
        Update: Record<string, never>
      }
      gm_belts: {
        Row: { id: string; quarter_id: string; member_id: string; total_points: number; awarded_at: string }
        Insert: { id?: string; quarter_id: string; member_id: string; total_points: number; awarded_at?: string }
        Update: Record<string, never>
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type League = Database['public']['Tables']['leagues']['Row']
export type LeagueMember = Database['public']['Tables']['league_members']['Row']
export type Wrestler = Database['public']['Tables']['wrestlers']['Row']
export type Quarter = Database['public']['Tables']['quarters']['Row']
export type DraftSession = Database['public']['Tables']['draft_sessions']['Row']
export type DraftPick = Database['public']['Tables']['draft_picks']['Row']
export type Roster = Database['public']['Tables']['rosters']['Row']
export type Week = Database['public']['Tables']['weeks']['Row']
export type Lineup = Database['public']['Tables']['lineups']['Row']
export type Show = Database['public']['Tables']['shows']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type MatchParticipant = Database['public']['Tables']['match_participants']['Row']
export type Segment = Database['public']['Tables']['segments']['Row']
export type SegmentParticipant = Database['public']['Tables']['segment_participants']['Row']
export type ScoringRule = Database['public']['Tables']['scoring_rules']['Row']
export type WrestlerScore = Database['public']['Tables']['wrestler_scores']['Row']
export type MemberScore = Database['public']['Tables']['member_scores']['Row']
export type WaiverRequest = Database['public']['Tables']['waiver_requests']['Row']
export type Trade = Database['public']['Tables']['trades']['Row']
export type TradeItem = Database['public']['Tables']['trade_items']['Row']
export type GmBelt = Database['public']['Tables']['gm_belts']['Row']

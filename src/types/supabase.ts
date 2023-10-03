export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          coop_losses: number | null
          coop_wins: number | null
          country: string | null
          created_at: string | null
          dash_losses: number | null
          dash_wins: number | null
          id: string
          streak: number | null
          username: string | null
        }
        Insert: {
          coop_losses?: number | null
          coop_wins?: number | null
          country?: string | null
          created_at?: string | null
          dash_losses?: number | null
          dash_wins?: number | null
          id: string
          streak?: number | null
          username?: string | null
        }
        Update: {
          coop_losses?: number | null
          coop_wins?: number | null
          country?: string | null
          created_at?: string | null
          dash_losses?: number | null
          dash_wins?: number | null
          id?: string
          streak?: number | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      solutions: {
        Row: {
          created_at: string | null
          id: number
          word: string
          wordle_solution: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          word: string
          wordle_solution?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          word?: string
          wordle_solution?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      rankings: {
        Row: {
          country: string | null
          id: string | null
          losses: number | null
          rank: number | null
          streak: number | null
          username: string | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      is_not_updating_stats: {
        Args: {
          _id: string
          _dash_wins: number
          _dash_losses: number
          _coop_wins: number
          _coop_losses: number
          _streak: number
        }
        Returns: boolean
      }
      random_solution: {
        Args: Record<PropertyKey, never>
        Returns: {
          word: string
          wordle_solution: string
        }[]
      }
      set_loss: {
        Args: {
          user_id: string
          game_type: boolean
        }
        Returns: undefined
      }
      set_win: {
        Args: {
          user_id: string
          game_type: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


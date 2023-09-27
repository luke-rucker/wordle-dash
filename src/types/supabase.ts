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
          country: string | null
          created_at: string | null
          id: string
          username: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id: string
          username?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
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
      [_ in never]: never
    }
    Functions: {
      random_solution: {
        Args: Record<PropertyKey, never>
        Returns: string
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


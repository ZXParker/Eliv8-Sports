export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          email: string[]
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string[]
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string[]
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sports: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      access_codes: {
        Row: {
          id: string
          code: string
          organization_id: string | null
          role: 'admin' | 'coach' | 'athlete'
          sport_id: string | null
          gender: 'male' | 'female' | null
          created_by: string
          created_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          id?: string
          code: string
          organization_id?: string | null
          role: 'admin' | 'coach' | 'athlete'
          sport_id?: string | null
          gender?: 'male' | 'female' | null
          created_by: string
          created_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          id?: string
          code?: string
          organization_id?: string | null
          role?: 'admin' | 'coach' | 'athlete'
          sport_id?: string | null
          gender?: 'male' | 'female' | null
          created_by?: string
          created_at?: string
          used_at?: string | null
          used_by?: string | null
        }
      }
      user_sports: {
        Row: {
          id: string
          user_id: string
          sport_id: string
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sport_id: string
          organization_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sport_id?: string
          organization_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'coach' | 'athlete'
          organization_id: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'coach' | 'athlete'
          organization_id?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'coach' | 'athlete'
          organization_id?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

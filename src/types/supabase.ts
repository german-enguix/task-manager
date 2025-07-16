// Este archivo será generado automáticamente por Supabase CLI
// Por ahora, definimos una estructura básica que coincida con nuestros tipos existentes

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          status: 'not_started' | 'in_progress' | 'paused' | 'completed'
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          estimated_duration: number | null
          project_name: string
          location: string
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'not_started' | 'in_progress' | 'paused' | 'completed'
          priority: 'low' | 'medium' | 'high'
          due_date?: string | null
          estimated_duration?: number | null
          project_name: string
          location: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'not_started' | 'in_progress' | 'paused' | 'completed'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          estimated_duration?: number | null
          project_name?: string
          location?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          title: string
          description: string
          is_completed: boolean
          order: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          description: string
          is_completed?: boolean
          order: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          description?: string
          is_completed?: boolean
          order?: number
          created_at?: string
          completed_at?: string | null
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          category?: string | null
          created_at?: string
        }
      }
      task_tags: {
        Row: {
          task_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          task_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          task_id?: string
          tag_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_status: 'not_started' | 'in_progress' | 'paused' | 'completed'
      priority_level: 'low' | 'medium' | 'high'
      user_role: 'admin' | 'user'
    }
  }
} 
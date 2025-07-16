// Este archivo será generado automáticamente por Supabase CLI
// Por ahora, definimos una estructura básica que coincida con nuestros tipos existentes

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'user' | 'admin'
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
          project_id: string | null
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
          project_id?: string | null
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
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          status: 'programmed' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical'
          location: string
          start_date: string
          end_date: string | null
          estimated_duration: number
          actual_duration: number | null
          total_tasks: number
          completed_tasks: number
          completion_percentage: number
          supervisor_name: string
          supervisor_email: string
          assigned_team: string[]
          required_resources: string[]
          created_at: string
          updated_at: string
          created_by: string | null
          assigned_to: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          status?: 'programmed' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical'
          location: string
          start_date: string
          end_date?: string | null
          estimated_duration: number
          actual_duration?: number | null
          total_tasks?: number
          completed_tasks?: number
          completion_percentage?: number
          supervisor_name: string
          supervisor_email: string
          assigned_team?: string[]
          required_resources?: string[]
          created_at?: string
          updated_at?: string
          created_by?: string | null
          assigned_to?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          status?: 'programmed' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          location?: string
          start_date?: string
          end_date?: string | null
          estimated_duration?: number
          actual_duration?: number | null
          total_tasks?: number
          completed_tasks?: number
          completion_percentage?: number
          supervisor_name?: string
          supervisor_email?: string
          assigned_team?: string[]
          required_resources?: string[]
          created_at?: string
          updated_at?: string
          created_by?: string | null
          assigned_to?: string | null
        }
      }
      supervisor_observations: {
        Row: {
          id: string
          project_id: string
          supervisor_name: string
          supervisor_role: string
          observation: string
          date: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          is_resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          resolution: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          supervisor_name: string
          supervisor_role: string
          observation: string
          date?: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          resolution?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          supervisor_name?: string
          supervisor_role?: string
          observation?: string
          date?: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          resolution?: string | null
          created_at?: string
        }
      }
      work_days: {
        Row: {
          id: string
          user_id: string
          date: string
          status: 'pending' | 'in_progress' | 'completed'
          planned_start_time: string | null
          planned_end_time: string | null
          planned_duration: number | null
          actual_start_time: string | null
          actual_end_time: string | null
          actual_duration: number
          timesheet_status: 'not_started' | 'in_progress' | 'paused' | 'completed'
          current_session_start: string | null
          total_break_time: number
          notes: string | null
          location_check_in: string | null
          location_check_out: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          status?: 'pending' | 'in_progress' | 'completed'
          planned_start_time?: string | null
          planned_end_time?: string | null
          planned_duration?: number | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          actual_duration?: number
          timesheet_status?: 'not_started' | 'in_progress' | 'paused' | 'completed'
          current_session_start?: string | null
          total_break_time?: number
          notes?: string | null
          location_check_in?: string | null
          location_check_out?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          status?: 'pending' | 'in_progress' | 'completed'
          planned_start_time?: string | null
          planned_end_time?: string | null
          planned_duration?: number | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          actual_duration?: number
          timesheet_status?: 'not_started' | 'in_progress' | 'paused' | 'completed'
          current_session_start?: string | null
          total_break_time?: number
          notes?: string | null
          location_check_in?: string | null
          location_check_out?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_sessions: {
        Row: {
          id: string
          work_day_id: string
          user_id: string
          start_time: string
          end_time: string | null
          duration: number | null
          session_type: string
          start_location: string | null
          end_location: string | null
          task_id: string | null
          task_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          work_day_id: string
          user_id: string
          start_time: string
          end_time?: string | null
          duration?: number | null
          session_type?: string
          start_location?: string | null
          end_location?: string | null
          task_id?: string | null
          task_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          work_day_id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          duration?: number | null
          session_type?: string
          start_location?: string | null
          end_location?: string | null
          task_id?: string | null
          task_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_notifications: {
        Row: {
          id: string
          user_id: string
          work_day_id: string | null
          title: string
          message: string
          type: string
          is_read: boolean
          is_urgent: boolean
          action_required: boolean
          action_type: string | null
          action_data: any | null
          scheduled_for: string | null
          expires_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          work_day_id?: string | null
          title: string
          message: string
          type?: string
          is_read?: boolean
          is_urgent?: boolean
          action_required?: boolean
          action_type?: string | null
          action_data?: any | null
          scheduled_for?: string | null
          expires_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          work_day_id?: string | null
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          is_urgent?: boolean
          action_required?: boolean
          action_type?: string | null
          action_data?: any | null
          scheduled_for?: string | null
          expires_at?: string | null
          read_at?: string | null
          created_at?: string
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
      project_status: 'programmed' | 'in_progress' | 'completed' | 'cancelled'
      priority_level: 'low' | 'medium' | 'high' | 'critical'
      user_role: 'admin' | 'user'
      timesheet_status: 'not_started' | 'in_progress' | 'paused' | 'completed'
      day_status: 'pending' | 'in_progress' | 'completed'
    }
  }
} 
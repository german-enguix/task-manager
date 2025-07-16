import { supabase } from '@/lib/supabase'
import { Task, Tag } from '@/types'
import { Database } from '@/types/supabase'

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert'] 
type TagRow = Database['public']['Tables']['tags']['Row']

export class SupabaseService {
  
  // ========== TASKS ==========
  
  async getTasks(userId?: string): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          subtasks(*),
          task_tags(
            tags(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('assigned_to', userId)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Transformar datos de Supabase a nuestros tipos
      return data?.map(this.transformTaskFromSupabase) || []
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks(*),
          task_tags(
            tags(*)
          )
        `)
        .eq('id', taskId)
        .single()

      if (error) throw error
      
      return data ? this.transformTaskFromSupabase(data) : null
    } catch (error) {
      console.error('Error fetching task:', error)
      throw error
    }
  }

  async createTask(task: Omit<Task, 'id' | 'subtasks' | 'tags'>): Promise<Task> {
    try {
      const taskInsert: TaskInsert = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate?.toISOString() || null,
        estimated_duration: task.estimatedDuration || null,
        project_name: task.projectName,
        location: task.location,
        assigned_to: task.assignedTo || null,
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskInsert)
        .select()
        .single()

      if (error) throw error
      
      return this.transformTaskFromSupabase(data)
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const taskUpdate: Partial<TaskRow> = {
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.status && { status: updates.status }),
        ...(updates.priority && { priority: updates.priority }),
        ...(updates.dueDate && { due_date: updates.dueDate.toISOString() }),
        ...(updates.estimatedDuration && { estimated_duration: updates.estimatedDuration }),
        ...(updates.projectName && { project_name: updates.projectName }),
        ...(updates.location && { location: updates.location }),
        ...(updates.assignedTo && { assigned_to: updates.assignedTo }),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(taskUpdate)
        .eq('id', taskId)
        .select(`
          *,
          subtasks(*),
          task_tags(
            tags(*)
          )
        `)
        .single()

      if (error) throw error
      
      return this.transformTaskFromSupabase(data)
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  // ========== TAGS ==========
  
  async getTags(): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) throw error
      
      return data?.map(this.transformTagFromSupabase) || []
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    }
  }

  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: tag.name,
          color: tag.color,
          category: tag.category || null,
        })
        .select()
        .single()

      if (error) throw error
      
      return this.transformTagFromSupabase(data)
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  }

  // ========== HELPERS ==========
  
  private transformTaskFromSupabase(data: any): Task {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      estimatedDuration: data.estimated_duration || undefined,
      projectName: data.project_name,
      location: data.location,
      assignedTo: data.assigned_to || undefined,
      subtasks: data.subtasks?.map((subtask: any) => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description,
        isCompleted: subtask.is_completed,
        order: subtask.order,
        createdAt: new Date(subtask.created_at),
        completedAt: subtask.completed_at ? new Date(subtask.completed_at) : undefined,
      })) || [],
      tags: data.task_tags?.map((tt: any) => this.transformTagFromSupabase(tt.tags)) || [],
      // Temporal: mantenemos campos que aún no hemos migrado
      timer: {
        totalElapsed: 0,
        isRunning: false,
        sessions: [],
      },
      requiredEvidences: [],
      evidences: [],
      comments: [],
      problemReports: [],
    }
  }

  private transformTagFromSupabase(data: TagRow): Tag {
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      category: data.category || undefined,
    }
  }
}

// Instancia singleton del servicio
export const supabaseService = new SupabaseService() 
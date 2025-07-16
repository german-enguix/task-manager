import { supabase } from '@/lib/supabase'
import { Task, Tag, Project, SupervisorObservation, WorkDay, TimesheetStatus, DayStatus } from '@/types'
import { Database } from '@/types/supabase'

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert'] 
type TagRow = Database['public']['Tables']['tags']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type SupervisorObservationRow = Database['public']['Tables']['supervisor_observations']['Row']
type WorkDayRow = Database['public']['Tables']['work_days']['Row']
type WorkDayInsert = Database['public']['Tables']['work_days']['Insert']
type WorkSessionRow = Database['public']['Tables']['work_sessions']['Row']
type WorkNotificationRow = Database['public']['Tables']['work_notifications']['Row']

export class SupabaseService {
  
  // Exponer cliente de Supabase para uso en otros lugares si es necesario
  public supabase = supabase;
  
  // ========== AUTHENTICATION & USERS ==========
  
  async getCurrentUser(): Promise<any> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (!user) return null;
      
      // Obtener información adicional del usuario desde la tabla profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      return {
        ...user,
        profile: userProfile || null,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  async getUserProfile(userId?: string): Promise<any> {
    try {
      // Si no se proporciona userId, usar el usuario actual
      const currentUser = await this.getCurrentUser();
      const targetUserId = userId || currentUser?.id;
      
      if (!targetUserId) {
        throw new Error('No user ID provided and no current user found');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        name: data.full_name,
        email: currentUser?.email || 'unknown@taskapp.com',
        role: data.role,
        avatar_url: data.avatar_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: {
    name?: string;
    role?: string;
  }): Promise<any> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name !== undefined) {
        updateData.full_name = updates.name;
      }

      if (updates.role !== undefined) {
        updateData.role = updates.role;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      
      console.log('✅ User profile updated:', userId);
      
      return {
        id: data.id,
        name: data.full_name,
        role: data.role,
        avatar_url: data.avatar_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('✅ User signed in:', data.user?.email);
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, name: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;
      
      // El perfil se crea automáticamente con el trigger on_auth_user_created
      // Pero podemos actualizar información adicional si es necesario
      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            full_name: name,
            email: email,
          })
          .eq('id', data.user.id);
      }
      
      console.log('✅ User signed up:', email);
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      console.log('✅ User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      console.log('✅ Password reset email sent to:', email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }



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
      return data?.map((task) => this.transformTaskFromSupabase(task)) || []
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

  async updateSubtask(subtaskId: string, updates: { isCompleted?: boolean; completedAt?: Date }): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.isCompleted !== undefined) {
        updateData.is_completed = updates.isCompleted;
      }
      
      if (updates.completedAt !== undefined) {
        updateData.completed_at = updates.completedAt.toISOString();
      } else if (updates.isCompleted === false) {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('subtasks')
        .update(updateData)
        .eq('id', subtaskId);

      if (error) throw error;
      
      console.log('✅ Subtask updated:', subtaskId);
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      
      console.log('✅ Task status updated:', taskId, status);
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // ========== PROJECTS ==========
  
  async getProjects(userId?: string): Promise<Project[]> {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          supervisor_observations(*)
        `)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('assigned_to', userId)
      }

      const { data, error } = await query

      if (error) throw error
      
      return data?.map(this.transformProjectFromSupabase) || []
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          supervisor_observations(*),
          tasks(
            id, 
            title, 
            description, 
            status, 
            priority, 
            due_date, 
            estimated_duration, 
            location, 
            assigned_to,
            subtasks(*)
          )
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error
      
      return data ? this.transformProjectFromSupabase(data) : null
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'observations' | 'taskIds' | 'totalTasks' | 'completedTasks' | 'completionPercentage' | 'actualDuration'>): Promise<Project> {
    try {
      const projectInsert: ProjectInsert = {
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        location: project.location,
        start_date: project.startDate.toISOString(),
        end_date: project.endDate?.toISOString() || null,
        estimated_duration: project.estimatedDuration,
        supervisor_name: project.supervisorName,
        supervisor_email: project.supervisorEmail,
        assigned_team: project.assignedTeam,
        required_resources: project.requiredResources,
        created_by: project.createdBy,
        assigned_to: project.assignedTo || null,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(projectInsert)
        .select(`
          *,
          supervisor_observations(*)
        `)
        .single()

      if (error) throw error
      
      return this.transformProjectFromSupabase(data)
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    try {
      const projectUpdate: Partial<ProjectRow> = {
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.status && { status: updates.status }),
        ...(updates.priority && { priority: updates.priority }),
        ...(updates.location && { location: updates.location }),
        ...(updates.startDate && { start_date: updates.startDate.toISOString() }),
        ...(updates.endDate && { end_date: updates.endDate.toISOString() }),
        ...(updates.estimatedDuration && { estimated_duration: updates.estimatedDuration }),
        ...(updates.actualDuration && { actual_duration: updates.actualDuration }),
        ...(updates.supervisorName && { supervisor_name: updates.supervisorName }),
        ...(updates.supervisorEmail && { supervisor_email: updates.supervisorEmail }),
        ...(updates.assignedTeam && { assigned_team: updates.assignedTeam }),
        ...(updates.requiredResources && { required_resources: updates.requiredResources }),
        ...(updates.assignedTo && { assigned_to: updates.assignedTo }),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('projects')
        .update(projectUpdate)
        .eq('id', projectId)
        .select(`
          *,
          supervisor_observations(*)
        `)
        .single()

      if (error) throw error
      
      return this.transformProjectFromSupabase(data)
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async createSupervisorObservation(observation: Omit<SupervisorObservation, 'id' | 'createdAt'>): Promise<SupervisorObservation> {
    try {
      const { data, error } = await supabase
        .from('supervisor_observations')
        .insert({
          project_id: observation.id, // Este campo se usa como project_id en la DB
          supervisor_name: observation.supervisorName,
          supervisor_role: observation.supervisorRole,
          observation: observation.observation,
          date: observation.date.toISOString(),
          priority: observation.priority,
          is_resolved: observation.isResolved,
          resolved_at: observation.resolvedAt?.toISOString() || null,
          resolved_by: observation.resolvedBy || null,
          resolution: observation.resolution || null,
        })
        .select()
        .single()

      if (error) throw error
      
      return this.transformObservationFromSupabase(data)
    } catch (error) {
      console.error('Error creating supervisor observation:', error)
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
      
      return data?.map((tag) => this.transformTagFromSupabase(tag)) || []
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

  // ========== TIMESHEET & WORK DAYS ==========
  
  async getCurrentWorkDay(userId: string, date?: Date): Promise<WorkDay | null> {
    try {
      const targetDate = date || new Date();
      const dateString = targetDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('work_days')
        .select(`
          *,
          work_sessions(*),
          work_notifications(*)
        `)
        .eq('user_id', userId)
        .eq('date', dateString)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return data ? this.transformWorkDayFromSupabase(data) : null;
    } catch (error) {
      console.error('Error fetching work day:', error);
      throw error;
    }
  }

  async getOrCreateWorkDay(userId: string, date?: Date): Promise<WorkDay> {
    try {
      const targetDate = date || new Date();
      const dateString = targetDate.toISOString().split('T')[0];
      
      // Intentar obtener jornada existente
      let workDay = await this.getCurrentWorkDay(userId, targetDate);
      
      if (!workDay) {
        // Crear nueva jornada
        const workDayInsert: WorkDayInsert = {
          user_id: userId,
          date: dateString,
          planned_start_time: '08:00:00',
          planned_end_time: '17:00:00',
          planned_duration: 540, // 9 horas en minutos
        };

        const { data, error } = await supabase
          .from('work_days')
          .insert(workDayInsert)
          .select(`
            *,
            work_sessions(*),
            work_notifications(*)
          `)
          .single();

        if (error) throw error;
        
        workDay = this.transformWorkDayFromSupabase(data);
        console.log('✅ Work day created:', workDay.id);
      }
      
      return workDay;
    } catch (error) {
      console.error('Error getting or creating work day:', error);
      throw error;
    }
  }

  async updateWorkDayTimesheet(
    workDayId: string, 
    updates: {
      status?: TimesheetStatus;
      currentSessionStart?: Date | null;
      actualStartTime?: Date;
      actualEndTime?: Date;
      notes?: string;
    }
  ): Promise<WorkDay> {
    try {
      const updateData: any = {};
      
      if (updates.status !== undefined) {
        updateData.timesheet_status = updates.status;
      }
      
      if (updates.currentSessionStart !== undefined) {
        updateData.current_session_start = updates.currentSessionStart?.toISOString() || null;
      }
      
      if (updates.actualStartTime) {
        updateData.actual_start_time = updates.actualStartTime.toISOString();
      }
      
      if (updates.actualEndTime) {
        updateData.actual_end_time = updates.actualEndTime.toISOString();
      }
      
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('work_days')
        .update(updateData)
        .eq('id', workDayId)
        .select(`
          *,
          work_sessions(*),
          work_notifications(*)
        `)
        .single();

      if (error) throw error;
      
      const workDay = this.transformWorkDayFromSupabase(data);
      console.log('✅ Work day timesheet updated:', workDayId);
      return workDay;
    } catch (error) {
      console.error('Error updating work day timesheet:', error);
      throw error;
    }
  }

  async startWorkSession(userId: string, taskId?: string, location?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('start_work_session', {
          p_user_id: userId,
          p_task_id: taskId || null,
          p_location: location || null,
        });

      if (error) throw error;
      
      console.log('✅ Work session started:', data);
      return data; // Returns session ID
    } catch (error) {
      console.error('Error starting work session:', error);
      throw error;
    }
  }

  async endWorkSession(sessionId: string, location?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_sessions')
        .update({
          end_time: new Date().toISOString(),
          end_location: location || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      console.log('✅ Work session ended:', sessionId);
    } catch (error) {
      console.error('Error ending work session:', error);
      throw error;
    }
  }

  async getWorkNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    try {
      let query = supabase
        .from('work_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching work notifications:', error);
      // Devolver array vacío en caso de error para no romper la UI
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // No lanzar error para no romper la UI
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

  private transformProjectFromSupabase(data: any): Project {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      location: data.location,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      estimatedDuration: data.estimated_duration,
      actualDuration: data.actual_duration || undefined,
      
      // Estadísticas calculadas automáticamente
      totalTasks: data.total_tasks,
      completedTasks: data.completed_tasks,
      completionPercentage: data.completion_percentage,
      
      // Supervisor
      supervisorName: data.supervisor_name,
      supervisorEmail: data.supervisor_email,
      
      // Arrays
      assignedTeam: data.assigned_team || [],
      requiredResources: data.required_resources || [],
      
      // Metadatos
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by || '',
      assignedTo: data.assigned_to || undefined,
      
      // Observaciones y tareas relacionadas
      observations: data.supervisor_observations?.map((obs: any) => this.transformObservationFromSupabase(obs)) || [],
      taskIds: data.tasks?.map((task: any) => task.id) || [],
      // Añadir tareas completas para facilitar el acceso
      tasks: data.tasks?.map((task: any) => this.transformTaskFromSupabase(task)) || [],
    }
  }

  private transformObservationFromSupabase(data: SupervisorObservationRow): SupervisorObservation {
    return {
      id: data.id,
      supervisorName: data.supervisor_name,
      supervisorRole: data.supervisor_role,
      observation: data.observation,
      date: new Date(data.date),
      priority: data.priority as any,
      isResolved: data.is_resolved,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      resolvedBy: data.resolved_by || undefined,
      resolution: data.resolution || undefined,
    }
  }

  private transformWorkDayFromSupabase(data: any): WorkDay {
    return {
      id: data.id,
      userId: data.user_id,
      date: new Date(data.date),
      status: data.status as DayStatus,
      
      // Timesheet
      timesheet: {
        status: data.timesheet_status as TimesheetStatus,
        currentSessionStart: data.current_session_start ? new Date(data.current_session_start) : undefined,
        totalDuration: data.actual_duration || 0,
        sessions: data.work_sessions?.map((session: WorkSessionRow) => ({
          startTime: new Date(session.start_time),
          endTime: session.end_time ? new Date(session.end_time) : undefined,
          duration: session.duration || 0,
        })) || [],
      },
      
      // Horarios
      plannedStartTime: data.planned_start_time ? this.parseTimeString(data.planned_start_time) : undefined,
      plannedEndTime: data.planned_end_time ? this.parseTimeString(data.planned_end_time) : undefined,
      actualStartTime: data.actual_start_time ? new Date(data.actual_start_time) : undefined,
      actualEndTime: data.actual_end_time ? new Date(data.actual_end_time) : undefined,
      
      // Notificaciones
      notifications: data.work_notifications?.map((notif: WorkNotificationRow) => ({
        id: notif.id,
        type: notif.type as any,
        title: notif.title,
        message: notif.message,
        isRead: notif.is_read,
        isUrgent: notif.is_urgent,
        actionRequired: notif.action_required,
        actionData: notif.action_data,
        createdAt: new Date(notif.created_at),
        readAt: notif.read_at ? new Date(notif.read_at) : undefined,
      })) || [],
      
      // Metadatos
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  private parseTimeString(timeString: string): Date {
    // Convertir "HH:MM:SS" a Date de hoy
    const today = new Date();
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds || 0);
  }
}

// Instancia singleton del servicio
export const supabaseService = new SupabaseService() 
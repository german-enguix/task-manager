import { supabase } from '@/lib/supabase'
import { Task, Tag, Project, SupervisorObservation, WorkDay, TimesheetStatus, DayStatus, TaskComment, CommentType } from '@/types'
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
type TaskCommentRow = {
  id: string
  task_id: string
  user_id: string
  type: 'text' | 'voice'
  content: string
  file_path: string | null
  file_url: string | null
  created_at: string
  updated_at: string
}
type TaskCommentInsert = {
  id?: string
  task_id: string
  user_id: string
  type: 'text' | 'voice'
  content: string
  file_path?: string | null
  file_url?: string | null
  created_at?: string
  updated_at?: string
}

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
          subtasks(
            *,
            subtask_evidence_requirements(*),
            subtask_evidences(*)
          ),
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
      console.error('Error fetching tasks from database:', error)
      
      // Si hay error, devolver array vacío para mostrar mensaje apropiado
      return [];
    }
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks(
            *,
            subtask_evidence_requirements(*),
            subtask_evidences(*)
          ),
          task_tags(
            tags(*)
          )
        `)
        .eq('id', taskId)
        .single()

      if (error) throw error
      
      if (!data) return null;

      // Cargar comentarios por separado
      const comments = await this.getTaskComments(taskId);
      
      // Transformar la tarea y agregar los comentarios
      const task = this.transformTaskFromSupabase(data);
      task.comments = comments;
      
      return task;
    } catch (error) {
      console.error('Error fetching task from database:', error)
      
      // Si hay error, devolver null para mostrar mensaje de "tarea no encontrada"
      return null;
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

  // ========== TASK COMMENTS ==========
  
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      console.log('🔄 Getting comments for task:', taskId);
      
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          profiles!task_comments_user_id_fkey(full_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error getting comments:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Si es error de tabla no existe, dar más información
        if (error.message?.includes('relation "task_comments" does not exist')) {
          console.error('💡 SOLUCIÓN: La tabla task_comments no existe. Ejecuta scripts/create_task_comments_table.sql en Supabase');
        }
        
        throw error;
      }

      console.log('✅ Raw comments from DB:', data);
      console.log('📊 Comments count:', data?.length || 0);

      // Mapear los comentarios a objetos TaskComment
      const comments = (data || []).map(row => {
        console.log('📝 Mapping comment:', row.id, 'content:', row.content.substring(0, 50) + '...');
        return {
          id: row.id,
          type: row.type === 'text' ? CommentType.TEXT : CommentType.VOICE,
          content: row.content,
          filePath: row.file_path,
          createdAt: new Date(row.created_at),
          author: row.profiles?.full_name || 'Usuario',
        };
      });

      console.log('✅ Mapped comments:', comments.length, 'total');
      return comments;

    } catch (error) {
      console.error('❌ Error getting task comments from database:', error);
      console.error('💡 Para diagnosticar el problema, ejecuta scripts/diagnose_comments_issue.sql en Supabase');
      
      // Si hay error, devolver array vacío pero con log informativo
      console.log('⚠️ Returning empty comments array due to error');
      return [];
    }
  }

  async addTaskComment(taskId: string, content: string, type: CommentType = CommentType.TEXT, filePath?: string): Promise<TaskComment> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const commentData: TaskCommentInsert = {
        task_id: taskId,
        user_id: user.id,
        type: type,
        content: content,
        file_path: filePath || null,
      };

      console.log('🔄 Inserting comment data:', commentData);

      const { data, error } = await supabase
        .from('task_comments')
        .insert(commentData)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Raw comment data from DB:', data);

      // Obtener el nombre del usuario desde profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      console.log('✅ User profile:', profile);

      // Crear el objeto comentario con el nombre del perfil
      const comment: TaskComment = {
        id: data.id,
        type: data.type === 'text' ? CommentType.TEXT : CommentType.VOICE,
        content: data.content,
        filePath: data.file_path,
        createdAt: new Date(data.created_at),
        author: profile?.full_name || user.email || 'Usuario',
      };

      console.log('✅ Mapped comment:', comment);
      return comment;

    } catch (error) {
      console.error('❌ Error adding task comment:', error);
      throw error;
    }
  }

  async updateTaskComment(commentId: string, content: string): Promise<TaskComment> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .update({ 
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          *,
          user:auth.users!task_comments_user_id_fkey(
            id,
            email
          ),
          profile:profiles!task_comments_user_id_fkey(
            full_name
          )
        `)
        .single();

      if (error) throw error;

      return this.mapTaskCommentRowToTaskComment(data);
    } catch (error) {
      console.error('Error updating task comment:', error);
      throw error;
    }
  }

  async deleteTaskComment(commentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task comment:', error);
      throw error;
    }
  }

  private mapTaskCommentRowToTaskComment(data: any): TaskComment {
    return {
      id: data.id,
      type: data.type === 'text' ? CommentType.TEXT : CommentType.VOICE,
      content: data.content,
      filePath: data.file_path,
      createdAt: new Date(data.created_at),
      author: data.profile?.full_name || data.user?.email || 'Usuario desconocido',
    };
  }

  // ========== TIMESHEET & WORK DAYS ==========
  
  async getCurrentWorkDay(userId: string, date?: Date): Promise<WorkDay | null> {
    console.log('🔄 getCurrentWorkDay BYPASSING DB - tables not created yet');
    // Por ahora, SIEMPRE devolver null para que se cree un fallback
    return null;
  }

  async getOrCreateWorkDay(userId: string, date?: Date): Promise<WorkDay> {
    const targetDate = date || new Date();
    const dateString = targetDate.toISOString().split('T')[0];
    
    console.log('🔄 getOrCreateWorkDay BYPASSING DB, creating fallback for user:', userId, 'date:', dateString);
    
    // Por ahora, SIEMPRE crear un workDay básico sin base de datos
    const fallbackWorkDay: WorkDay = {
      id: `fallback-${userId}-${dateString}`,
      userId: userId,
      date: targetDate,
      status: DayStatus.PROGRAMMED,
      timesheet: {
        status: TimesheetStatus.NOT_STARTED,
        totalDuration: 0,
        sessions: [],
      },
      tasks: [],
      notifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('✅ Fallback work day created (no DB):', fallbackWorkDay.id);
    return fallbackWorkDay;
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
    console.log('🔄 updateWorkDayTimesheet BYPASSING DB, using fallback mode');
    console.log('📝 Updates received:', { workDayId, updates });
    
    // SIEMPRE usar modo fallback hasta que las tablas estén creadas
    const simulatedWorkDay: WorkDay = {
      id: workDayId || 'fallback',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      date: new Date(),
      status: DayStatus.PROGRAMMED,
      timesheet: {
        status: updates.status || TimesheetStatus.NOT_STARTED,
        currentSessionStart: updates.currentSessionStart,
        totalDuration: 0,
        sessions: [],
        notes: updates.notes,
      },
      actualStartTime: updates.actualStartTime,
      actualEndTime: updates.actualEndTime,
      tasks: [],
      notifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('✅ Fallback workDay updated (no DB):', simulatedWorkDay);
    return simulatedWorkDay;
  }

  async startWorkSession(userId: string, taskId?: string, location?: string): Promise<string> {
    console.log('🔄 startWorkSession BYPASSING DB - returning dummy session ID');
    // Por ahora, devolver un ID de sesión dummy hasta que las tablas estén creadas
    return `fallback-session-${Date.now()}`;
  }

  async endWorkSession(sessionId: string, location?: string): Promise<void> {
    console.log('🔄 endWorkSession BYPASSING DB - doing nothing');
    // Por ahora, no hacer nada hasta que las tablas estén creadas
    return;
  }

  async getWorkNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    console.log('🔄 getWorkNotifications BYPASSING DB - returning empty array');
    // Por ahora, devolver array vacío hasta que las tablas estén creadas
    return [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    console.log('🔄 markNotificationAsRead BYPASSING DB - doing nothing');
    // Por ahora, no hacer nada hasta que las tablas estén creadas
    return;
  }

  // ========== TASK TIMER ==========
  
  async startTaskTimer(taskId: string, userId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('start_task_timer', {
        p_task_id: taskId,
        p_user_id: userId
      });

      if (error) throw error;
      
      console.log('✅ Task timer started:', taskId);
      return data; // Retorna el session_id
    } catch (error) {
      console.error('Error starting task timer:', error);
      throw error;
    }
  }

  async stopTaskTimer(taskId: string, userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('stop_task_timer', {
        p_task_id: taskId,
        p_user_id: userId
      });

      if (error) throw error;
      
      console.log('✅ Task timer stopped:', taskId, 'Total elapsed:', data);
      return data; // Retorna el total_elapsed en segundos
    } catch (error) {
      console.error('Error stopping task timer:', error);
      throw error;
    }
  }

  async getTaskTimerStats(taskId: string, userId: string): Promise<{
    totalElapsed: number;
    isRunning: boolean;
    currentSessionStart?: Date;
    sessionCount: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_task_timer_stats', {
        p_task_id: taskId,
        p_user_id: userId
      });

      if (error) throw error;
      
      const stats = data && data.length > 0 ? data[0] : null;
      
      return {
        totalElapsed: stats?.total_elapsed || 0,
        isRunning: stats?.is_running || false,
        currentSessionStart: stats?.current_session_start ? new Date(stats.current_session_start) : undefined,
        sessionCount: stats?.session_count || 0,
      };
    } catch (error) {
      console.error('Error getting task timer stats:', error);
      throw error;
    }
  }

  async getTaskTimerSessions(taskId: string, userId: string): Promise<Array<{
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('task_timer_sessions')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      return data?.map(session => ({
        id: session.id,
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : undefined,
        duration: session.duration || 0,
      })) || [];
    } catch (error) {
      console.error('Error getting task timer sessions:', error);
      throw error;
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
        // Mapear evidencias si existen
        evidenceRequirement: subtask.subtask_evidence_requirements?.[0] ? {
          type: subtask.subtask_evidence_requirements[0].type,
          isRequired: subtask.subtask_evidence_requirements[0].is_required,
          title: subtask.subtask_evidence_requirements[0].title,
          description: subtask.subtask_evidence_requirements[0].description,
          config: subtask.subtask_evidence_requirements[0].config || {},
        } : undefined,
        evidence: subtask.subtask_evidences?.[0] ? {
          id: subtask.subtask_evidences[0].id,
          subtaskId: subtask.subtask_evidences[0].subtask_id,
          type: subtask.subtask_evidences[0].type,
          title: subtask.subtask_evidences[0].title,
          description: subtask.subtask_evidences[0].description,
          filePath: subtask.subtask_evidences[0].file_path,
          data: subtask.subtask_evidences[0].data,
          createdAt: new Date(subtask.subtask_evidences[0].created_at),
          completedBy: subtask.subtask_evidences[0].completed_by || 'Unknown',
        } : undefined,
      })) || [],
      tags: data.task_tags?.map((tt: any) => this.transformTagFromSupabase(tt.tags)) || [],
      // Timer con datos reales de la base de datos (fallback si no existen los campos)
      timer: {
        totalElapsed: data.timer_total_elapsed ?? 0,
        isRunning: data.timer_is_running ?? false,
        currentSessionStart: data.timer_current_session_start ? new Date(data.timer_current_session_start) : undefined,
        sessions: [], // Se cargarán por separado si se necesitan
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
      status: (data.status as DayStatus) || DayStatus.PROGRAMMED,
      
      // Timesheet
      timesheet: {
        status: (data.timesheet_status as TimesheetStatus) || TimesheetStatus.NOT_STARTED,
        currentSessionStart: data.current_session_start ? new Date(data.current_session_start) : undefined,
        totalDuration: data.actual_duration || 0,
        sessions: [], // Simplificado por ahora
        notes: data.notes,
      },
      
      // Horarios
      plannedStartTime: data.planned_start_time ? this.parseTimeString(data.planned_start_time) : undefined,
      plannedEndTime: data.planned_end_time ? this.parseTimeString(data.planned_end_time) : undefined,
      actualStartTime: data.actual_start_time ? new Date(data.actual_start_time) : undefined,
      actualEndTime: data.actual_end_time ? new Date(data.actual_end_time) : undefined,
      
      // Simplificado por ahora
      tasks: [],
      notifications: [],
      
      // Metadatos
      createdAt: new Date(data.created_at || new Date()),
      updatedAt: new Date(data.updated_at || new Date()),
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
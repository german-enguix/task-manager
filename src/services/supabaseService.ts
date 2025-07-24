import { supabase } from '@/lib/supabase'
import { 
  Task, 
  Tag, 
  Project, 
  SupervisorObservation, 
  WorkDay, 
  TimesheetStatus, 
  DayStatus, 
  TaskComment, 
  CommentType,
  TaskProblemReport,
  ProblemReportType,
  ProblemSeverity,
} from '@/types'
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

// Tipos para reportes de problemas
type TaskProblemReportRow = {
  id: string
  task_id: string
  user_id: string
  report_type: 'blocking_issue' | 'missing_tools' | 'unsafe_conditions' | 'technical_issue' | 'access_denied' | 'material_shortage' | 'weather_conditions' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  reported_at: string
  resolved_at: string | null
  resolved_by: string | null
  resolution: string | null
  created_at: string
  updated_at: string
}

type TaskProblemReportInsert = {
  id?: string
  task_id: string
  user_id: string
  report_type: 'blocking_issue' | 'missing_tools' | 'unsafe_conditions' | 'technical_issue' | 'access_denied' | 'material_shortage' | 'weather_conditions' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  reported_at?: string
  resolved_at?: string | null
  resolved_by?: string | null
  resolution?: string | null
  created_at?: string
  updated_at?: string
}

export class SupabaseService {
  
  // Exponer cliente de Supabase para uso en otros lugares si es necesario
  public supabase = supabase;
  
  // ========== AUTHENTICATION & USERS ==========
  
  async getCurrentUser(): Promise<any> {
    try {
      console.log('🔄 Getting current user from Supabase...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('📊 Auth response:', { 
        hasUser: !!user, 
        userId: user?.id, 
        email: user?.email,
        hasError: !!error 
      });
      
      if (error) {
        console.error('❌ Auth error:', error);
        throw error;
      }
      
      if (!user) {
        console.log('❌ No authenticated user found');
        return null;
      }
      
      console.log('✅ User authenticated:', user.email);
      
      // Obtener información adicional del usuario desde la tabla profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Profile error:', profileError);
        throw profileError;
      }
      
      console.log('✅ User profile loaded:', userProfile?.full_name || 'No profile');
      
      return {
        ...user,
        profile: userProfile || null,
      };
    } catch (error) {
      console.error('❌ Error getting current user:', error);
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

  async checkAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user: any | null;
    sessionValid: boolean;
    message: string;
  }> {
    try {
      console.log('🔍 Checking detailed authentication status...');
      
      // 1. Verificar si hay sesión activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📊 Session check:', {
        hasSession: !!session,
        sessionUser: session?.user?.email,
        expiresAt: session?.expires_at,
        sessionError: !!sessionError
      });

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        return {
          isAuthenticated: false,
          user: null,
          sessionValid: false,
          message: `Error de sesión: ${sessionError.message}`
        };
      }

      if (!session) {
        console.log('❌ No active session found');
        return {
          isAuthenticated: false,
          user: null,
          sessionValid: false,
          message: 'No hay sesión activa - necesitas hacer login'
        };
      }

      // 2. Verificar que el usuario sea válido
      const user = session.user;
      if (!user) {
        console.log('❌ Session exists but no user');
        return {
          isAuthenticated: false,
          user: null,
          sessionValid: false,
          message: 'Sesión corrupta - necesitas hacer login de nuevo'
        };
      }

      // 3. Verificar que la sesión no esté expirada
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const isExpired = now > expiresAt;
      
      console.log('⏰ Session expiry check:', {
        now,
        expiresAt,
        isExpired,
        remainingMinutes: Math.floor((expiresAt - now) / 60)
      });

      if (isExpired) {
        console.log('❌ Session expired');
        return {
          isAuthenticated: false,
          user: null,
          sessionValid: false,
          message: 'Sesión expirada - necesitas hacer login de nuevo'
        };
      }

      // 4. Verificar acceso a la base de datos
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        console.log('✅ Database access OK, profile:', profile?.full_name || 'Sin perfil');
      } catch (dbError) {
        console.error('❌ Database access failed:', dbError);
        return {
          isAuthenticated: true,
          user: user,
          sessionValid: false,
          message: 'Usuario válido pero sin acceso a base de datos - revisa permisos'
        };
      }

      console.log('✅ Authentication fully valid');
      return {
        isAuthenticated: true,
        user: user,
        sessionValid: true,
        message: `Usuario autenticado: ${user.email}`
      };

    } catch (error) {
      console.error('❌ Auth status check failed:', error);
      return {
        isAuthenticated: false,
        user: null,
        sessionValid: false,
        message: `Error verificando autenticación: ${error}`
      };
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing Supabase session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh failed:', error);
        return false;
      }

      if (data.session) {
        console.log('✅ Session refreshed successfully');
        return true;
      }

      console.log('❌ No session to refresh');
      return false;
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return false;
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
      console.log('🔄 getTaskById called for:', taskId);
      
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
      
      if (!data) {
        console.log('❌ No task found with id:', taskId);
        return null;
      }

      console.log('✅ Task data loaded:', data.title);

      // Cargar comentarios y reportes de problemas por separado
      console.log('🔄 Loading comments for task...');
      const comments = await this.getTaskComments(taskId);
      console.log('✅ Comments loaded:', comments.length, 'comments');
      
      console.log('🔄 Loading problem reports for task...');
      const problemReports = await this.getTaskProblemReports(taskId);
      console.log('✅ Problem reports loaded:', problemReports.length, 'reports');
      
      // Transformar la tarea y agregar los comentarios y reportes
      const task = this.transformTaskFromSupabase(data);
      task.comments = comments;
      task.problemReports = problemReports;
      
      console.log('✅ Final task object:', {
        id: task.id,
        title: task.title,
        commentsCount: task.comments.length,
        problemReportsCount: task.problemReports.length,
      });
      
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

  async addSubtaskEvidence(
    subtaskId: string,
    requirementId: string,
    type: string,
    title: string,
    description?: string,
    filePath?: string,
    data?: any
  ): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const evidenceData = {
        subtask_id: subtaskId,
        requirement_id: requirementId,
        type: type,
        title: title,
        description: description || null,
        file_path: filePath || null,
        data: data || null,
        completed_by: user.id,
      };

      console.log('🔄 Inserting subtask evidence:', evidenceData);

      const { error } = await supabase
        .from('subtask_evidences')
        .insert(evidenceData);

      if (error) {
        console.error('❌ Supabase error saving evidence:', error);
        throw error;
      }

      console.log('✅ Subtask evidence saved successfully');
    } catch (error) {
      console.error('❌ Error adding subtask evidence:', error);
      throw error;
    }
  }

  async removeSubtaskEvidence(subtaskId: string): Promise<void> {
    try {
      console.log('🔄 Removing subtask evidence for:', subtaskId);

      // Primero, obtener la evidencia para ver si tiene archivos que eliminar
      const { data: existingEvidence, error: fetchError } = await supabase
        .from('subtask_evidences')
        .select('file_path, type')
        .eq('subtask_id', subtaskId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error fetching evidence to delete:', fetchError);
        throw fetchError;
      }

      // Si hay evidencia con archivo (audio), eliminarlo de Storage
      if (existingEvidence?.file_path && existingEvidence.type === 'AUDIO') {
        try {
          console.log('🗑️ Deleting audio file from storage:', existingEvidence.file_path);
          await this.deleteAudioFile(existingEvidence.file_path);
        } catch (fileError) {
          console.warn('⚠️ Could not delete audio file, but continuing with evidence removal:', fileError);
        }
      }

      // Eliminar la evidencia de la base de datos
      const { error } = await supabase
        .from('subtask_evidences')
        .delete()
        .eq('subtask_id', subtaskId);

      if (error) {
        console.error('❌ Supabase error removing evidence:', error);
        throw error;
      }

      console.log('✅ Subtask evidence removed successfully');
    } catch (error) {
      console.error('❌ Error removing subtask evidence:', error);
      throw error;
    }
  }

  // ==================== AUDIO FILE UPLOAD METHODS ====================

  /**
   * Sube un archivo de audio a Supabase Storage
   */
  async uploadAudioFile(uri: string, fileName: string): Promise<{publicUrl: string, filePath: string}> {
    try {
      console.log('📤 Uploading audio file:', fileName);
      
      // Leer el archivo como blob/binary
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Crear un nombre único para el archivo
      const timestamp = Date.now();
      const uniqueFileName = `audio_${timestamp}_${fileName}`;
      const filePath = `audio-evidences/${uniqueFileName}`;
      
      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('task-evidences')
        .upload(filePath, blob, {
          contentType: 'audio/m4a',
          upsert: false
        });

      if (error) {
        console.error('❌ Error uploading audio file:', error);
        throw error;
      }

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('task-evidences')
        .getPublicUrl(filePath);

      console.log('✅ Audio file uploaded successfully:', urlData.publicUrl);
      
      return {
        publicUrl: urlData.publicUrl,
        filePath: filePath
      };
    } catch (error) {
      console.error('❌ Error in uploadAudioFile:', error);
      throw error;
    }
  }

  /**
   * Elimina un archivo de audio de Supabase Storage
   */
  async deleteAudioFile(filePath: string): Promise<void> {
    try {
      console.log('🗑️ Deleting audio file:', filePath);
      
      const { error } = await supabase.storage
        .from('task-evidences')
        .remove([filePath]);

      if (error) {
        console.error('❌ Error deleting audio file:', error);
        throw error;
      }

      console.log('✅ Audio file deleted successfully');
    } catch (error) {
      console.error('❌ Error in deleteAudioFile:', error);
      throw error;
    }
  }

  /**
   * Verifica si un archivo de audio existe en Supabase Storage
   */
  async checkAudioFileExists(filePath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from('task-evidences')
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        });

      if (error) {
        console.error('❌ Error checking audio file:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('❌ Error in checkAudioFileExists:', error);
      return false;
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
      console.log('🔍 TaskId type:', typeof taskId, 'value:', taskId);
      
      // Verificar autenticación primero
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user in getTaskComments:', user?.email || 'No user');
      
      // Usar consulta simple sin JOINs complejos para evitar errores de relaciones
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      console.log('📋 Query executed for task_id:', taskId);
      console.log('📊 Raw Supabase response:', { 
        hasData: !!data, 
        dataLength: data?.length || 0,
        hasError: !!error,
        errorMessage: error?.message 
      });

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
          console.error('🚨 TABLA TASK_COMMENTS NO EXISTE');
          console.error('💡 SOLUCIÓN: Ejecuta scripts/fix_task_comments_final.sql en Supabase');
          console.error('📋 O ve al SQL Editor en Supabase Dashboard y pega ese script');
          
          // Devolver array vacío en lugar de lanzar error para no romper la UI
          console.log('⚠️ Returning empty comments array - table does not exist');
          return [];
        }
        
        // Si es error de relaciones/foreign keys, también manejar graciosamente
        if (error.message?.includes('relationship') || error.message?.includes('foreign key')) {
          console.error('🚨 ERROR DE RELACIONES EN BASE DE DATOS');
          console.error('💡 SOLUCIÓN: Ejecuta scripts/fix_task_comments_final.sql en Supabase');
          console.log('⚠️ Returning empty comments array - relationship errors');
          return [];
        }
        
        throw error;
      }

      console.log('✅ Raw comments from DB:', data);
      console.log('📊 Comments count:', data?.length || 0);

      // Si no hay comentarios, devolver array vacío directamente
      if (!data || data.length === 0) {
        console.log('💡 No comments found for task:', taskId);
        console.log('🔍 This could mean: 1) No comments exist, 2) RLS policy blocking access, 3) Wrong task_id');
        return [];
      }

      // Mapear los comentarios obteniendo nombres de usuarios por separado
      console.log('🔄 Mapping', data.length, 'comments...');
      const comments = await Promise.all((data || []).map(async (row, index) => {
        console.log(`📝 Mapping comment ${index + 1}/${data.length}:`, {
          id: row.id,
          user_id: row.user_id,
          content_preview: row.content.substring(0, 30) + '...',
          created_at: row.created_at
        });
        
        // Obtener nombre del usuario por separado para evitar errores de JOIN
        let authorName = 'Usuario';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', row.user_id)
            .single();
          
          if (profile?.full_name) {
            authorName = profile.full_name;
            console.log('✅ Found profile for user:', row.user_id, '->', authorName);
          } else {
            console.log('⚠️ No profile found for user:', row.user_id);
          }
        } catch (profileError) {
          console.log('⚠️ Could not get profile for user:', row.user_id, profileError);
        }
        
        const mappedComment = {
          id: row.id,
          type: row.type === 'text' ? CommentType.TEXT : CommentType.VOICE,
          content: row.content,
          filePath: row.file_path,
          createdAt: new Date(row.created_at),
          author: authorName,
          userId: row.user_id,
        };
        
        console.log('✅ Mapped comment:', mappedComment.id, 'by', mappedComment.author);
        return mappedComment;
      }));

      console.log('✅ All comments mapped successfully:', comments.length, 'total');
      console.log('📋 Final comments array:', comments.map(c => ({ 
        id: c.id, 
        author: c.author, 
        contentPreview: c.content.substring(0, 30) + '...' 
      })));
      
      return comments;

    } catch (error) {
      console.error('❌ Error getting task comments from database:', error);
      console.error('💡 SOLUCIÓN DEFINITIVA: Ejecuta scripts/fix_task_comments_final.sql en Supabase');
      console.error('📋 Este script crea la tabla y configura todos los permisos necesarios');
      
      // Si hay error, devolver array vacío pero con log informativo
      console.log('⚠️ Returning empty comments array due to error - app will continue working');
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
        userId: user.id,
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
        .select('*')
        .single();

      if (error) throw error;

      // Obtener información del usuario por separado
      let authorName = 'Usuario';
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user_id)
          .single();
        
        if (profile?.full_name) {
          authorName = profile.full_name;
        }
      } catch (profileError) {
        console.log('⚠️ Could not get profile for user:', data.user_id);
      }

      return {
        id: data.id,
        type: data.type === 'text' ? CommentType.TEXT : CommentType.VOICE,
        content: data.content,
        filePath: data.file_path,
        createdAt: new Date(data.created_at),
        author: authorName,
        userId: data.user_id,
      };
    } catch (error) {
      console.error('Error updating task comment:', error);
      throw error;
    }
  }

  async deleteTaskComment(commentId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting comment:', commentId);
      
      // Verificar que el usuario actual es el autor del comentario
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el comentario pertenece al usuario actual
      const { data: comment, error: fetchError } = await supabase
        .from('task_comments')
        .select('user_id, content')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching comment for deletion:', fetchError);
        throw fetchError;
      }

      if (!comment) {
        throw new Error('Comentario no encontrado');
      }

      if (comment.user_id !== currentUser.id) {
        throw new Error('Solo puedes borrar tus propios comentarios');
      }

      console.log('✅ User authorized to delete comment:', comment.content.substring(0, 30) + '...');

      // Proceder con el borrado
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('❌ Error deleting comment:', error);
        throw error;
      }

      console.log('✅ Comment deleted successfully:', commentId);
    } catch (error) {
      console.error('❌ Error deleting task comment:', error);
      throw error;
    }
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

  // ========== TASK PROBLEM REPORTS ==========
  
  async getTaskProblemReports(taskId: string): Promise<TaskProblemReport[]> {
    try {
      console.log('🔄 Getting problem reports for task:', taskId);
      
      // Verificar autenticación primero
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user in getTaskProblemReports:', user?.email || 'No user');
      
      const { data, error } = await supabase
        .from('task_problem_reports')
        .select('*')
        .eq('task_id', taskId)
        .order('reported_at', { ascending: false });

      console.log('📋 Query executed for task_id:', taskId);

      if (error) {
        console.error('❌ Error getting problem reports:', error);
        
        // Si la tabla no existe, devolver array vacío
        if (error.message?.includes('relation "task_problem_reports" does not exist')) {
          console.error('🚨 TABLA TASK_PROBLEM_REPORTS NO EXISTE');
          console.error('💡 SOLUCIÓN: Ejecuta scripts/create_problem_reports_table.sql en Supabase');
          return [];
        }
        
        throw error;
      }

      console.log('✅ Raw problem reports from DB:', data);

      if (!data || data.length === 0) {
        console.log('💡 No problem reports found for task:', taskId);
        return [];
      }

      // Mapear los reportes obteniendo nombres de usuarios
      const problemReports = await Promise.all((data || []).map(async (row) => {
        console.log(`📝 Mapping problem report:`, {
          id: row.id,
          user_id: row.user_id,
          type: row.report_type,
          severity: row.severity,
        });
        
        // Obtener nombre del usuario
        let authorName = 'Usuario';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', row.user_id)
            .single();
          
          if (profile?.full_name) {
            authorName = profile.full_name;
          }
        } catch (profileError) {
          console.log('⚠️ Could not get profile for user:', row.user_id);
        }
        
        const mappedReport: TaskProblemReport = {
          id: row.id,
          reportType: row.report_type as ProblemReportType,
          severity: row.severity as ProblemSeverity,
          title: row.title,
          description: row.description,
          reportedAt: new Date(row.reported_at),
          resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
          resolvedBy: row.resolved_by || undefined,
          resolution: row.resolution || undefined,
          userId: row.user_id,
          author: authorName,
        };
        
        return mappedReport;
      }));

      console.log('✅ All problem reports mapped successfully:', problemReports.length);
      return problemReports;

    } catch (error) {
      console.error('❌ Error getting task problem reports:', error);
      throw error;
    }
  }

  async addTaskProblemReport(
    taskId: string,
    reportType: ProblemReportType,
    severity: ProblemSeverity,
    title: string,
    description: string
  ): Promise<TaskProblemReport> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const reportData: TaskProblemReportInsert = {
        task_id: taskId,
        user_id: user.id,
        report_type: reportType,
        severity: severity,
        title: title,
        description: description,
      };

      console.log('🔄 Inserting problem report data:', reportData);

      const { data, error } = await supabase
        .from('task_problem_reports')
        .insert(reportData)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Raw problem report data from DB:', data);

      // Obtener el nombre del usuario desde profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      console.log('✅ User profile:', profile);

      // Crear el objeto reporte con el nombre del perfil
      const problemReport: TaskProblemReport = {
        id: data.id,
        reportType: data.report_type as ProblemReportType,
        severity: data.severity as ProblemSeverity,
        title: data.title,
        description: data.description,
        reportedAt: new Date(data.reported_at),
        resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
        resolvedBy: data.resolved_by || undefined,
        resolution: data.resolution || undefined,
        userId: user.id,
        author: profile?.full_name || user.email || 'Usuario',
      };

      console.log('✅ Mapped problem report:', problemReport);
      return problemReport;

    } catch (error) {
      console.error('❌ Error adding task problem report:', error);
      throw error;
    }
  }

  async updateTaskProblemReport(
    reportId: string,
    title?: string,
    description?: string,
    severity?: ProblemSeverity
  ): Promise<TaskProblemReport> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (severity !== undefined) updateData.severity = severity;

      const { data, error } = await supabase
        .from('task_problem_reports')
        .update(updateData)
        .eq('id', reportId)
        .select('*')
        .single();

      if (error) throw error;

      // Obtener información del usuario
      let authorName = 'Usuario';
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user_id)
          .single();
        
        if (profile?.full_name) {
          authorName = profile.full_name;
        }
      } catch (profileError) {
        console.log('⚠️ Could not get profile for user:', data.user_id);
      }

      return {
        id: data.id,
        reportType: data.report_type as ProblemReportType,
        severity: data.severity as ProblemSeverity,
        title: data.title,
        description: data.description,
        reportedAt: new Date(data.reported_at),
        resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
        resolvedBy: data.resolved_by || undefined,
        resolution: data.resolution || undefined,
        userId: data.user_id,
        author: authorName,
      };
    } catch (error) {
      console.error('Error updating task problem report:', error);
      throw error;
    }
  }

  async resolveTaskProblemReport(reportId: string, resolution: string): Promise<TaskProblemReport> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('task_problem_reports')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution: resolution,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select('*')
        .single();

      if (error) throw error;

      // Obtener información del usuario que reportó
      let authorName = 'Usuario';
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user_id)
          .single();
        
        if (profile?.full_name) {
          authorName = profile.full_name;
        }
      } catch (profileError) {
        console.log('⚠️ Could not get profile for user:', data.user_id);
      }

      return {
        id: data.id,
        reportType: data.report_type as ProblemReportType,
        severity: data.severity as ProblemSeverity,
        title: data.title,
        description: data.description,
        reportedAt: new Date(data.reported_at),
        resolvedAt: new Date(data.resolved_at),
        resolvedBy: data.resolved_by,
        resolution: data.resolution,
        userId: data.user_id,
        author: authorName,
      };
    } catch (error) {
      console.error('Error resolving task problem report:', error);
      throw error;
    }
  }

  async deleteTaskProblemReport(reportId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('task_problem_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      console.log('✅ Problem report deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting task problem report:', error);
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
          id: subtask.subtask_evidence_requirements[0].id,
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
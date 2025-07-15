// Global types for the application
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
}

export type NavigationProps = {
  navigation: any;
  route: any;
};



// Task System Types
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum EvidenceType {
  PHOTO_VIDEO = 'photo_video', // Fotografía o video
  AUDIO = 'audio',
  SIGNATURE = 'signature',
  LOCATION = 'location',
}

export enum CommentType {
  TEXT = 'text',
  VOICE = 'voice',
}

export interface TaskSubtask {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  order: number;
  createdAt: Date;
  completedAt?: Date;
}

// Evidencia requerida configurada por el manager
export interface RequiredEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  order: number;
  // Configuración específica del tipo
  config?: {
    // Para PHOTO_VIDEO
    allowPhoto?: boolean;
    allowVideo?: boolean;
    maxFileSize?: number; // En MB
    // Para AUDIO
    maxDuration?: number; // En segundos
    // Para LOCATION
    requiredAccuracy?: number; // En metros
    // Para SIGNATURE
    requiredFields?: string[]; // Campos adicionales requeridos
  };
}

// Evidencia completada por el usuario
export interface TaskEvidence {
  id: string;
  requiredEvidenceId: string; // Referencia a la evidencia requerida
  type: EvidenceType;
  title: string;
  description?: string;
  filePath?: string; // Para fotos, videos y audios
  data?: any; // Para firmas o datos de ubicación
  createdAt: Date;
  completedBy: string;
}

export interface TaskComment {
  id: string;
  type: CommentType;
  content: string;
  filePath?: string; // Para comentarios de voz
  createdAt: Date;
  author: string;
}

export interface TaskTimer {
  totalElapsed: number; // Tiempo total en segundos
  isRunning: boolean;
  currentSessionStart?: Date;
  sessions: Array<{
    startTime: Date;
    endTime?: Date;
    duration: number; // En segundos
  }>;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  estimatedDuration?: number; // En minutos
  
  // Subtareas
  subtasks: TaskSubtask[];
  
  // Cronómetro
  timer: TaskTimer;
  
  // Evidencias requeridas (configuradas por el manager)
  requiredEvidences: RequiredEvidence[];
  
  // Evidencias completadas (subidas por el usuario)
  evidences: TaskEvidence[];
  
  // Comentarios
  comments: TaskComment[];
  
  // Reportes de problemas
  problemReports: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportedAt: Date;
    resolvedAt?: Date;
    resolution?: string;
  }>;
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
}

// Day System Types
export enum DayStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum TimesheetStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export interface TimesheetSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // En segundos
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface Timesheet {
  id: string;
  status: TimesheetStatus;
  totalDuration: number; // En segundos
  currentSessionStart?: Date;
  sessions: TimesheetSession[];
  notes?: string;
}

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionRequired?: boolean;
  actionLabel?: string;
  actionData?: any;
}

export interface WorkDay {
  id: string;
  date: Date;
  status: DayStatus;
  
  // Información del día
  site: string;
  startTime: Date;
  endTime?: Date;
  projectName?: string;
  
  // Fichaje independiente
  timesheet: Timesheet;
  
  // Tareas del día
  tasks: Task[];
  
  // Notificaciones
  notifications: Notification[];
  
  // Resumen del día (para cuando está completado)
  summary?: {
    totalTasksCompleted: number;
    totalWorkTime: number; // En segundos
    evidencesSubmitted: number;
    problemsReported: number;
    notes?: string;
  };
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Project System Types
export enum ProjectStatus {
  PROGRAMMED = 'programmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SupervisorObservation {
  id: string;
  supervisorName: string;
  supervisorRole: string;
  observation: string;
  date: Date;
  priority: ProjectPriority;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  
  // Lugar y fechas
  location: string;
  startDate: Date;
  endDate?: Date;
  estimatedDuration: number; // En días
  actualDuration?: number; // En días
  
  // Tareas del proyecto
  taskIds: string[]; // Referencias a las tareas
  totalTasks: number;
  completedTasks: number;
  
  // Supervisor y observaciones
  supervisorName: string;
  supervisorEmail: string;
  observations: SupervisorObservation[];
  
  // Progreso
  completionPercentage: number;
  
  // Equipos y recursos
  assignedTeam: string[];
  requiredResources: string[];
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Projects: undefined;
  TaskDetail: { taskId: string };
  ProjectDetail: { projectId: string };
  Settings: undefined;
};

export type NavigationRoute = 'Home' | 'Projects' | 'TaskDetail' | 'ProjectDetail' | 'Settings';

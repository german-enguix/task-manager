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

export type RootStackParamList = {
  Home: undefined;
  TaskDetail: { taskId: string };
  Settings: undefined;
};

// Task System Types
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum EvidenceType {
  PHOTO = 'photo',
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

export interface TaskEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  description?: string;
  filePath?: string; // Para fotos y audios
  data?: any; // Para firmas o datos de ubicación
  createdAt: Date;
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
  
  // Evidencias
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

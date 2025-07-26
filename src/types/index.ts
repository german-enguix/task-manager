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
  LOCATION = 'location', // GPS
  NFC = 'nfc', // Near Field Communication
  QR = 'qr', // QR Code scanner
}

export enum CommentType {
  TEXT = 'text',
  VOICE = 'voice',
}

// Enum para tipos de reportes de problemas
export enum ProblemReportType {
  BLOCKING_ISSUE = 'blocking_issue',
  MISSING_TOOLS = 'missing_tools',
  UNSAFE_CONDITIONS = 'unsafe_conditions',
  TECHNICAL_ISSUE = 'technical_issue',
  ACCESS_DENIED = 'access_denied',
  MATERIAL_SHORTAGE = 'material_shortage',
  WEATHER_CONDITIONS = 'weather_conditions',
  OTHER = 'other',
}

// Enum para severidad de problemas
export enum ProblemSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Tipos predefinidos de reportes con su configuración
export interface ProblemReportTypeConfig {
  type: ProblemReportType;
  title: string;
  description: string;
  icon: string;
  suggestedSeverity: ProblemSeverity;
}

export const PROBLEM_REPORT_TYPES: ProblemReportTypeConfig[] = [
  {
    type: ProblemReportType.BLOCKING_ISSUE,
    title: 'Problema que bloquea la tarea',
    description: 'No puedo continuar con la tarea debido a este problema',
    icon: 'block-helper',
    suggestedSeverity: ProblemSeverity.HIGH,
  },
  {
    type: ProblemReportType.MISSING_TOOLS,
    title: 'Herramientas faltantes',
    description: 'Faltan herramientas o equipos necesarios para la tarea',
    icon: 'toolbox-outline',
    suggestedSeverity: ProblemSeverity.MEDIUM,
  },
  {
    type: ProblemReportType.UNSAFE_CONDITIONS,
    title: 'Condiciones inseguras',
    description: 'Las condiciones de trabajo no son seguras',
    icon: 'shield-alert-outline',
    suggestedSeverity: ProblemSeverity.CRITICAL,
  },
  {
    type: ProblemReportType.TECHNICAL_ISSUE,
    title: 'Problema técnico',
    description: 'Error técnico o mal funcionamiento de equipos',
    icon: 'tools',
    suggestedSeverity: ProblemSeverity.MEDIUM,
  },
  {
    type: ProblemReportType.ACCESS_DENIED,
    title: 'Acceso denegado',
    description: 'No tengo acceso a la ubicación o recursos necesarios',
    icon: 'lock-outline',
    suggestedSeverity: ProblemSeverity.HIGH,
  },
  {
    type: ProblemReportType.MATERIAL_SHORTAGE,
    title: 'Falta de materiales',
    description: 'Materiales insuficientes o faltantes',
    icon: 'package-variant',
    suggestedSeverity: ProblemSeverity.MEDIUM,
  },
  {
    type: ProblemReportType.WEATHER_CONDITIONS,
    title: 'Condiciones climáticas',
    description: 'El clima impide realizar la tarea de forma segura',
    icon: 'weather-lightning-rainy',
    suggestedSeverity: ProblemSeverity.MEDIUM,
  },
  {
    type: ProblemReportType.OTHER,
    title: 'Otro problema',
    description: 'Problema no categorizado en las opciones anteriores',
    icon: 'alert-circle-outline',
    suggestedSeverity: ProblemSeverity.LOW,
  },
];

// Tag para categorización de tareas
export interface Tag {
  id: string;
  name: string;
  color: string; // Color hexadecimal para el badge
  category?: string; // Categoría opcional para agrupar tags
}

// Configuración de evidencia para subtareas
export interface SubtaskEvidenceRequirement {
  id: string;
  type: EvidenceType;
  isRequired: boolean; // true = obligatoria (check bloqueado), false = opcional (check normal)
  title: string;
  description: string;
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
    // Para NFC
    expectedTag?: string; // ID del tag NFC esperado
    allowAnyTag?: boolean; // Si permite cualquier tag NFC
  };
}

// Evidencia completada para una subtarea
export interface SubtaskEvidence {
  id: string;
  subtaskId: string;
  type: EvidenceType;
  title: string;
  description?: string;
  filePath?: string; // Para fotos, videos y audios
  data?: any; // Para firmas, datos de ubicación o NFC
  createdAt: Date;
  completedBy: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  order: number;
  createdAt: Date;
  completedAt?: Date;
  
  // Nueva funcionalidad de evidencias
  evidenceRequirement?: SubtaskEvidenceRequirement; // Si requiere evidencia
  evidence?: SubtaskEvidence; // Evidencia completada (si existe)
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
  userId: string; // ID del usuario que creó el comentario
}

// Interfaz para reportes de problemas
export interface TaskProblemReport {
  id: string;
  reportType: ProblemReportType;
  severity: ProblemSeverity;
  title: string;
  description: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  userId: string; // ID del usuario que reportó
  author: string; // Nombre del usuario que reportó
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
  
  // Información del proyecto y ubicación
  projectName: string;
  location: string;
  
  // Tags asignados por el admin
  tags: Tag[];
  
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
  problemReports: TaskProblemReport[];
  
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
  startTime: Date;
  endTime?: Date;
  
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
  tasks?: Task[]; // Tareas completas (opcional, cargadas desde DB)
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
  Profile: undefined;
  TaskDetail: { taskId: string };
  ProjectDetail: { projectId: string };
  Settings: undefined;
};

export type NavigationRoute = 'Home' | 'Projects' | 'Profile' | 'TaskDetail' | 'ProjectDetail' | 'Settings';

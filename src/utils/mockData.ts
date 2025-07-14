import { 
  Task, 
  TaskStatus, 
  TaskSubtask, 
  TaskEvidence, 
  TaskComment, 
  TaskTimer,
  EvidenceType,
  CommentType 
} from '@/types';

// Datos mockeados para tareas
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Inspección de Seguridad - Planta Principal',
    description: 'Realizar inspección completa de seguridad en todas las áreas de la planta principal, verificando equipos de protección, salidas de emergencia y sistemas de ventilación.',
    status: TaskStatus.IN_PROGRESS,
    priority: 'high',
    dueDate: new Date('2025-01-15T18:00:00'),
    estimatedDuration: 120, // 2 horas
    
    // Subtareas
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Verificar extintores',
        description: 'Revisar presión y fechas de vencimiento de todos los extintores',
        isCompleted: true,
        order: 1,
        createdAt: new Date('2025-01-12T09:00:00'),
        completedAt: new Date('2025-01-12T10:30:00'),
      },
      {
        id: 'subtask-2',
        title: 'Comprobar salidas de emergencia',
        description: 'Verificar que todas las salidas estén despejadas y señalizadas',
        isCompleted: true,
        order: 2,
        createdAt: new Date('2025-01-12T09:00:00'),
        completedAt: new Date('2025-01-12T11:00:00'),
      },
      {
        id: 'subtask-3',
        title: 'Revisar sistema de ventilación',
        description: 'Comprobar funcionamiento de extractores y filtros',
        isCompleted: false,
        order: 3,
        createdAt: new Date('2025-01-12T09:00:00'),
      },
      {
        id: 'subtask-4',
        title: 'Inspeccionar EPIs',
        description: 'Verificar estado y disponibilidad de equipos de protección individual',
        isCompleted: false,
        order: 4,
        createdAt: new Date('2025-01-12T09:00:00'),
      },
    ],
    
    // Cronómetro
    timer: {
      totalElapsed: 5400, // 1 hora 30 minutos
      isRunning: false,
      currentSessionStart: undefined,
      sessions: [
        {
          startTime: new Date('2025-01-12T09:00:00'),
          endTime: new Date('2025-01-12T12:00:00'),
          duration: 3600, // 1 hora
        },
        {
          startTime: new Date('2025-01-12T14:00:00'),
          endTime: new Date('2025-01-12T14:30:00'),
          duration: 1800, // 30 minutos
        },
      ],
    },
    
    // Evidencias
    evidences: [
      {
        id: 'evidence-1',
        type: EvidenceType.PHOTO,
        title: 'Extintor Área A - OK',
        description: 'Extintor en perfecto estado, presión correcta',
        filePath: '/photos/extintor-area-a.jpg',
        createdAt: new Date('2025-01-12T10:15:00'),
      },
      {
        id: 'evidence-2',
        type: EvidenceType.LOCATION,
        title: 'Ubicación Salida Emergencia Norte',
        description: 'Coordenadas GPS de la salida norte verificada',
        data: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 5,
        },
        createdAt: new Date('2025-01-12T10:45:00'),
      },
      {
        id: 'evidence-3',
        type: EvidenceType.AUDIO,
        title: 'Ruido Sistema Ventilación',
        description: 'Grabación de audio del sistema de ventilación para análisis',
        filePath: '/audio/ventilacion-ruido.mp3',
        createdAt: new Date('2025-01-12T11:30:00'),
      },
    ],
    
    // Comentarios
    comments: [
      {
        id: 'comment-1',
        type: CommentType.TEXT,
        content: 'Iniciando inspección. Todo parece estar en orden en la primera área.',
        createdAt: new Date('2025-01-12T09:15:00'),
        author: 'Juan Pérez',
      },
      {
        id: 'comment-2',
        type: CommentType.VOICE,
        content: 'Nota de voz sobre el estado del sistema de ventilación',
        filePath: '/audio/nota-ventilacion.mp3',
        createdAt: new Date('2025-01-12T11:35:00'),
        author: 'Juan Pérez',
      },
      {
        id: 'comment-3',
        type: CommentType.TEXT,
        content: 'Encontrado problema menor en ventilador 3. Requiere mantenimiento.',
        createdAt: new Date('2025-01-12T11:40:00'),
        author: 'Juan Pérez',
      },
    ],
    
    // Reportes de problemas
    problemReports: [
      {
        id: 'problem-1',
        title: 'Ventilador 3 con ruido anormal',
        description: 'El ventilador del área 3 presenta un ruido anormal que podría indicar desgaste en los rodamientos.',
        severity: 'medium',
        reportedAt: new Date('2025-01-12T11:40:00'),
      },
    ],
    
    // Metadatos
    createdAt: new Date('2025-01-12T08:00:00'),
    updatedAt: new Date('2025-01-12T11:45:00'),
    createdBy: 'admin',
    assignedTo: 'Juan Pérez',
  },
  
  {
    id: 'task-2',
    title: 'Mantenimiento Preventivo - Maquinaria',
    description: 'Realizar mantenimiento preventivo programado de toda la maquinaria crítica del área de producción.',
    status: TaskStatus.NOT_STARTED,
    priority: 'medium',
    dueDate: new Date('2025-01-20T16:00:00'),
    estimatedDuration: 240, // 4 horas
    
    subtasks: [
      {
        id: 'subtask-5',
        title: 'Lubricar rodamientos',
        description: 'Aplicar lubricante en todos los puntos de rodamiento',
        isCompleted: false,
        order: 1,
        createdAt: new Date('2025-01-10T08:00:00'),
      },
      {
        id: 'subtask-6',
        title: 'Revisar correas',
        description: 'Verificar tensión y estado de todas las correas',
        isCompleted: false,
        order: 2,
        createdAt: new Date('2025-01-10T08:00:00'),
      },
      {
        id: 'subtask-7',
        title: 'Cambiar filtros',
        description: 'Reemplazar filtros de aire y aceite',
        isCompleted: false,
        order: 3,
        createdAt: new Date('2025-01-10T08:00:00'),
      },
    ],
    
    timer: {
      totalElapsed: 0,
      isRunning: false,
      sessions: [],
    },
    
    evidences: [],
    comments: [],
    problemReports: [],
    
    createdAt: new Date('2025-01-10T08:00:00'),
    updatedAt: new Date('2025-01-10T08:00:00'),
    createdBy: 'admin',
    assignedTo: 'María González',
  },
  
  {
    id: 'task-3',
    title: 'Calibración Sensores - Línea 2',
    description: 'Calibrar todos los sensores de temperatura y presión de la línea de producción 2.',
    status: TaskStatus.COMPLETED,
    priority: 'low',
    dueDate: new Date('2025-01-10T14:00:00'),
    estimatedDuration: 90, // 1.5 horas
    
    subtasks: [
      {
        id: 'subtask-8',
        title: 'Sensor temperatura T1',
        description: 'Calibrar sensor de temperatura principal',
        isCompleted: true,
        order: 1,
        createdAt: new Date('2025-01-08T09:00:00'),
        completedAt: new Date('2025-01-10T10:30:00'),
      },
      {
        id: 'subtask-9',
        title: 'Sensor presión P1',
        description: 'Calibrar sensor de presión de entrada',
        isCompleted: true,
        order: 2,
        createdAt: new Date('2025-01-08T09:00:00'),
        completedAt: new Date('2025-01-10T11:00:00'),
      },
    ],
    
    timer: {
      totalElapsed: 5400, // 1.5 horas
      isRunning: false,
      sessions: [
        {
          startTime: new Date('2025-01-10T09:00:00'),
          endTime: new Date('2025-01-10T10:30:00'),
          duration: 5400,
        },
      ],
    },
    
    evidences: [
      {
        id: 'evidence-4',
        type: EvidenceType.SIGNATURE,
        title: 'Firma Calibración Completada',
        description: 'Firma digital confirmando la calibración',
        data: {
          signatureData: 'base64_signature_data',
          signedBy: 'Carlos Ruiz',
          signedAt: new Date('2025-01-10T10:30:00'),
        },
        createdAt: new Date('2025-01-10T10:30:00'),
      },
    ],
    
    comments: [
      {
        id: 'comment-4',
        type: CommentType.TEXT,
        content: 'Calibración completada exitosamente. Todos los sensores funcionan dentro de los parámetros normales.',
        createdAt: new Date('2025-01-10T10:35:00'),
        author: 'Carlos Ruiz',
      },
    ],
    
    problemReports: [],
    
    createdAt: new Date('2025-01-08T09:00:00'),
    updatedAt: new Date('2025-01-10T10:35:00'),
    createdBy: 'admin',
    assignedTo: 'Carlos Ruiz',
  },
];

// Función para obtener una tarea por ID
export const getTaskById = (id: string): Task | undefined => {
  return mockTasks.find(task => task.id === id);
};

// Función para obtener todas las tareas
export const getAllTasks = (): Task[] => {
  return mockTasks;
};

// Función para actualizar una tarea
export const updateTask = (id: string, updates: Partial<Task>): Task | undefined => {
  const taskIndex = mockTasks.findIndex(task => task.id === id);
  if (taskIndex === -1) return undefined;
  
  mockTasks[taskIndex] = {
    ...mockTasks[taskIndex],
    ...updates,
    updatedAt: new Date(),
  };
  
  return mockTasks[taskIndex];
}; 
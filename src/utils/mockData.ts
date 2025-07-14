import { 
  Task, 
  TaskStatus, 
  TaskSubtask, 
  TaskEvidence, 
  TaskComment, 
  TaskTimer,
  RequiredEvidence,
  EvidenceType,
  CommentType,
  WorkDay,
  DayStatus,
  TimesheetStatus,
  NotificationType
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
    
    // Evidencias requeridas (configuradas por el manager)
    requiredEvidences: [
      {
        id: 'req-evidence-1',
        type: EvidenceType.PHOTO_VIDEO,
        title: 'Fotos de Extintores',
        description: 'Tomar fotos de todos los extintores mostrando presión y fechas',
        isRequired: true,
        isCompleted: true,
        order: 1,
        config: {
          allowPhoto: true,
          allowVideo: false,
          maxFileSize: 10, // 10MB
        },
      },
      {
        id: 'req-evidence-2',
        type: EvidenceType.LOCATION,
        title: 'Ubicación Salidas de Emergencia',
        description: 'Registrar coordenadas GPS de todas las salidas de emergencia',
        isRequired: true,
        isCompleted: true,
        order: 2,
        config: {
          requiredAccuracy: 5, // 5 metros
        },
      },
      {
        id: 'req-evidence-3',
        type: EvidenceType.AUDIO,
        title: 'Audio Sistema Ventilación',
        description: 'Grabar audio del funcionamiento del sistema de ventilación',
        isRequired: true,
        isCompleted: true,
        order: 3,
        config: {
          maxDuration: 60, // 60 segundos
        },
      },
      {
        id: 'req-evidence-4',
        type: EvidenceType.SIGNATURE,
        title: 'Firma Supervisor',
        description: 'Obtener firma digital del supervisor de área',
        isRequired: true,
        isCompleted: false,
        order: 4,
        config: {
          requiredFields: ['nombre', 'cargo', 'area'],
        },
      },
    ],
    
    // Evidencias completadas (subidas por el usuario)
    evidences: [
      {
        id: 'evidence-1',
        requiredEvidenceId: 'req-evidence-1',
        type: EvidenceType.PHOTO_VIDEO,
        title: 'Extintor Área A - OK',
        description: 'Extintor en perfecto estado, presión correcta',
        filePath: '/photos/extintor-area-a.jpg',
        createdAt: new Date('2025-01-12T10:15:00'),
        completedBy: 'Juan Pérez',
      },
      {
        id: 'evidence-2',
        requiredEvidenceId: 'req-evidence-2',
        type: EvidenceType.LOCATION,
        title: 'Ubicación Salida Emergencia Norte',
        description: 'Coordenadas GPS de la salida norte verificada',
        data: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 5,
        },
        createdAt: new Date('2025-01-12T10:45:00'),
        completedBy: 'Juan Pérez',
      },
      {
        id: 'evidence-3',
        requiredEvidenceId: 'req-evidence-3',
        type: EvidenceType.AUDIO,
        title: 'Ruido Sistema Ventilación',
        description: 'Grabación de audio del sistema de ventilación para análisis',
        filePath: '/audio/ventilacion-ruido.mp3',
        createdAt: new Date('2025-01-12T11:30:00'),
        completedBy: 'Juan Pérez',
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
    
    // Evidencias requeridas (configuradas por el manager)
    requiredEvidences: [
      {
        id: 'req-evidence-5',
        type: EvidenceType.PHOTO_VIDEO,
        title: 'Video Proceso Lubricación',
        description: 'Grabar video del proceso de lubricación de rodamientos',
        isRequired: true,
        isCompleted: false,
        order: 1,
        config: {
          allowPhoto: false,
          allowVideo: true,
          maxFileSize: 50, // 50MB
        },
      },
      {
        id: 'req-evidence-6',
        type: EvidenceType.SIGNATURE,
        title: 'Firma Checklist Mantenimiento',
        description: 'Firma digital confirmando completitud del checklist',
        isRequired: true,
        isCompleted: false,
        order: 2,
        config: {
          requiredFields: ['tecnico', 'supervisor'],
        },
      },
    ],
    
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
    
    // Evidencias requeridas (configuradas por el manager)
    requiredEvidences: [
      {
        id: 'req-evidence-7',
        type: EvidenceType.SIGNATURE,
        title: 'Firma Calibración',
        description: 'Firma digital confirmando la calibración completada',
        isRequired: true,
        isCompleted: true,
        order: 1,
        config: {
          requiredFields: ['tecnico', 'fecha', 'resultados'],
        },
      },
    ],
    
    evidences: [
      {
        id: 'evidence-4',
        requiredEvidenceId: 'req-evidence-7',
        type: EvidenceType.SIGNATURE,
        title: 'Firma Calibración Completada',
        description: 'Firma digital confirmando la calibración',
        data: {
          signatureData: 'base64_signature_data',
          signedBy: 'Carlos Ruiz',
          signedAt: new Date('2025-01-10T10:30:00'),
          fields: {
            tecnico: 'Carlos Ruiz',
            fecha: '2025-01-10',
            resultados: 'Calibración exitosa - sensores dentro de parámetros',
          },
        },
        createdAt: new Date('2025-01-10T10:30:00'),
        completedBy: 'Carlos Ruiz',
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

// Función para marcar una evidencia requerida como completada
export const completeRequiredEvidence = (taskId: string, requiredEvidenceId: string, evidenceData: Omit<TaskEvidence, 'id' | 'requiredEvidenceId'>): boolean => {
  const task = getTaskById(taskId);
  if (!task) return false;
  
  const requiredEvidence = task.requiredEvidences.find(req => req.id === requiredEvidenceId);
  if (!requiredEvidence) return false;
  
  // Marcar como completada
  requiredEvidence.isCompleted = true;
  
  // Añadir evidencia completada
  const newEvidence: TaskEvidence = {
    ...evidenceData,
    id: `evidence-${Date.now()}`,
    requiredEvidenceId,
  };
  
  task.evidences.push(newEvidence);
  
  // Actualizar tarea
  updateTask(taskId, { 
    requiredEvidences: task.requiredEvidences,
    evidences: task.evidences 
  });
  
  return true;
};

// Datos mockeados para los días de trabajo
export const mockWorkDays: WorkDay[] = [
  // Día anterior (finalizado)
  {
    id: 'workday-2025-01-11',
    date: new Date('2025-01-11'),
    status: DayStatus.COMPLETED,
    
    // Información del día
    site: 'Planta Industrial Norte',
    startTime: new Date('2025-01-11T08:00:00'),
    endTime: new Date('2025-01-11T17:00:00'),
    projectName: 'Modernización Línea de Producción A',
    
    // Fichaje completado
    timesheet: {
      id: 'timesheet-2025-01-11',
      status: TimesheetStatus.COMPLETED,
      totalDuration: 32400, // 9 horas
      currentSessionStart: undefined,
      sessions: [
        {
          id: 'session-1',
          startTime: new Date('2025-01-11T08:00:00'),
          endTime: new Date('2025-01-11T12:00:00'),
          duration: 14400, // 4 horas
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 5,
          },
        },
        {
          id: 'session-2',
          startTime: new Date('2025-01-11T13:00:00'),
          endTime: new Date('2025-01-11T17:00:00'),
          duration: 14400, // 4 horas
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 5,
          },
        },
      ],
      notes: 'Jornada completa - Inspección finalizada exitosamente',
    },
    
    // Tareas completadas del día anterior
    tasks: [
      {
        ...mockTasks[0], // Tarea de inspección
        status: TaskStatus.COMPLETED,
        timer: {
          totalElapsed: 7200, // 2 horas
          isRunning: false,
          currentSessionStart: undefined,
          sessions: [
            {
              startTime: new Date('2025-01-11T09:00:00'),
              endTime: new Date('2025-01-11T11:00:00'),
              duration: 7200,
            },
          ],
        },
        // Todas las subtareas completadas
        subtasks: mockTasks[0].subtasks.map(subtask => ({
          ...subtask,
          isCompleted: true,
          completedAt: new Date('2025-01-11T15:30:00'),
        })),
        // Todas las evidencias completadas
        requiredEvidences: mockTasks[0].requiredEvidences.map(evidence => ({
          ...evidence,
          isCompleted: true,
        })),
      },
    ],
    
    // Notificaciones del día anterior (todas leídas)
    notifications: [
      {
        id: 'notification-completed-1',
        type: NotificationType.SUCCESS,
        title: 'Día finalizado',
        message: 'Todas las tareas del día han sido completadas exitosamente.',
        isRead: true,
        createdAt: new Date('2025-01-11T17:00:00'),
        actionRequired: false,
      },
    ],
    
    // Resumen del día completado
    summary: {
      totalTasksCompleted: 1,
      totalWorkTime: 32400, // 9 horas
      evidencesSubmitted: 4,
      problemsReported: 1,
      notes: 'Jornada exitosa. Todas las tareas completadas dentro del tiempo estimado.',
    },
    
    // Metadatos
    createdAt: new Date('2025-01-11T08:00:00'),
    updatedAt: new Date('2025-01-11T17:00:00'),
    createdBy: 'admin',
  },
  
  // Día actual (activo)
  {
    id: 'workday-2025-01-12',
    date: new Date('2025-01-12'),
    status: DayStatus.ACTIVE,
    
    // Información del día
    site: 'Planta Industrial Norte',
    startTime: new Date('2025-01-12T08:00:00'),
    endTime: undefined, // Aún no finalizado
    projectName: 'Modernización Línea de Producción A',
    
    // Fichaje independiente
    timesheet: {
      id: 'timesheet-2025-01-12',
      status: TimesheetStatus.IN_PROGRESS,
      totalDuration: 14400, // 4 horas
      currentSessionStart: new Date('2025-01-12T13:00:00'),
      sessions: [
        {
          id: 'session-1',
          startTime: new Date('2025-01-12T08:00:00'),
          endTime: new Date('2025-01-12T12:00:00'),
          duration: 14400, // 4 horas
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 5,
          },
        },
      ],
      notes: 'Turno matutino - Inspección y mantenimiento',
    },
    
    // Tareas del día actual
    tasks: mockTasks,
    
    // Notificaciones
    notifications: [
      {
        id: 'notification-1',
        type: NotificationType.INFO,
        title: 'Recordatorio',
        message: 'No olvides completar la evidencia de firma del supervisor en la tarea de inspección.',
        isRead: false,
        createdAt: new Date('2025-01-12T11:00:00'),
        actionRequired: true,
        actionLabel: 'Ver tarea',
        actionData: { taskId: 'task-1' },
      },
      {
        id: 'notification-2',
        type: NotificationType.WARNING,
        title: 'Tiempo límite',
        message: 'La tarea de mantenimiento debe iniciarse antes de las 15:00 para cumplir con el cronograma.',
        isRead: false,
        createdAt: new Date('2025-01-12T13:30:00'),
        actionRequired: true,
        actionLabel: 'Iniciar tarea',
        actionData: { taskId: 'task-2' },
      },
      {
        id: 'notification-3',
        type: NotificationType.SUCCESS,
        title: 'Evidencia aceptada',
        message: 'La evidencia de audio del sistema de ventilación ha sido validada correctamente.',
        isRead: true,
        createdAt: new Date('2025-01-12T12:15:00'),
        actionRequired: false,
      },
    ],
    
    // Resumen del día (undefined porque aún está activo)
    summary: undefined,
    
    // Metadatos
    createdAt: new Date('2025-01-12T08:00:00'),
    updatedAt: new Date('2025-01-12T13:45:00'),
    createdBy: 'admin',
  },
  
  // Día siguiente (por iniciar)
  {
    id: 'workday-2025-01-13',
    date: new Date('2025-01-13'),
    status: DayStatus.ACTIVE,
    
    // Información del día
    site: 'Planta Industrial Norte',
    startTime: new Date('2025-01-13T08:00:00'),
    endTime: undefined,
    projectName: 'Modernización Línea de Producción A',
    
    // Fichaje no iniciado
    timesheet: {
      id: 'timesheet-2025-01-13',
      status: TimesheetStatus.NOT_STARTED,
      totalDuration: 0,
      currentSessionStart: undefined,
      sessions: [],
      notes: 'Turno programado - Calibración de sensores',
    },
    
    // Tareas programadas para el día siguiente
    tasks: [
      {
        ...mockTasks[2], // Tarea de calibración
        status: TaskStatus.NOT_STARTED,
        timer: {
          totalElapsed: 0,
          isRunning: false,
          currentSessionStart: undefined,
          sessions: [],
        },
        // Todas las subtareas sin completar
        subtasks: mockTasks[2].subtasks.map(subtask => ({
          ...subtask,
          isCompleted: false,
          completedAt: undefined,
        })),
        // Todas las evidencias sin completar
        requiredEvidences: mockTasks[2].requiredEvidences.map(evidence => ({
          ...evidence,
          isCompleted: false,
        })),
        evidences: [], // Sin evidencias aún
        comments: [], // Sin comentarios aún
      },
    ],
    
    // Notificaciones para el día siguiente
    notifications: [
      {
        id: 'notification-tomorrow-1',
        type: NotificationType.INFO,
        title: 'Día programado',
        message: 'Tienes programada una calibración de sensores para mañana a las 08:00.',
        isRead: false,
        createdAt: new Date('2025-01-12T16:00:00'),
        actionRequired: false,
      },
    ],
    
    // Sin resumen aún
    summary: undefined,
    
    // Metadatos
    createdAt: new Date('2025-01-12T16:00:00'),
    updatedAt: new Date('2025-01-12T16:00:00'),
    createdBy: 'admin',
  },
];

// Estado para el día actual seleccionado
let currentSelectedDayIndex = 1; // Índice del día actual (2025-01-12)

// Funciones para manejar múltiples días
export const getAllWorkDays = (): WorkDay[] => {
  return mockWorkDays;
};

export const getCurrentWorkDay = (): WorkDay => {
  return mockWorkDays[currentSelectedDayIndex];
};

export const getWorkDayByDate = (date: Date): WorkDay | undefined => {
  return mockWorkDays.find(day => 
    day.date.toDateString() === date.toDateString()
  );
};

export const navigateToDay = (direction: 'prev' | 'next' | 'today'): WorkDay => {
  if (direction === 'prev' && currentSelectedDayIndex > 0) {
    currentSelectedDayIndex--;
  } else if (direction === 'next' && currentSelectedDayIndex < mockWorkDays.length - 1) {
    currentSelectedDayIndex++;
  } else if (direction === 'today') {
    currentSelectedDayIndex = 1; // Día actual
  }
  
  return mockWorkDays[currentSelectedDayIndex];
};

export const getSelectedDayIndex = (): number => {
  return currentSelectedDayIndex;
};

export const canNavigatePrev = (): boolean => {
  return currentSelectedDayIndex > 0;
};

export const canNavigateNext = (): boolean => {
  return currentSelectedDayIndex < mockWorkDays.length - 1;
};

export const updateWorkDay = (updates: Partial<WorkDay>): WorkDay => {
  Object.assign(mockWorkDays[currentSelectedDayIndex], {
    ...updates,
    updatedAt: new Date(),
  });
  return mockWorkDays[currentSelectedDayIndex];
};

export const updateTimesheet = (updates: Partial<WorkDay['timesheet']>): WorkDay => {
  mockWorkDays[currentSelectedDayIndex].timesheet = {
    ...mockWorkDays[currentSelectedDayIndex].timesheet,
    ...updates,
  };
  mockWorkDays[currentSelectedDayIndex].updatedAt = new Date();
  return mockWorkDays[currentSelectedDayIndex];
};

export const addNotification = (notification: Omit<WorkDay['notifications'][0], 'id' | 'createdAt'>): WorkDay => {
  const newNotification = {
    ...notification,
    id: `notification-${Date.now()}`,
    createdAt: new Date(),
  };
  
  mockWorkDays[currentSelectedDayIndex].notifications.unshift(newNotification);
  mockWorkDays[currentSelectedDayIndex].updatedAt = new Date();
  return mockWorkDays[currentSelectedDayIndex];
};

export const markNotificationAsRead = (notificationId: string): WorkDay => {
  const notification = mockWorkDays[currentSelectedDayIndex].notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
    mockWorkDays[currentSelectedDayIndex].updatedAt = new Date();
  }
  return mockWorkDays[currentSelectedDayIndex];
}; 
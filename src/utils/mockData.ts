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
  NotificationType,
  Notification,
  Project,
  ProjectStatus,
  ProjectPriority,
  SupervisorObservation,
  SubtaskEvidenceRequirement,
  SubtaskEvidence
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
    
    // Información del proyecto y ubicación
    projectName: 'Modernización Línea de Producción A',
    location: 'Planta Industrial Norte - Área Principal',
    
    // Subtareas con diferentes tipos de evidencias
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Verificar extintores',
        description: 'Revisar presión y fechas de vencimiento de todos los extintores',
        isCompleted: true,
        order: 1,
        createdAt: new Date('2025-01-12T09:00:00'),
        completedAt: new Date('2025-01-12T10:30:00'),
        // Evidencia requerida: PHOTO_VIDEO (COMPLETADA)
        evidenceRequirement: {
          type: EvidenceType.PHOTO_VIDEO,
          isRequired: true,
          title: 'Foto de extintores',
          description: 'Tomar foto de cada extintor mostrando presión y fecha de vencimiento',
          config: {
            allowPhoto: true,
            allowVideo: false,
            maxFileSize: 10, // 10MB
          },
        },
        evidence: {
          id: 'subtask-evidence-1',
          subtaskId: 'subtask-1',
          type: EvidenceType.PHOTO_VIDEO,
          title: 'Extintores Área Principal',
          description: 'Fotos de todos los extintores verificados - presión correcta',
          filePath: '/photos/extintores-area-principal.jpg',
          createdAt: new Date('2025-01-12T10:15:00'),
          completedBy: 'Juan Pérez',
        },
      },
      {
        id: 'subtask-2',
        title: 'Comprobar salidas de emergencia',
        description: 'Verificar que todas las salidas estén despejadas y señalizadas',
        isCompleted: true,
        order: 2,
        createdAt: new Date('2025-01-12T09:00:00'),
        completedAt: new Date('2025-01-12T11:00:00'),
        // Evidencia requerida: LOCATION/GPS (COMPLETADA)
        evidenceRequirement: {
          type: EvidenceType.LOCATION,
          isRequired: true,
          title: 'Ubicación GPS de salidas',
          description: 'Registrar coordenadas GPS de cada salida de emergencia verificada',
          config: {
            requiredAccuracy: 5, // 5 metros
          },
        },
        evidence: {
          id: 'subtask-evidence-2',
          subtaskId: 'subtask-2',
          type: EvidenceType.LOCATION,
          title: 'GPS Salidas de Emergencia',
          description: 'Coordenadas de todas las salidas verificadas',
          data: {
            locations: [
              { latitude: 40.7128, longitude: -74.0060, accuracy: 3, name: 'Salida Norte' },
              { latitude: 40.7130, longitude: -74.0058, accuracy: 4, name: 'Salida Sur' },
              { latitude: 40.7126, longitude: -74.0062, accuracy: 2, name: 'Salida Este' },
            ],
          },
          createdAt: new Date('2025-01-12T10:45:00'),
          completedBy: 'Juan Pérez',
        },
      },
      {
        id: 'subtask-3',
        title: 'Revisar sistema de ventilación',
        description: 'Comprobar funcionamiento de extractores y filtros',
        isCompleted: false,
        order: 3,
        createdAt: new Date('2025-01-12T09:00:00'),
        // Evidencia requerida: NFC (NO COMPLETADA)
        evidenceRequirement: {
          type: EvidenceType.NFC,
          isRequired: true,
          title: 'Escaneo NFC de equipos',
          description: 'Escanear etiquetas NFC de cada extractor para verificar último mantenimiento',
          config: {
            allowAnyTag: false,
            expectedTag: 'VENT_', // Tags que empiecen con VENT_
          },
        },
        // Sin evidencia completada aún
      },
      {
        id: 'subtask-4',
        title: 'Inspeccionar EPIs',
        description: 'Verificar estado y disponibilidad de equipos de protección individual',
        isCompleted: false,
        order: 4,
        createdAt: new Date('2025-01-12T09:00:00'),
        // Evidencia opcional: PHOTO_VIDEO (NO COMPLETADA)
        evidenceRequirement: {
          type: EvidenceType.PHOTO_VIDEO,
          isRequired: false, // OPCIONAL
          title: 'Fotos de EPIs (opcional)',
          description: 'Fotografías opcionales del estado de los EPIs para documentación',
          config: {
            allowPhoto: true,
            allowVideo: true,
            maxFileSize: 15, // 15MB
          },
        },
        // Sin evidencia completada
      },
      {
        id: 'subtask-5',
        title: 'Obtener firma del supervisor',
        description: 'Conseguir firma del supervisor de área para validar la inspección',
        isCompleted: false,
        order: 5,
        createdAt: new Date('2025-01-12T09:00:00'),
        // Evidencia requerida: SIGNATURE (NO COMPLETADA)
        evidenceRequirement: {
          type: EvidenceType.SIGNATURE,
          isRequired: true,
          title: 'Firma del supervisor',
          description: 'Firma digital del supervisor validando la inspección de seguridad',
          config: {
            requiredFields: ['nombre', 'cargo', 'area', 'fecha'],
          },
        },
        // Sin evidencia completada aún
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
    
    // Información del proyecto y ubicación
    projectName: 'Modernización Línea de Producción A',
    location: 'Planta Industrial Norte - Área de Maquinaria',
    
    subtasks: [
      {
        id: 'subtask-6',
        title: 'Lubricar rodamientos',
        description: 'Aplicar lubricante en todos los puntos de rodamiento',
        isCompleted: false,
        order: 1,
        createdAt: new Date('2025-01-10T08:00:00'),
        // Sin evidencia requerida
      },
      {
        id: 'subtask-7',
        title: 'Revisar correas',
        description: 'Verificar tensión y estado de todas las correas',
        isCompleted: false,
        order: 2,
        createdAt: new Date('2025-01-10T08:00:00'),
        // Evidencia opcional: PHOTO_VIDEO
        evidenceRequirement: {
          type: EvidenceType.PHOTO_VIDEO,
          isRequired: false, // OPCIONAL
          title: 'Video del estado de correas',
          description: 'Video opcional mostrando el estado de las correas para registro',
          config: {
            allowPhoto: false,
            allowVideo: true,
            maxFileSize: 25, // 25MB
          },
        },
      },
      {
        id: 'subtask-8',
        title: 'Cambiar filtros',
        description: 'Reemplazar filtros de aire y aceite',
        isCompleted: false,
        order: 3,
        createdAt: new Date('2025-01-10T08:00:00'),
        // Evidencia requerida: NFC + SIGNATURE
        evidenceRequirement: {
          type: EvidenceType.NFC,
          isRequired: true,
          title: 'Escaneo NFC filtros nuevos',
          description: 'Escanear código NFC de los filtros nuevos para registro de trazabilidad',
          config: {
            allowAnyTag: false,
            expectedTag: 'FILTER_', // Tags que empiecen con FILTER_
          },
        },
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
    
    // Información del proyecto y ubicación
    projectName: 'Modernización Línea de Producción A',
    location: 'Planta Industrial Norte - Línea 2',
    
    subtasks: [
      {
        id: 'subtask-9',
        title: 'Sensor temperatura T1',
        description: 'Calibrar sensor de temperatura principal',
        isCompleted: true,
        order: 1,
        createdAt: new Date('2025-01-08T09:00:00'),
        completedAt: new Date('2025-01-10T10:30:00'),
        // Evidencia requerida: SIGNATURE (COMPLETADA)
        evidenceRequirement: {
          type: EvidenceType.SIGNATURE,
          isRequired: true,
          title: 'Firma de calibración T1',
          description: 'Firma digital confirmando la calibración del sensor de temperatura',
          config: {
            requiredFields: ['tecnico', 'fecha', 'valores_calibracion', 'resultado'],
          },
        },
        evidence: {
          id: 'subtask-evidence-3',
          subtaskId: 'subtask-9',
          type: EvidenceType.SIGNATURE,
          title: 'Calibración Sensor T1 Completada',
          description: 'Firma digital confirmando calibración exitosa',
          data: {
            signatureData: 'base64_signature_data_t1',
            signedBy: 'Carlos Ruiz',
            signedAt: new Date('2025-01-10T10:30:00'),
            fields: {
              tecnico: 'Carlos Ruiz',
              fecha: '2025-01-10',
              valores_calibracion: 'Rango: 0-100°C, Precisión: ±0.1°C',
              resultado: 'Calibración exitosa - dentro de parámetros',
            },
          },
          createdAt: new Date('2025-01-10T10:30:00'),
          completedBy: 'Carlos Ruiz',
        },
      },
      {
        id: 'subtask-10',
        title: 'Sensor presión P1',
        description: 'Calibrar sensor de presión de entrada',
        isCompleted: true,
        order: 2,
        createdAt: new Date('2025-01-08T09:00:00'),
        completedAt: new Date('2025-01-10T11:00:00'),
        // Evidencia requerida: NFC (COMPLETADA)
        evidenceRequirement: {
          type: EvidenceType.NFC,
          isRequired: true,
          title: 'Escaneo NFC sensor P1',
          description: 'Escanear etiqueta NFC del sensor para registro de calibración',
          config: {
            expectedTag: 'SENSOR_P1',
            allowAnyTag: false,
          },
        },
        evidence: {
          id: 'subtask-evidence-4',
          subtaskId: 'subtask-10',
          type: EvidenceType.NFC,
          title: 'NFC Sensor P1 Registrado',
          description: 'Etiqueta NFC del sensor escaneada correctamente',
          data: {
            tagId: 'SENSOR_P1_2024_001',
            timestamp: new Date('2025-01-10T11:00:00'),
            calibrationData: {
              range: '0-10 bar',
              precision: '±0.01 bar',
              lastCalibration: '2025-01-10',
              nextCalibration: '2025-07-10',
            },
          },
          createdAt: new Date('2025-01-10T11:00:00'),
          completedBy: 'Carlos Ruiz',
        },
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

// Notificaciones globales mockeadas
export const mockNotifications: Notification[] = [
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
  {
    id: 'notification-4',
    type: NotificationType.SUCCESS,
    title: 'Día finalizado',
    message: 'Todas las tareas del día han sido completadas exitosamente.',
    isRead: true,
    createdAt: new Date('2025-01-11T17:00:00'),
    actionRequired: false,
  },
  {
    id: 'notification-5',
    type: NotificationType.INFO,
    title: 'Día programado',
    message: 'Tienes programada una calibración de sensores para mañana a las 08:00.',
    isRead: false,
    createdAt: new Date('2025-01-12T16:00:00'),
    actionRequired: false,
  },
  {
    id: 'notification-6',
    type: NotificationType.ERROR,
    title: 'Problema reportado',
    message: 'Se ha detectado un problema en el ventilador 3. Requiere atención inmediata.',
    isRead: false,
    createdAt: new Date('2025-01-12T14:20:00'),
    actionRequired: true,
    actionLabel: 'Ver reporte',
    actionData: { problemId: 'problem-1' },
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
    startTime: new Date('2025-01-11T08:00:00'),
    endTime: new Date('2025-01-11T17:00:00'),
    
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
    
    // Notificaciones gestionadas globalmente
    notifications: [],
    
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
    startTime: new Date('2025-01-12T08:00:00'),
    endTime: undefined, // Aún no finalizado
    
    // Fichaje independiente
    timesheet: {
      id: 'timesheet-2025-01-12',
      status: TimesheetStatus.IN_PROGRESS,
      totalDuration: 15071, // 4 horas 11 minutos 11 segundos
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
    
    // Notificaciones gestionadas globalmente
    notifications: [],
    
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
    startTime: new Date('2025-01-13T08:00:00'),
    endTime: undefined,
    
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
    
    // Notificaciones gestionadas globalmente
    notifications: [],
    
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

// Funciones para manejar notificaciones globales
export const getAllNotifications = (): Notification[] => {
  return [...mockNotifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getUnreadNotifications = (): Notification[] => {
  return mockNotifications.filter(notification => !notification.isRead);
};

export const getUnreadNotificationsCount = (): number => {
  return mockNotifications.filter(notification => !notification.isRead).length;
};

export const markNotificationAsRead = (notificationId: string): void => {
  const notification = mockNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
  }
};

export const markAllNotificationsAsRead = (): void => {
  mockNotifications.forEach(notification => {
    notification.isRead = true;
  });
};

export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>): Notification => {
  const newNotification: Notification = {
    ...notification,
    id: `notification-${Date.now()}`,
    createdAt: new Date(),
  };
  
  mockNotifications.unshift(newNotification);
  return newNotification;
}; 

// Datos mockeados para proyectos
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Modernización Línea de Producción A',
    description: 'Actualización completa de la línea de producción A incluyendo inspección de seguridad, mantenimiento preventivo y calibración de sensores para mejorar la eficiencia y seguridad.',
    status: ProjectStatus.IN_PROGRESS,
    priority: ProjectPriority.HIGH,
    
    // Lugar y fechas
    location: 'Planta Industrial Norte',
    startDate: new Date('2025-01-10T08:00:00'),
    endDate: new Date('2025-01-20T17:00:00'),
    estimatedDuration: 10, // 10 días
    actualDuration: undefined,
    
    // Tareas del proyecto
    taskIds: ['task-1', 'task-2', 'task-3'], // Todas las tareas mockeadas
    totalTasks: 3,
    completedTasks: 1,
    
    // Supervisor y observaciones
    supervisorName: 'María González',
    supervisorEmail: 'maria.gonzalez@empresa.com',
    observations: [
      {
        id: 'obs-1',
        supervisorName: 'María González',
        supervisorRole: 'Supervisora de Producción',
        observation: 'El progreso en la inspección de seguridad va según lo planificado. Se recomienda prestar especial atención al estado de los extintores en el área 3.',
        date: new Date('2025-01-11T16:00:00'),
        priority: ProjectPriority.MEDIUM,
        isResolved: true,
        resolvedAt: new Date('2025-01-11T17:30:00'),
        resolvedBy: 'Juan Pérez',
        resolution: 'Extintores del área 3 revisados y actualizados correctamente.',
      },
      {
        id: 'obs-2',
        supervisorName: 'María González',
        supervisorRole: 'Supervisora de Producción',
        observation: 'Es necesario coordinar mejor los tiempos del mantenimiento preventivo para no interferir con la producción del turno de tarde.',
        date: new Date('2025-01-12T10:00:00'),
        priority: ProjectPriority.HIGH,
        isResolved: false,
      },
      {
        id: 'obs-3',
        supervisorName: 'María González',
        supervisorRole: 'Supervisora de Producción',
        observation: 'Excelente trabajo en la documentación de evidencias. La calidad de las fotos y audios facilitará la revisión posterior.',
        date: new Date('2025-01-12T14:00:00'),
        priority: ProjectPriority.LOW,
        isResolved: true,
        resolvedAt: new Date('2025-01-12T14:05:00'),
        resolvedBy: 'Juan Pérez',
        resolution: 'Agradecimiento reconocido.',
      },
    ],
    
    // Progreso
    completionPercentage: 35,
    
    // Equipos y recursos
    assignedTeam: ['Juan Pérez', 'Carlos Ruiz', 'Ana Martín'],
    requiredResources: [
      'Equipo de inspección de seguridad',
      'Herramientas de mantenimiento',
      'Dispositivos de calibración',
      'EPIs completos',
      'Documentación técnica',
    ],
    
    // Metadatos
    createdAt: new Date('2025-01-08T09:00:00'),
    updatedAt: new Date('2025-01-12T15:00:00'),
    createdBy: 'admin',
    assignedTo: 'Juan Pérez',
  },
  
  {
    id: 'project-2',
    name: 'Implementación Sistema de Monitoreo IoT',
    description: 'Instalación y configuración de sensores IoT para monitoreo en tiempo real de temperatura, humedad y presión en todas las líneas de producción.',
    status: ProjectStatus.PROGRAMMED,
    priority: ProjectPriority.MEDIUM,
    
    // Lugar y fechas
    location: 'Planta Industrial Sur',
    startDate: new Date('2025-01-25T08:00:00'),
    endDate: new Date('2025-02-15T17:00:00'),
    estimatedDuration: 21, // 21 días
    actualDuration: undefined,
    
    // Tareas del proyecto
    taskIds: [], // Tareas aún no asignadas
    totalTasks: 0,
    completedTasks: 0,
    
    // Supervisor y observaciones
    supervisorName: 'Roberto Silva',
    supervisorEmail: 'roberto.silva@empresa.com',
    observations: [
      {
        id: 'obs-4',
        supervisorName: 'Roberto Silva',
        supervisorRole: 'Supervisor de Tecnología',
        observation: 'Se debe coordinar con el equipo de IT para asegurar la conectividad de red antes del inicio del proyecto.',
        date: new Date('2025-01-10T11:00:00'),
        priority: ProjectPriority.HIGH,
        isResolved: false,
      },
      {
        id: 'obs-5',
        supervisorName: 'Roberto Silva',
        supervisorRole: 'Supervisor de Tecnología',
        observation: 'Los sensores han llegado completos. Se recomienda revisar las especificaciones técnicas con el equipo antes de la instalación.',
        date: new Date('2025-01-15T09:30:00'),
        priority: ProjectPriority.MEDIUM,
        isResolved: true,
        resolvedAt: new Date('2025-01-15T16:00:00'),
        resolvedBy: 'Elena Torres',
        resolution: 'Especificaciones revisadas y aprobadas por el equipo técnico.',
      },
    ],
    
    // Progreso
    completionPercentage: 0,
    
    // Equipos y recursos
    assignedTeam: ['Elena Torres', 'Miguel Santos', 'Laura Jiménez'],
    requiredResources: [
      'Sensores IoT (50 unidades)',
      'Gateway de comunicación',
      'Cables de red',
      'Herramientas de instalación',
      'Software de configuración',
    ],
    
    // Metadatos
    createdAt: new Date('2025-01-05T10:00:00'),
    updatedAt: new Date('2025-01-15T16:00:00'),
    createdBy: 'admin',
    assignedTo: 'Elena Torres',
  },
  
  {
    id: 'project-3',
    name: 'Renovación Sistema de Ventilación',
    description: 'Proyecto completado de renovación del sistema de ventilación en las áreas de producción principales, incluyendo instalación de nuevos extractores y filtros.',
    status: ProjectStatus.COMPLETED,
    priority: ProjectPriority.HIGH,
    
    // Lugar y fechas
    location: 'Planta Industrial Norte',
    startDate: new Date('2024-12-01T08:00:00'),
    endDate: new Date('2024-12-20T17:00:00'),
    estimatedDuration: 20, // 20 días
    actualDuration: 19, // Se completó un día antes
    
    // Tareas del proyecto
    taskIds: [], // Tareas históricas
    totalTasks: 8,
    completedTasks: 8,
    
    // Supervisor y observaciones
    supervisorName: 'Carlos Mendoza',
    supervisorEmail: 'carlos.mendoza@empresa.com',
    observations: [
      {
        id: 'obs-6',
        supervisorName: 'Carlos Mendoza',
        supervisorRole: 'Supervisor de Mantenimiento',
        observation: 'Proyecto finalizado exitosamente. Todos los sistemas funcionan correctamente y se han superado las pruebas de eficiencia.',
        date: new Date('2024-12-20T16:30:00'),
        priority: ProjectPriority.LOW,
        isResolved: true,
        resolvedAt: new Date('2024-12-20T17:00:00'),
        resolvedBy: 'Pedro Ramírez',
        resolution: 'Proyecto cerrado con éxito. Documentación archivada.',
      },
      {
        id: 'obs-7',
        supervisorName: 'Carlos Mendoza',
        supervisorRole: 'Supervisor de Mantenimiento',
        observation: 'Excelente coordinación del equipo. Se logró completar el proyecto un día antes de lo previsto.',
        date: new Date('2024-12-19T15:00:00'),
        priority: ProjectPriority.LOW,
        isResolved: true,
        resolvedAt: new Date('2024-12-19T15:05:00'),
        resolvedBy: 'Pedro Ramírez',
        resolution: 'Reconocimiento al equipo registrado.',
      },
    ],
    
    // Progreso
    completionPercentage: 100,
    
    // Equipos y recursos
    assignedTeam: ['Pedro Ramírez', 'Sofia López', 'David García'],
    requiredResources: [
      'Extractores industriales (12 unidades)',
      'Filtros HEPA',
      'Conductos de ventilación',
      'Herramientas especializadas',
      'Andamios y equipos de altura',
    ],
    
    // Metadatos
    createdAt: new Date('2024-11-15T09:00:00'),
    updatedAt: new Date('2024-12-20T17:00:00'),
    createdBy: 'admin',
    assignedTo: 'Pedro Ramírez',
  },
];

// Funciones para manejar proyectos
export const getAllProjects = (): Project[] => {
  return mockProjects;
};

export const getProjectsByStatus = (status: ProjectStatus): Project[] => {
  return mockProjects.filter(project => project.status === status);
};

export const getAssignedProjects = (userId: string): Project[] => {
  return mockProjects.filter(project => 
    project.assignedTo === userId || project.assignedTeam.includes(userId)
  );
};

export const getProjectById = (id: string): Project | undefined => {
  return mockProjects.find(project => project.id === id);
};

export const updateProject = (id: string, updates: Partial<Project>): Project | undefined => {
  const projectIndex = mockProjects.findIndex(project => project.id === id);
  if (projectIndex === -1) return undefined;
  
  mockProjects[projectIndex] = {
    ...mockProjects[projectIndex],
    ...updates,
    updatedAt: new Date(),
  };
  
  return mockProjects[projectIndex];
};

export const addSupervisorObservation = (projectId: string, observation: Omit<SupervisorObservation, 'id'>): Project | undefined => {
  const project = getProjectById(projectId);
  if (!project) return undefined;
  
  const newObservation: SupervisorObservation = {
    ...observation,
    id: `obs-${Date.now()}`,
  };
  
  project.observations.push(newObservation);
  project.updatedAt = new Date();
  
  return project;
};

export const resolveObservation = (projectId: string, observationId: string, resolvedBy: string, resolution: string): Project | undefined => {
  const project = getProjectById(projectId);
  if (!project) return undefined;
  
  const observation = project.observations.find(obs => obs.id === observationId);
  if (!observation) return undefined;
  
  observation.isResolved = true;
  observation.resolvedAt = new Date();
  observation.resolvedBy = resolvedBy;
  observation.resolution = resolution;
  
  project.updatedAt = new Date();
  
  return project;
}; 
import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, View } from 'react-native';
import { Text, Surface, Button, Card, Chip, Icon, IconButton } from 'react-native-paper';
import { formatDate } from '@/utils';
import { isDayReadOnly, isToday } from '@/utils/dateUtils';
import { logger } from '@/utils/logger';
import { supabaseService } from '@/services/supabaseService';
import { TaskStatus, WorkDay, DayStatus, TimesheetStatus } from '@/types';
import { 
  DayTimeCard, 
  NotificationsBell,
  NotificationDialog,
  NFCExternalDialog,
  QRExternalDialog
} from '@/components';

interface HomeScreenProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onNavigateToTask: (taskId: string) => void;
  taskRefreshTrigger?: number;
  simulatedNotification?: any;
  onNotificationHandled?: () => void;
  simulatedExternalNFC?: any;
  onExternalNFCHandled?: () => void;
  simulatedExternalQR?: any;
  onExternalQRHandled?: () => void;
  onTaskTimerChange?: () => void; // Callback para cambios en timers de tareas
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  isDarkMode, 
  toggleTheme,
  onNavigateToTask,
  taskRefreshTrigger,
  simulatedNotification,
  onNotificationHandled,
  simulatedExternalNFC,
  onExternalNFCHandled,
  simulatedExternalQR,
  onExternalQRHandled,
  onTaskTimerChange
}) => {
  const [workDay, setWorkDay] = useState<WorkDay | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingWorkDay, setLoadingWorkDay] = useState(true);
  const [userName, setUserName] = useState<string>('Usuario');
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Estado del temporizador en memoria por fecha (temporal hasta que se creen las tablas)
  const [timerStatesByDate, setTimerStatesByDate] = useState<Record<string, {
    status: TimesheetStatus;
    sessionStart: Date | null;
    totalDuration: number;
    actualStartTime: Date | null;
    actualEndTime: Date | null;
  }>>({});

  // Estado para el usuario autenticado real
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Estado para el dialog de notificación simulada
  const [isNotificationDialogVisible, setIsNotificationDialogVisible] = useState(false);
  
  // Estado para el dialog de NFC externo simulado
  const [isNFCExternalDialogVisible, setIsNFCExternalDialogVisible] = useState(false);
  
  // Estado para el dialog de QR externo simulado
  const [isQRExternalDialogVisible, setIsQRExternalDialogVisible] = useState(false);

  // Estado para forzar re-render del timer cuando cambien timers de tareas
  const [timerUpdateTrigger, setTimerUpdateTrigger] = useState(0);

  // Función para notificar cambios en timers de tareas
  const handleTaskTimerChange = () => {
          logger.timers('Task timer change detected, updating day timer display');
    setTimerUpdateTrigger(prev => prev + 1);
    
    // Notificar al componente padre si hay callback
    if (onTaskTimerChange) {
      onTaskTimerChange();
    }
  };

  // Función para obtener la clave de fecha
  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Función para obtener el estado del temporizador para una fecha específica
  const getTimerStateForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    return timerStatesByDate[dateKey] || {
      status: TimesheetStatus.NOT_STARTED,
      sessionStart: null,
      totalDuration: 0,
      actualStartTime: null,
      actualEndTime: null,
    };
  };

  // Función para actualizar el estado del temporizador para una fecha específica
  const updateTimerStateForDate = (date: Date, newState: Partial<{
    status: TimesheetStatus;
    sessionStart: Date | null;
    totalDuration: number;
    actualStartTime: Date | null;
    actualEndTime: Date | null;
  }>) => {
    const dateKey = getDateKey(date);
    const currentState = getTimerStateForDate(date);
    const updatedState = { ...currentState, ...newState };
    
    setTimerStatesByDate(prev => ({
      ...prev,
      [dateKey]: updatedState
    }));
    
    return updatedState;
  };

  const isReadOnly = workDay ? isDayReadOnly(workDay) : false;

  // Funciones para calcular progreso del día
  const getDayProgress = () => {
    if (!tasks || tasks.length === 0) {
      return {
        tasksCompleted: 0,
        totalTasks: 0,
        subtasksCompleted: 0,
        totalSubtasks: 0,
        tasksPercentage: 0,
        subtasksPercentage: 0,
        overallPercentage: 0
      };
    }

    const tasksCompleted = tasks.filter(task => task.status === 'completed').length;
    const totalTasks = tasks.length;

    let subtasksCompleted = 0;
    let totalSubtasks = 0;

    tasks.forEach(task => {
      if (task.subtasks && Array.isArray(task.subtasks)) {
        totalSubtasks += task.subtasks.length;
        subtasksCompleted += task.subtasks.filter((subtask: any) => subtask.isCompleted).length;
      }
    });

    const tasksPercentage = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
    const subtasksPercentage = totalSubtasks > 0 ? (subtasksCompleted / totalSubtasks) * 100 : 0;
    
    // Calcular porcentaje general ponderado (50% tareas + 50% subtareas)
    const overallPercentage = totalSubtasks > 0 
      ? (tasksPercentage + subtasksPercentage) / 2 
      : tasksPercentage;

    return {
      tasksCompleted,
      totalTasks,
      subtasksCompleted,
      totalSubtasks,
      tasksPercentage,
      subtasksPercentage,
      overallPercentage
    };
  };

  const getMotivationalMessage = (progress: ReturnType<typeof getDayProgress>) => {
    const { overallPercentage, tasksCompleted, totalTasks } = progress;
    
    if (overallPercentage === 100) {
      return "¡Día completado! 🎉";
    } else if (overallPercentage >= 80) {
      return "¡Casi terminas! 💪";
    } else if (overallPercentage >= 50) {
      return "¡Vas muy bien! 👍";
    } else if (overallPercentage >= 25) {
      return "¡Sigue así! 🚀";
    } else if (tasksCompleted === 0 && totalTasks > 0) {
      return "¡Hora de empezar! ⭐";
    } else {
      return "¡Tú puedes! 💜";
    }
  };

  // Mensajes creativos para días sin tareas
  const getRestDayMessage = () => {
    const messages = [
      { text: "Día perfecto para reponer fuerzas", icon: "🌱", color: "#4CAF50" },
      { text: "Descansa y recarga energías", icon: "☀️", color: "#FF9800" },
      { text: "Un día para ti", icon: "🏖️", color: "#2196F3" },
      { text: "Momento de desconectar", icon: "💤", color: "#9C27B0" },
      { text: "Date el regalo del descanso", icon: "🌸", color: "#E91E63" },
      { text: "Hoy es tu día libre", icon: "⭐", color: "#FFC107" },
      { text: "Tiempo de inspirarte", icon: "🎨", color: "#00BCD4" },
      { text: "Respira y disfruta", icon: "🍃", color: "#8BC34A" }
    ];
    
    // Seleccionar mensaje basado en el día del año para consistencia
    const dayOfYear = Math.floor((workDay?.date.getTime() || Date.now()) / (1000 * 60 * 60 * 24));
    return messages[dayOfYear % messages.length];
  };

  // Actualizar tiempo cada segundo para el cronómetro real
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Actualizar cada segundo

    return () => clearInterval(interval);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadUserInfo();
  }, []);

  // Cargar datos del usuario cuando currentUserId esté disponible
  useEffect(() => {
    if (currentUserId) {
      loadWorkDay(); // loadTasks se llama automáticamente dentro de loadWorkDay
      loadNotifications();
    }
  }, [currentUserId]);

  // Efecto para refrescar tareas cuando se actualiza el trigger
  useEffect(() => {
    if (taskRefreshTrigger && taskRefreshTrigger > 0 && currentUserId && workDay) {
      logger.navigation('Trigger de refresh detectado, recargando tareas...');
      loadTasks(workDay.date);
    }
  }, [taskRefreshTrigger, currentUserId, workDay?.date]);

  // Efecto para mostrar notificación simulada
  useEffect(() => {
    if (simulatedNotification) {
      setIsNotificationDialogVisible(true);
    }
  }, [simulatedNotification]);

  // Efecto para mostrar NFC externo simulado
  useEffect(() => {
    if (simulatedExternalNFC) {
      setIsNFCExternalDialogVisible(true);
    }
  }, [simulatedExternalNFC]);

  // Efecto para mostrar QR externo simulado
  useEffect(() => {
    if (simulatedExternalQR) {
      setIsQRExternalDialogVisible(true);
    }
  }, [simulatedExternalQR]);

  const loadUserInfo = async () => {
    try {
      setLoadingUser(true);
      const currentUser = await supabaseService.getCurrentUser();
      
      if (currentUser) {
        // Establecer el ID del usuario autenticado
        setCurrentUserId(currentUser.id);
        
        if (currentUser.profile) {
          setUserName(currentUser.profile.full_name || currentUser.email || 'Usuario');
        } else {
          // Fallback: intentar obtener perfil directamente
          const userProfile = await supabaseService.getUserProfile(currentUser.id);
          setUserName(userProfile?.name || 'Usuario');
        }
        
        logger.database('User info loaded, ID:', currentUser.id);
      } else {
        logger.error('No authenticated user found');
        setUserName('Usuario');
        setCurrentUserId(null);
      }
    } catch (error) {
      logger.error('Error loading user info:', error);
      setUserName('Usuario'); // Fallback si falla
      setCurrentUserId(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadWorkDay = async (date?: Date) => {
    if (!currentUserId) {
      logger.database('Cannot load work day: no authenticated user');
      return;
    }

    try {
      setLoadingWorkDay(true);
      // Usar la fecha actual o la fecha proporcionada
      const targetDate = date || new Date();
      const workDayData = await supabaseService.getOrCreateWorkDay(currentUserId, targetDate);
      
      // Usar los datos de la base de datos que ya incluyen día + tareas
      // Solo sobrescribir el estado de sesión activa si es necesario
      const timerState = getTimerStateForDate(targetDate);
      const workDayWithTimerState: WorkDay = {
        ...workDayData,
        timesheet: {
          ...workDayData.timesheet,
          // Usar totalDuration de la DB que incluye día + tareas
          // Solo sobrescribir si hay un estado local más reciente
          status: timerState.status !== TimesheetStatus.NOT_STARTED ? timerState.status : workDayData.timesheet.status,
          currentSessionStart: timerState.sessionStart || workDayData.timesheet.currentSessionStart,
        },
        actualStartTime: timerState.actualStartTime,
        actualEndTime: timerState.actualEndTime,
      };
      
      setWorkDay(workDayWithTimerState);
      
      
      // Cargar tareas para esta fecha específica
      await loadTasks(targetDate);
    } catch (error) {
      console.error('❌ Error loading work day:', error);
      // Si falla, crear un workDay básico para que no se rompa la UI
      const today = new Date();
      const fallbackWorkDay: WorkDay = {
        id: `fallback-${currentUserId}-${today.toISOString().split('T')[0]}`,
        userId: currentUserId,
        date: date || today,
        status: getTimerStateForDate(date || today).status === TimesheetStatus.COMPLETED ? DayStatus.COMPLETED : DayStatus.PROGRAMMED,
        timesheet: {
          status: getTimerStateForDate(date || today).status,
          currentSessionStart: getTimerStateForDate(date || today).sessionStart || undefined,
          totalDuration: getTimerStateForDate(date || today).totalDuration,
          sessions: [],
        },
        actualStartTime: getTimerStateForDate(date || today).actualStartTime,
        actualEndTime: getTimerStateForDate(date || today).actualEndTime,
        tasks: [],
        notifications: [],
        createdAt: today,
        updatedAt: today,
      };
      setWorkDay(fallbackWorkDay);
      
      // Cargar tareas para esta fecha específica
      await loadTasks(date || today);
    } finally {
      setLoadingWorkDay(false);
    }
  };

  const loadTasks = async (date?: Date) => {
    if (!currentUserId) {
      logger.database('Cannot load tasks: no authenticated user');
      return;
    }

    try {
      setLoadingTasks(true);
      const targetDate = date || new Date();
      const tasksFromDb = await supabaseService.getTasks(currentUserId);
      
      // Filtrar tareas que vencen en la fecha específica
      const tasksForDate = tasksFromDb.filter(task => {
        if (!task.dueDate) return false;
        
        const taskDueDate = new Date(task.dueDate);
        const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const taskDueDateStr = taskDueDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        return taskDueDateStr === targetDateStr;
      });
      
      setTasks(tasksForDate);

    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      // Fallback a datos mock si falla
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadNotifications = async () => {
    if (!currentUserId) {
      logger.database('Cannot load notifications: no authenticated user');
      return;
    }

    try {
      setLoadingNotifications(true);
      const notificationsFromDb = await supabaseService.getWorkNotifications(currentUserId);
      const unreadNotificationsFromDb = await supabaseService.getWorkNotifications(currentUserId, true);
      
      // Mapear las notificaciones de la base de datos al formato esperado por el componente
      const mappedNotifications = notificationsFromDb.map(notification => {
        let actionData = notification.action_data;
        
        // Si action_data es un string JSON, parsearlo
        if (typeof actionData === 'string') {
          try {
            actionData = JSON.parse(actionData);
          } catch (error) {
            console.warn('Error parsing action_data:', error);
            actionData = null;
          }
        }
        
        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isRead: notification.is_read,
          isUrgent: notification.is_urgent,
          actionRequired: notification.action_required,
          actionData: actionData,
          createdAt: new Date(notification.created_at), // Convertir string a Date
          readAt: notification.read_at ? new Date(notification.read_at) : undefined
        };
      });
      
      setNotifications(mappedNotifications);
      setUnreadCount(unreadNotificationsFromDb.length);
      

    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      // Fallback a arrays vacíos si falla
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleDateChange = (date: Date) => {
    loadWorkDay(date);
  };

  const handlePreviousDay = () => {
    if (workDay) {
      const previousDate = new Date(workDay.date);
      previousDate.setDate(previousDate.getDate() - 1);
      loadWorkDay(previousDate);
    }
  };

  const handleNextDay = () => {
    if (workDay) {
      const nextDate = new Date(workDay.date);
      nextDate.setDate(nextDate.getDate() + 1);
      loadWorkDay(nextDate);
    }
  };

  const handleStartTimesheet = async () => {
    if (isReadOnly || !workDay) {
      return;
    }
    
    try {
      // Crear timestamp consistente
      const startTime = new Date();
      
      // 1. Actualizar estado local inmediatamente (sin delay visual)
      const immediateUpdate: WorkDay = {
        ...workDay,
        timesheet: {
          ...workDay.timesheet,
          status: TimesheetStatus.IN_PROGRESS,
          currentSessionStart: startTime,
        },
        actualStartTime: workDay.actualStartTime || startTime,
      };
      setWorkDay(immediateUpdate);
      
      // 2. Después actualizar la base de datos (en background)
      const updatedWorkDay = await supabaseService.updateWorkDayTimesheet(workDay.id, {
        status: TimesheetStatus.IN_PROGRESS,
        currentSessionStart: startTime,
        actualStartTime: workDay.actualStartTime || startTime,
      });
      

      
      // 3. Sincronizar con la respuesta de la DB (mantener el tiempo local)
      const finalUpdate: WorkDay = {
        ...updatedWorkDay,
        timesheet: {
          ...updatedWorkDay.timesheet,
          currentSessionStart: startTime, // Mantener el tiempo exacto del clic
        },
      };
      setWorkDay(finalUpdate);
      
    } catch (error) {
      console.error('❌ Error starting day timer:', error);
      // Fallback a memory mode solo en caso de error
      const now = new Date();
      const newTimerState = updateTimerStateForDate(workDay.date, {
        status: TimesheetStatus.IN_PROGRESS,
        sessionStart: now,
        actualStartTime: getTimerStateForDate(workDay.date).status === TimesheetStatus.NOT_STARTED ? now : getTimerStateForDate(workDay.date).actualStartTime,
      });
      
      const updatedWorkDay: WorkDay = {
        ...workDay,
        timesheet: {
          ...workDay.timesheet,
          status: newTimerState.status,
          currentSessionStart: newTimerState.sessionStart || undefined,
        },
        actualStartTime: newTimerState.actualStartTime,
      };
      
      setWorkDay(updatedWorkDay);
    }
  };

  const handlePauseTimesheet = async () => {
    if (isReadOnly || !workDay) {
      return;
    }
    
    try {
      // Crear timestamp consistente y calcular duración de sesión
      const pauseTime = new Date();
      const sessionStart = workDay.timesheet.currentSessionStart;
      let sessionDuration = 0;
      if (sessionStart) {
        sessionDuration = Math.floor((pauseTime.getTime() - sessionStart.getTime()) / 1000);
      }
      
      // 1. Actualizar estado local inmediatamente (sin delay visual)
      const immediateUpdate: WorkDay = {
        ...workDay,
        timesheet: {
          ...workDay.timesheet,
          status: TimesheetStatus.PAUSED,
          currentSessionStart: null,
          totalDuration: workDay.timesheet.totalDuration + sessionDuration,
        },
      };
      setWorkDay(immediateUpdate);
      
      // 2. Después actualizar la base de datos (en background)
      const updatedWorkDay = await supabaseService.updateWorkDayTimesheet(workDay.id, {
        status: TimesheetStatus.PAUSED,
        currentSessionStart: null,
      });
      

      
      // 3. Usar los datos actualizados de la DB (que incluyen el cálculo correcto del total)
      setWorkDay(updatedWorkDay);
      
    } catch (error) {
      console.error('❌ Error pausing day timer:', error);
      // Fallback a memory mode solo en caso de error
      const now = new Date();
      
      let sessionDuration = 0;
      if (getTimerStateForDate(workDay.date).sessionStart) {
        sessionDuration = Math.floor((now.getTime() - getTimerStateForDate(workDay.date).sessionStart.getTime()) / 1000);
      }
      
      const newTimerState = updateTimerStateForDate(workDay.date, {
        status: TimesheetStatus.PAUSED,
        sessionStart: null,
        totalDuration: getTimerStateForDate(workDay.date).totalDuration + sessionDuration,
      });
      
      const updatedWorkDay: WorkDay = {
        ...workDay,
        timesheet: {
          ...workDay.timesheet,
          status: newTimerState.status,
          currentSessionStart: undefined,
          totalDuration: newTimerState.totalDuration,
        },
      };
      
      setWorkDay(updatedWorkDay);
    }
  };

  const handleFinishTimesheet = async () => {
    if (isReadOnly || !workDay) {
      return;
    }
    
    const now = new Date();
    
    // Si hay una sesión activa, calcular su duración y sumarla al total
    let sessionDuration = 0;
    if (getTimerStateForDate(workDay.date).sessionStart) {
      sessionDuration = Math.floor((now.getTime() - getTimerStateForDate(workDay.date).sessionStart.getTime()) / 1000);
    }
    
    // Actualizar estado del temporizador en memoria
    const newTimerState = updateTimerStateForDate(workDay.date, {
      status: TimesheetStatus.COMPLETED,
      sessionStart: null,
      totalDuration: getTimerStateForDate(workDay.date).totalDuration + sessionDuration,
      actualEndTime: now,
    });
    
    // Actualizar workDay con el nuevo estado
    const updatedWorkDay: WorkDay = {
      ...workDay,
      status: DayStatus.COMPLETED,
      timesheet: {
        ...workDay.timesheet,
        status: newTimerState.status,
        currentSessionStart: undefined,
        totalDuration: newTimerState.totalDuration,
      },
      actualEndTime: now,
    };
    
    setWorkDay(updatedWorkDay);
  };

  const handleNotificationAction = (notificationId: string, actionData?: any) => {
    if (actionData?.taskId) {
      onNavigateToTask(actionData.taskId);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    // Verificar si es una notificación simulada
    if (notificationId.startsWith('simulated-')) {
      console.log('⚠️ Skipping database update for simulated notification:', notificationId);
      
      // Solo actualizar estado local para notificaciones simuladas
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true, readAt: new Date() }
          : notif
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    try {
      console.log('🔄 Marking real notification as read in database:', notificationId);
      await supabaseService.markNotificationAsRead(notificationId);
      
      // Actualizar estado local
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true, readAt: new Date() }
          : notif
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // No bloquear la funcionalidad por errores de marcado
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      // Marcar todas las notificaciones no leídas como leídas
      const unreadNotifications = notifications.filter(notif => !notif.isRead);
      
      await Promise.all(
        unreadNotifications.map(notif => 
          supabaseService.markNotificationAsRead(notif.id)
        )
      );
      
      // Actualizar estado local
      const updatedNotifications = notifications.map(notif => 
        notif.isRead ? notif : { ...notif, isRead: true, readAt: new Date() }
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return '#9E9E9E';
      case TaskStatus.IN_PROGRESS:
        return '#2196F3';
      case TaskStatus.PAUSED:
        return '#FF9800';
      case TaskStatus.COMPLETED:
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'Sin empezar';
      case TaskStatus.IN_PROGRESS:
        return 'En progreso';
      case TaskStatus.PAUSED:
        return 'Pausada';
      case TaskStatus.COMPLETED:
        return 'Finalizada';
      default:
        return 'Desconocido';
    }
  };

  const getTaskProgress = (task: any) => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completedSubtasks = task.subtasks.filter((subtask: any) => subtask.isCompleted).length;
    return (completedSubtasks / task.subtasks.length) * 100;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleTaskPress = (taskId: string) => {
    // Siempre permitir navegación - la lógica de solo lectura se maneja en TaskDetailScreen
    onNavigateToTask(taskId);
  };

  const handleNotificationDialogAccept = async () => {
    setIsNotificationDialogVisible(false);
    
    if (simulatedNotification) {
      // Marcar como leída si tiene ID real
      if (simulatedNotification.id && simulatedNotification.id !== 'simulated') {
        try {
          await supabaseService.markNotificationAsRead(simulatedNotification.id);
          // Recargar notificaciones
          await loadNotifications();
        } catch (error) {
          console.error('Error marking simulated notification as read:', error);
        }
      }
      
      // Ejecutar acción si es necesaria
      if (simulatedNotification.actionRequired && simulatedNotification.actionData?.taskId) {
        onNavigateToTask(simulatedNotification.actionData.taskId);
      }
    }
    
    // Notificar que la notificación fue manejada
    onNotificationHandled?.();
  };

  const handleNotificationDialogDismiss = () => {
    setIsNotificationDialogVisible(false);
    onNotificationHandled?.();
  };

  const handleNFCExternalDialogNavigate = () => {
    setIsNFCExternalDialogVisible(false);
    
    if (simulatedExternalNFC) {
      // Navegar a la tarea que contiene la subtarea NFC
      if (simulatedExternalNFC.taskId) {
        console.log('🎯 Navigating to task with NFC subtask:', simulatedExternalNFC.taskId);
        onNavigateToTask(simulatedExternalNFC.taskId);
      }
    }
    
    // Notificar que el NFC externo fue manejado
    onExternalNFCHandled?.();
  };

  const handleNFCExternalDialogDismiss = () => {
    setIsNFCExternalDialogVisible(false);
    onExternalNFCHandled?.();
  };

  const handleQRExternalDialogNavigate = () => {
    setIsQRExternalDialogVisible(false);
    
    if (simulatedExternalQR) {
      // Navegar a la tarea vinculada al QR
      if (simulatedExternalQR.taskId) {

        onNavigateToTask(simulatedExternalQR.taskId);
      }
    }
    
    // Notificar que el QR externo fue manejado
    onExternalQRHandled?.();
  };

  const handleQRExternalDialogDismiss = () => {
    setIsQRExternalDialogVisible(false);
    onExternalQRHandled?.();
  };

  return (
    <Surface style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.content}>

        {/* Header integrado */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text variant="headlineMedium">
                {loadingUser ? 'Cargando...' : `Hola ${userName}`}
              </Text>
              {isReadOnly && (
                <Chip 
                  mode="outlined"
                  icon="lock"
                  style={styles.readOnlyChip}
                  compact
                >
                  Día pasado - Solo lectura
                </Chip>
              )}
            </View>
            
            <NotificationsBell
              notifications={notifications}
              unreadCount={unreadCount}
              onNotificationAction={handleNotificationAction}
              onMarkAsRead={handleMarkNotificationAsRead}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            />
          </View>
        </View>
        {/* Layout especial para días sin tareas - aparece solo */}
        {!loadingTasks && !loadingWorkDay && tasks.length === 0 ? (
          <View style={styles.restDayContainer}>
            <View style={styles.restDayContent}>
              {/* Navegación de fechas minimalista */}
              <View style={styles.restDayNavigation}>
                <IconButton
                  icon="chevron-left"
                  size={28}
                  onPress={handlePreviousDay}
                  style={styles.restDayNavButton}
                />
                <View style={styles.restDayDateContainer}>
                  <Text variant="bodyLarge" style={styles.restDayDate}>
                    {workDay?.date.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={28}
                  onPress={handleNextDay}
                  style={styles.restDayNavButton}
                />
              </View>

              {/* Ilustración central */}
              <View style={styles.restDayIllustration}>
                <View style={[styles.restDayIconCircle, { backgroundColor: getRestDayMessage().color + '15' }]}>
                  <Text style={styles.restDayMainIcon}>
                    {getRestDayMessage().icon}
                  </Text>
                </View>
                
                {/* Iconos decorativos flotantes */}
                <View style={styles.floatingIcons}>
                  <View style={[styles.floatingIcon, styles.floatingIcon1]}>
                    <Text style={styles.floatingIconText}>🌙</Text>
                  </View>
                  <View style={[styles.floatingIcon, styles.floatingIcon2]}>
                    <Text style={styles.floatingIconText}>✨</Text>
                  </View>
                  <View style={[styles.floatingIcon, styles.floatingIcon3]}>
                    <Text style={styles.floatingIconText}>🕊️</Text>
                  </View>
                </View>
              </View>

              {/* Mensaje principal */}
              <View style={styles.restDayMessage}>
                <Text variant="headlineMedium" style={[styles.restDayTitle, { color: getRestDayMessage().color }]}>
                  {getRestDayMessage().text}
                </Text>
                <Text variant="bodyLarge" style={styles.restDaySubtitle}>
                  No tienes tareas programadas para hoy
                </Text>
              </View>

              {/* Sugerencias creativas */}
              <View style={styles.restDaySuggestions}>
                <Text variant="titleSmall" style={styles.suggestionsTitle}>
                  Aprovecha este tiempo para:
                </Text>
                <View style={styles.suggestionsList}>
                  <View style={styles.suggestionItem}>
                    <Icon source="book-open" size={16} color="#666" />
                    <Text variant="bodyMedium" style={styles.suggestionText}>Leer algo inspirador</Text>
                  </View>
                  <View style={styles.suggestionItem}>
                    <Icon source="nature" size={16} color="#666" />
                    <Text variant="bodyMedium" style={styles.suggestionText}>Dar un paseo al aire libre</Text>
                  </View>
                  <View style={styles.suggestionItem}>
                    <Icon source="coffee" size={16} color="#666" />
                    <Text variant="bodyMedium" style={styles.suggestionText}>Disfrutar de un buen café</Text>
                  </View>
                  <View style={styles.suggestionItem}>
                    <Icon source="heart" size={16} color="#666" />
                    <Text variant="bodyMedium" style={styles.suggestionText}>Conectar contigo mismo</Text>
                  </View>
                </View>
              </View>

              {/* Botón para volver a hoy (si no estamos en hoy) */}
              {workDay && !isToday(workDay.date) && (
                <Button 
                  mode="outlined" 
                  onPress={() => loadWorkDay(new Date())}
                  style={styles.backToTodayButton}
                  icon="calendar-today"
                >
                  Volver a hoy
                </Button>
              )}
            </View>
          </View>
        ) : (
          /* Layout normal para días con tareas o cargando */
          <>
            {/* Card unificada de día y fichaje */}
            {loadingWorkDay ? (
              <Card style={styles.card}>
                <Card.Content>
                  <Text>Cargando información del día...</Text>
                </Card.Content>
              </Card>
            ) : workDay ? (
              <DayTimeCard
                workDay={workDay}
                tasks={tasks}
                onDateChange={handleDateChange}
                onStartTimesheet={handleStartTimesheet}
                onPauseTimesheet={handlePauseTimesheet}
                onFinishTimesheet={handleFinishTimesheet}
                onPreviousDay={handlePreviousDay}
                onNextDay={handleNextDay}
                currentTime={currentTime}
              />
            ) : (
              <Card style={styles.card}>
                <Card.Content>
                  <Text>Error al cargar la información del día</Text>
                </Card.Content>
              </Card>
            )}

            {/* Información del fichaje para días finalizados */}
            {isReadOnly && workDay && workDay.timesheet.status === 'completed' && (
              <Card style={styles.card}>
                <Card.Title 
                  title="Fichaje del día" 
                  subtitle="Información de la jornada completada"
                />
                <Card.Content>
                  <View style={styles.timesheetSummary}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text variant="bodySmall" style={styles.summaryLabel}>Duración total</Text>
                        <Text variant="titleMedium" style={styles.summaryValue}>
                          {formatDuration(workDay?.timesheet.totalDuration || 0)}
                        </Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text variant="bodySmall" style={styles.summaryLabel}>Sesiones</Text>
                        <Text variant="titleMedium" style={styles.summaryValue}>
                          {workDay?.timesheet.sessions.length || 0}
                        </Text>
                      </View>
                    </View>
                    {workDay?.timesheet.notes && (
                      <Text variant="bodySmall" style={styles.timesheetNotes}>
                        {workDay.timesheet.notes}
                      </Text>
                    )}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Progreso del día */}
            {!loadingTasks && tasks.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.progressHeader}>
                    <Icon source="chart-line" size={24} color="#4CAF50" />
                    <Text variant="titleMedium" style={styles.progressTitle}>
                      Progreso del día
                    </Text>
                    <Text variant="bodyMedium" style={styles.motivationalMessage}>
                      {getMotivationalMessage(getDayProgress())}
                    </Text>
                  </View>

                  <View style={styles.progressContent}>
                    {/* Progreso de tareas */}
                    <View style={styles.progressItem}>
                      <View style={styles.progressItemHeader}>
                        <Icon source="clipboard-check" size={16} color="#2196F3" />
                        <Text variant="bodyMedium" style={styles.progressLabel}>
                          Tareas
                        </Text>
                        <Text variant="bodyMedium" style={styles.progressText}>
                          {getDayProgress().tasksCompleted}/{getDayProgress().totalTasks}
                        </Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { 
                              width: `${getDayProgress().tasksPercentage}%`,
                              backgroundColor: getDayProgress().tasksPercentage >= 100 ? '#4CAF50' : '#2196F3'
                            }
                          ]} 
                        />
                      </View>
                    </View>

                    {/* Progreso de subtareas */}
                    {getDayProgress().totalSubtasks > 0 && (
                      <View style={styles.progressItem}>
                        <View style={styles.progressItemHeader}>
                          <Icon source="format-list-checks" size={16} color="#FF9800" />
                          <Text variant="bodyMedium" style={styles.progressLabel}>
                            Subtareas
                          </Text>
                          <Text variant="bodyMedium" style={styles.progressText}>
                            {getDayProgress().subtasksCompleted}/{getDayProgress().totalSubtasks}
                          </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${getDayProgress().subtasksPercentage}%`,
                                backgroundColor: getDayProgress().subtasksPercentage >= 100 ? '#4CAF50' : '#FF9800'
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    )}

                    {/* Progreso general */}
                    <View style={styles.overallProgress}>
                      <View style={styles.overallProgressHeader}>
                        <Text variant="titleSmall" style={styles.overallProgressLabel}>
                          Progreso general
                        </Text>
                        <Text variant="titleSmall" style={[
                          styles.overallProgressPercentage,
                          { color: getDayProgress().overallPercentage >= 100 ? '#4CAF50' : '#666' }
                        ]}>
                          {Math.round(getDayProgress().overallPercentage)}%
                        </Text>
                      </View>
                      <View style={styles.overallProgressBarContainer}>
                        <View 
                          style={[
                            styles.overallProgressBarFill, 
                            { 
                              width: `${getDayProgress().overallPercentage}%`,
                              backgroundColor: getDayProgress().overallPercentage >= 100 
                                ? '#4CAF50' 
                                : getDayProgress().overallPercentage >= 50 
                                ? '#2196F3' 
                                : '#FF9800'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Lista de tareas del día */}
            <View style={styles.sectionHeader}>
              <Text variant="headlineSmall" style={styles.sectionTitle}>
                Tareas del día
              </Text>
              <Text variant="bodyMedium" style={styles.sectionSubtitle}>
                {tasks.length} tareas asignadas
              </Text>
            </View>

            {loadingTasks ? (
              <Card style={styles.taskCard}>
                <Card.Content>
                  <Text>Cargando tareas...</Text>
                </Card.Content>
              </Card>
            ) : (
              tasks.map((task) => (
              <Card 
                key={task.id} 
                style={[
                  styles.taskCard,
                  isReadOnly && styles.taskCardReadOnly
                ]}
                onPress={() => handleTaskPress(task.id)}
              >
                <Card.Content>
                  {/* Título ocupando todo el ancho */}
                  <Text variant="titleMedium" numberOfLines={2} style={styles.taskTitle}>
                    {task.title}
                  </Text>
                  
                  {/* Descripción */}
                  <Text variant="bodySmall" numberOfLines={2} style={styles.taskDescription}>
                    {task.description}
                  </Text>
                  
                  {/* Información del proyecto y ubicación */}
                  <View style={styles.taskMeta}>
                    <View style={styles.taskMetaRow}>
                      <Icon source="folder" size={16} color="#2196F3" />
                      <Text variant="bodySmall" style={styles.taskProject}>
                        {task.projectName}
                      </Text>
                    </View>
                    <View style={styles.taskMetaRow}>
                      <Icon source="map-marker" size={16} color="#4CAF50" />
                      <Text variant="bodySmall" style={styles.taskLocation}>
                        {task.location}
                      </Text>
                    </View>
                  </View>

                  {/* Información adicional con mejor distribución */}
                  <View style={styles.taskInfoGrid}>
                    {/* Fila superior: cronómetro y progreso */}
                    <View style={styles.taskInfoRow}>
                      {task.timer && task.timer.totalElapsed > 0 && (
                        <View style={styles.taskInfoItem}>
                          <View style={styles.taskInfoItemRow}>
                            <Icon source="timer" size={14} color="#2196F3" />
                            <Text variant="bodySmall" style={styles.taskInfoText}>
                              {formatDuration(task.timer.totalElapsed)}
                              {task.timer.isRunning && ' (activo)'}
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      {task.subtasks.length > 0 && (
                        <View style={styles.taskInfoItem}>
                          <View style={styles.taskInfoItemRow}>
                            <Icon source="check-circle" size={14} color="#4CAF50" />
                            <Text variant="bodySmall" style={styles.taskInfoText}>
                              {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length} subtareas
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Fila inferior: asignado, fecha y estado */}
                    <View style={styles.taskFooterRow}>
                      <View style={styles.taskFooterLeft}>
                        <Chip 
                          mode="outlined" 
                          style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
                          textStyle={{ color: getStatusColor(task.status), fontSize: 11 }}
                          compact
                        >
                          {getStatusText(task.status)}
                        </Chip>
                      </View>
                    </View>
                  </View>


                  {/* Progreso de subtareas */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <View style={styles.evidenceProgress}>
                      <View style={styles.evidenceProgressRow}>
                        <Icon source="check-circle" size={14} color="#666" />
                        <Text variant="bodySmall" style={styles.evidenceProgressText}>
                          Progreso: {task.subtasks.filter((s: any) => s.isCompleted).length}/{task.subtasks.length} subtareas
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { width: `${getTaskProgress(task)}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                  
                  {/* Indicador de solo lectura */}
                  {isReadOnly && (
                    <View style={styles.readOnlyIndicator}>
                      <View style={styles.readOnlyRow}>
                        <Icon source="lock" size={14} color="#666" />
                        <Text variant="bodySmall" style={styles.readOnlyText}>
                          Solo lectura
                        </Text>
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>
              ))
            )}
          </>
        )}

        {/* Espacio adicional al final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Dialog de notificación simulada */}
      <NotificationDialog
        visible={isNotificationDialogVisible}
        notification={simulatedNotification}
        onDismiss={handleNotificationDialogDismiss}
        onAccept={handleNotificationDialogAccept}
        onAction={(actionData) => {
          if (actionData?.taskId) {
            onNavigateToTask(actionData.taskId);
          }
        }}
      />

      {/* Dialog de NFC externo simulado */}
      <NFCExternalDialog
        visible={isNFCExternalDialogVisible}
        subtask={simulatedExternalNFC?.subtask}
        nfcData={simulatedExternalNFC ? {
          tagId: simulatedExternalNFC.tagId,
          readAt: simulatedExternalNFC.readAt,
          location: simulatedExternalNFC.location
        } : undefined}
        onDismiss={handleNFCExternalDialogDismiss}
        onNavigateToSubtask={handleNFCExternalDialogNavigate}
      />

      {/* Dialog de QR externo simulado */}
      <QRExternalDialog
        visible={isQRExternalDialogVisible}
        task={simulatedExternalQR?.task}
        qrData={simulatedExternalQR ? {
          qrCode: simulatedExternalQR.qrCode,
          scannedAt: simulatedExternalQR.scannedAt,
          source: simulatedExternalQR.source
        } : undefined}
        onDismiss={handleQRExternalDialogDismiss}
        onNavigateToTask={handleQRExternalDialogNavigate}
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },

  content: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  taskCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 1,
  },
  taskCardReadOnly: {
    opacity: 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  taskTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  taskDescription: {
    marginBottom: 12,
    opacity: 0.7,
    lineHeight: 20,
  },
  taskMeta: {
    marginBottom: 12,
    gap: 6,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskProject: {
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 6,
  },
  taskLocation: {
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
  },
  taskInfoGrid: {
    flexDirection: 'column',
    marginTop: 8,
    gap: 8,
  },
  taskInfoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
  },
  taskInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfoText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  taskFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  taskFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  evidenceProgress: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  evidenceProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  evidenceProgressText: {
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  readOnlyIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readOnlyText: {
    opacity: 0.6,
    fontStyle: 'italic',
    marginLeft: 6,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 16,
  },
  emptyStateText: {
    opacity: 0.6,
  },
  timesheetSummary: {
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  timesheetNotes: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 80, // Espacio para la navbar
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    opacity: 0.7,
  },
  readOnlyChip: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: '#FFC107',
  },
  // Estilos para la barra de progreso del día
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressTitle: {
    flex: 1,
    fontWeight: '600',
  },
  motivationalMessage: {
    fontWeight: '500',
    color: '#4CAF50',
  },
  progressContent: {
    gap: 12,
  },
  progressItem: {
    gap: 8,
  },
  progressItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    flex: 1,
    fontWeight: '500',
  },
  progressText: {
    fontWeight: '600',
    color: '#666',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  overallProgress: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overallProgressLabel: {
    fontWeight: '600',
    color: '#333',
  },
  overallProgressPercentage: {
    fontWeight: '700',
    fontSize: 18,
  },
  overallProgressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  overallProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  // Estilos para el layout de días sin tareas
  restDayContainer: {
    flex: 1,
    minHeight: 500,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  restDayContent: {
    alignItems: 'center',
    gap: 32,
  },
  restDayNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  restDayNavButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  restDayDateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  restDayDate: {
    textTransform: 'capitalize',
    fontWeight: '600',
    color: '#333',
  },
  restDayIllustration: {
    alignItems: 'center',
    position: 'relative',
  },
  restDayIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  restDayMainIcon: {
    fontSize: 48,
  },
  floatingIcons: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  floatingIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingIcon1: {
    top: 20,
    right: 30,
  },
  floatingIcon2: {
    bottom: 40,
    left: 20,
  },
  floatingIcon3: {
    top: 60,
    left: 10,
  },
  floatingIconText: {
    fontSize: 16,
  },
  restDayMessage: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  restDayTitle: {
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 32,
  },
  restDaySubtitle: {
    textAlign: 'center',
    color: '#666',
    opacity: 0.8,
  },
  restDaySuggestions: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  suggestionsTitle: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionsList: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
  },
  suggestionText: {
    flex: 1,
    color: '#666',
  },
  backToTodayButton: {
    marginTop: 16,
    borderColor: '#2196F3',
  },
});

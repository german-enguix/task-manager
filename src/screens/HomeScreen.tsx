import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, View } from 'react-native';
import { Text, Surface, Button, Card, Chip, Icon } from 'react-native-paper';
import { formatDate } from '@/utils';
import { supabaseService } from '@/services/supabaseService';
import { TaskStatus, WorkDay, DayStatus, TimesheetStatus } from '@/types';
import { 
  DayTimeCard, 
  NotificationsBell 
} from '@/components';

interface HomeScreenProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onNavigateToTask: (taskId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  isDarkMode, 
  toggleTheme,
  onNavigateToTask
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

  // Usuario de prueba - en un app real esto vendría del contexto de autenticación
  const currentUserId = '550e8400-e29b-41d4-a716-446655440001';

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

  const isReadOnly = workDay?.status === DayStatus.COMPLETED;

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
    loadWorkDay();
    loadTasks();
    loadNotifications();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoadingUser(true);
      const currentUser = await supabaseService.getCurrentUser();
      
      if (currentUser && currentUser.profile) {
        setUserName(currentUser.profile.full_name || currentUser.email || 'Usuario');
      } else {
        // Fallback: intentar obtener perfil directamente
        const userProfile = await supabaseService.getUserProfile(currentUserId);
        setUserName(userProfile?.name || 'Usuario');
      }
      
      console.log('✅ User info loaded');
    } catch (error) {
      console.error('❌ Error loading user info:', error);
      setUserName('Usuario'); // Fallback si falla
    } finally {
      setLoadingUser(false);
    }
  };

  const loadWorkDay = async (date?: Date) => {
    try {
      setLoadingWorkDay(true);
      // Usar la fecha actual o la fecha proporcionada
      const targetDate = date || new Date();
      console.log('🔄 Loading work day for user:', currentUserId, 'date:', targetDate.toDateString());
      const workDayData = await supabaseService.getOrCreateWorkDay(currentUserId, targetDate);
      console.log('✅ Work day loaded:', workDayData);
      
      // Integrar el estado del temporizador con el workDay
      const workDayWithTimerState: WorkDay = {
        ...workDayData,
        timesheet: {
          ...workDayData.timesheet,
          status: getTimerStateForDate(targetDate).status,
          currentSessionStart: getTimerStateForDate(targetDate).sessionStart,
          totalDuration: getTimerStateForDate(targetDate).totalDuration,
        },
        actualStartTime: getTimerStateForDate(targetDate).actualStartTime,
        actualEndTime: getTimerStateForDate(targetDate).actualEndTime,
      };
      
      setWorkDay(workDayWithTimerState);
      console.log('✅ Work day state updated with timer state');
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
          currentSessionStart: getTimerStateForDate(date || today).sessionStart,
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
    } finally {
      setLoadingWorkDay(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const tasksFromDb = await supabaseService.getTasks(currentUserId);
      setTasks(tasksFromDb);
      console.log('✅ Tasks loaded from Supabase:', tasksFromDb.length);
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      // Fallback a datos mock si falla
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const notificationsFromDb = await supabaseService.getWorkNotifications(currentUserId);
      const unreadNotificationsFromDb = await supabaseService.getWorkNotifications(currentUserId, true);
      
      setNotifications(notificationsFromDb);
      setUnreadCount(unreadNotificationsFromDb.length);
      
      console.log('✅ Notifications loaded from Supabase:', {
        total: notificationsFromDb.length,
        unread: unreadNotificationsFromDb.length
      });
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
    console.log('🚀 handleStartTimesheet called');
    console.log('📊 isReadOnly:', isReadOnly);
    console.log('📊 workDay:', workDay);
    console.log('📊 current timerState:', getTimerStateForDate(workDay.date));
    
    if (isReadOnly || !workDay) {
      console.log('❌ Cancelled: isReadOnly or no workDay');
      return;
    }
    
    const now = new Date();
    
    // Actualizar estado del temporizador en memoria
    const newTimerState = updateTimerStateForDate(workDay.date, {
      status: TimesheetStatus.IN_PROGRESS,
      sessionStart: now,
      actualStartTime: getTimerStateForDate(workDay.date).status === TimesheetStatus.NOT_STARTED ? now : getTimerStateForDate(workDay.date).actualStartTime,
    });
    
    // Actualizar workDay con el nuevo estado
    const updatedWorkDay: WorkDay = {
      ...workDay,
      timesheet: {
        ...workDay.timesheet,
        status: newTimerState.status,
        currentSessionStart: newTimerState.sessionStart,
      },
      actualStartTime: newTimerState.actualStartTime,
    };
    
    setWorkDay(updatedWorkDay);
    console.log('✅ Timesheet started successfully (memory mode)');
  };

  const handlePauseTimesheet = async () => {
    console.log('⏸️ handlePauseTimesheet called');
    console.log('📊 current timerState:', getTimerStateForDate(workDay.date));
    
    if (isReadOnly || !workDay) {
      console.log('❌ Cancelled: isReadOnly or no workDay');
      return;
    }
    
    const now = new Date();
    
    // Calcular tiempo de la sesión actual y sumarlo al total
    let sessionDuration = 0;
    if (getTimerStateForDate(workDay.date).sessionStart) {
      sessionDuration = Math.floor((now.getTime() - getTimerStateForDate(workDay.date).sessionStart.getTime()) / 1000);
    }
    
    // Actualizar estado del temporizador en memoria
    const newTimerState = updateTimerStateForDate(workDay.date, {
      status: TimesheetStatus.PAUSED,
      sessionStart: null,
      totalDuration: getTimerStateForDate(workDay.date).totalDuration + sessionDuration,
    });
    
    // Actualizar workDay con el nuevo estado
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
    console.log('✅ Timesheet paused successfully (memory mode). Session duration:', sessionDuration, 'Total duration:', newTimerState.totalDuration);
  };

  const handleFinishTimesheet = async () => {
    console.log('🏁 handleFinishTimesheet called');
    console.log('📊 current timerState:', getTimerStateForDate(workDay.date));
    
    if (isReadOnly || !workDay) {
      console.log('❌ Cancelled: isReadOnly or no workDay');
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
    console.log('✅ Timesheet finished successfully (memory mode). Final duration:', newTimerState.totalDuration);
  };

  const handleNotificationAction = (notificationId: string, actionData?: any) => {
    if (actionData?.taskId) {
      onNavigateToTask(actionData.taskId);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await supabaseService.markNotificationAsRead(notificationId);
      
      // Actualizar estado local
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true, read_at: new Date().toISOString() }
          : notif
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      // Marcar todas las notificaciones no leídas como leídas
      const unreadNotifications = notifications.filter(notif => !notif.is_read);
      
      await Promise.all(
        unreadNotifications.map(notif => 
          supabaseService.markNotificationAsRead(notif.id)
        )
      );
      
      // Actualizar estado local
      const updatedNotifications = notifications.map(notif => 
        notif.is_read ? notif : { ...notif, is_read: true, read_at: new Date().toISOString() }
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
    if (!isReadOnly) {
      onNavigateToTask(taskId);
    }
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
                    <View style={styles.taskInfoItemRow}>
                      <Icon source="account" size={14} color="#666" />
                      <Text variant="bodySmall" style={[styles.taskInfoText, { color: '#666' }]}>
                        Usuario de Prueba
                      </Text>
                    </View>
                    
                    {task.dueDate && (
                      <View style={styles.taskInfoItemRow}>
                        <Icon source="calendar" size={14} color="#666" />
                        <Text variant="bodySmall" style={[styles.taskInfoText, { color: '#666' }]}>
                          {task.dueDate.toLocaleDateString('es-ES')}
                        </Text>
                      </View>
                    )}
                  </View>
                  
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
        
        {!loadingTasks && tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={styles.emptyStateText}>
              {isReadOnly ? 'No hubo tareas asignadas este día' : 'No hay tareas asignadas para hoy'}
            </Text>
          </View>
        )}

        {/* Espacio adicional al final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
});

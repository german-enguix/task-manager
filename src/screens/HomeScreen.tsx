import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, View } from 'react-native';
import { Text, Surface, Button, Card, Chip, Icon } from 'react-native-paper';
import { formatDate } from '@/utils';
import { 
  getCurrentWorkDay, 
  updateWorkDay, 
  updateTimesheet, 
  getWorkDayByDate,
  getAllNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/utils/mockData';
import { TaskStatus, WorkDay, DayStatus } from '@/types';
import { 
  DayTimeCard, 
  NotificationsBell 
} from '@/components';
import { SupabaseTest } from '@/components/SupabaseTest';

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
  const [workDay, setWorkDay] = useState<WorkDay>(getCurrentWorkDay());
  const [notifications, setNotifications] = useState(getAllNotifications());
  const [unreadCount, setUnreadCount] = useState(getUnreadNotificationsCount());
  const [currentTime, setCurrentTime] = useState(new Date());

  const isReadOnly = workDay.status === DayStatus.COMPLETED;

  // Actualizar tiempo cada minuto para el cronómetro
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  const handleDateChange = (date: Date) => {
    const newWorkDay = getWorkDayByDate(date);
    if (newWorkDay) {
      setWorkDay(newWorkDay);
    }
  };

  const handleStartTimesheet = () => {
    if (isReadOnly) return;
    
    const now = new Date();
    const updates = {
      status: 'in_progress' as any,
      currentSessionStart: now,
    };
    const updatedWorkDay = updateTimesheet(updates);
    setWorkDay(updatedWorkDay);
  };

  const handlePauseTimesheet = () => {
    if (isReadOnly) return;
    
    const updates = {
      status: 'paused' as any,
      currentSessionStart: undefined,
    };
    const updatedWorkDay = updateTimesheet(updates);
    setWorkDay(updatedWorkDay);
  };

  const handleFinishTimesheet = () => {
    if (isReadOnly) return;
    
    const updates = {
      status: 'completed' as any,
      currentSessionStart: undefined,
    };
    const updatedWorkDay = updateTimesheet(updates);
    setWorkDay(updatedWorkDay);
  };

  const handleNotificationAction = (notificationId: string, actionData?: any) => {
    if (actionData?.taskId) {
      onNavigateToTask(actionData.taskId);
    }
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    setNotifications(getAllNotifications());
    setUnreadCount(getUnreadNotificationsCount());
  };

  const handleMarkAllNotificationsAsRead = () => {
    markAllNotificationsAsRead();
    setNotifications(getAllNotifications());
    setUnreadCount(getUnreadNotificationsCount());
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
    if (task.requiredEvidences.length === 0) return 0;
    const completedEvidences = task.requiredEvidences.filter((e: any) => e.isCompleted).length;
    return (completedEvidences / task.requiredEvidences.length) * 100;
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
        {/* Prueba temporal de Supabase */}
        <SupabaseTest />
        
        {/* Header integrado */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text variant="headlineMedium">
                Mi Día
              </Text>
              <Text variant="bodyMedium">
                {formatDate(new Date())}
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
        <DayTimeCard
          workDay={workDay}
          onDateChange={handleDateChange}
          onStartTimesheet={handleStartTimesheet}
          onPauseTimesheet={handlePauseTimesheet}
          onFinishTimesheet={handleFinishTimesheet}
          currentTime={currentTime}
        />

        {/* Información del fichaje para días finalizados */}
        {isReadOnly && workDay.timesheet.status === 'completed' && (
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
                      {formatDuration(workDay.timesheet.totalDuration)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>Sesiones</Text>
                    <Text variant="titleMedium" style={styles.summaryValue}>
                      {workDay.timesheet.sessions.length}
                    </Text>
                  </View>
                </View>
                {workDay.timesheet.notes && (
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
            {workDay.tasks.length} tareas asignadas
          </Text>
        </View>

        {workDay.tasks.map((task) => (
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
                  {task.timer.totalElapsed > 0 && (
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
                    {task.assignedTo && (
                      <View style={styles.taskInfoItemRow}>
                        <Icon source="account" size={14} color="#666" />
                        <Text variant="bodySmall" style={[styles.taskInfoText, { color: '#666' }]}>
                          {task.assignedTo}
                        </Text>
                      </View>
                    )}
                    
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

              {/* Progreso de evidencias (si existen) */}
              {task.requiredEvidences.length > 0 && (
                <View style={styles.evidenceProgress}>
                  <View style={styles.evidenceProgressRow}>
                    <Icon source="attachment" size={14} color="#666" />
                    <Text variant="bodySmall" style={styles.evidenceProgressText}>
                      Evidencias: {task.requiredEvidences.filter(e => e.isCompleted).length}/{task.requiredEvidences.length}
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
        ))}
        
        {workDay.tasks.length === 0 && (
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

import React, { useState } from 'react';
import { ScrollView, Alert, StyleSheet, View } from 'react-native';
import { Text, Surface, Button, Card, IconButton, Switch, Chip } from 'react-native-paper';
import { formatDate } from '@/utils';
import { 
  getCurrentWorkDay, 
  updateWorkDay, 
  updateTimesheet, 
  markNotificationAsRead 
} from '@/utils/mockData';
import { TaskStatus, WorkDay } from '@/types';
import { 
  DayHeader, 
  TimesheetWidget, 
  NotificationsSection 
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
  const [workDay, setWorkDay] = useState<WorkDay>(getCurrentWorkDay());

  const handleTimesheetUpdate = (updates: Partial<WorkDay['timesheet']>) => {
    const updatedWorkDay = updateTimesheet(updates);
    setWorkDay(updatedWorkDay);
  };

  const handleNotificationAction = (notificationId: string, actionData?: any) => {
    if (actionData?.taskId) {
      onNavigateToTask(actionData.taskId);
    }
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
    const updatedWorkDay = markNotificationAsRead(notificationId);
    setWorkDay(updatedWorkDay);
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

  return (
    <Surface style={styles.container}>
      {/* Header with Dark Mode Toggle */}
      <Surface elevation={2} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text variant="headlineMedium">
              Mi Día
            </Text>
            <Text variant="bodyMedium">
              {formatDate(new Date())}
            </Text>
          </View>
          
          <View style={styles.themeToggle}>
            <IconButton
              icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
              size={24}
              onPress={toggleTheme}
            />
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </View>
      </Surface>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Encabezado del día */}
        <DayHeader workDay={workDay} />

        {/* Widget de fichaje */}
        <TimesheetWidget 
          workDay={workDay} 
          onTimesheetUpdate={handleTimesheetUpdate}
        />

        {/* Notificaciones */}
        <NotificationsSection 
          workDay={workDay}
          onNotificationAction={handleNotificationAction}
          onMarkAsRead={handleMarkNotificationAsRead}
        />

        {/* Lista de tareas del día */}
        <Card style={styles.card}>
          <Card.Title 
            title="Tareas del día" 
            subtitle={`${workDay.tasks.length} tareas asignadas`}
          />
          <Card.Content>
            {workDay.tasks.map((task) => (
              <Card 
                key={task.id} 
                style={styles.taskCard}
                onPress={() => onNavigateToTask(task.id)}
              >
                <Card.Content>
                  <View style={styles.taskHeader}>
                    <Text variant="titleMedium" numberOfLines={1} style={styles.taskTitle}>
                      {task.title}
                    </Text>
                    <Chip 
                      mode="outlined" 
                      style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
                      textStyle={{ color: getStatusColor(task.status), fontSize: 12 }}
                    >
                      {getStatusText(task.status)}
                    </Chip>
                  </View>
                  
                  <Text variant="bodySmall" numberOfLines={2} style={styles.taskDescription}>
                    {task.description}
                  </Text>
                  
                  <View style={styles.taskFooter}>
                    <Text variant="bodySmall" style={styles.taskAssignee}>
                      Asignado a: {task.assignedTo}
                    </Text>
                    {task.dueDate && (
                      <Text variant="bodySmall" style={styles.taskDueDate}>
                        Vence: {task.dueDate.toLocaleDateString('es-ES')}
                      </Text>
                    )}
                  </View>
                  
                  {/* Información del cronómetro */}
                  {task.timer.totalElapsed > 0 && (
                    <View style={styles.taskTimer}>
                      <Text variant="bodySmall" style={styles.taskTimerText}>
                        ⏱️ Tiempo: {formatDuration(task.timer.totalElapsed)}
                        {task.timer.isRunning && ' (activo)'}
                      </Text>
                    </View>
                  )}
                  
                  {/* Progreso de subtareas */}
                  {task.subtasks.length > 0 && (
                    <View style={styles.taskProgress}>
                      <Text variant="bodySmall" style={styles.taskProgressText}>
                        ✅ Subtareas: {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                      </Text>
                    </View>
                  )}
                  
                  {/* Progreso de evidencias */}
                  {task.requiredEvidences.length > 0 && (
                    <View style={styles.evidenceProgress}>
                      <Text variant="bodySmall" style={styles.evidenceProgressText}>
                        📎 Evidencias: {task.requiredEvidences.filter(e => e.isCompleted).length}/{task.requiredEvidences.length}
                      </Text>
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
                </Card.Content>
              </Card>
            ))}
            
            {workDay.tasks.length === 0 && (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                  No hay tareas asignadas para hoy
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

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
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  taskCard: {
    marginBottom: 12,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  taskDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskAssignee: {
    fontWeight: '500',
  },
  taskDueDate: {
    opacity: 0.7,
  },
  taskTimer: {
    marginBottom: 4,
  },
  taskTimerText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  taskProgress: {
    marginBottom: 4,
  },
  taskProgressText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  evidenceProgress: {
    marginTop: 4,
  },
  evidenceProgressText: {
    marginBottom: 4,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 24,
  },
});

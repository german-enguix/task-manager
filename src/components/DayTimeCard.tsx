import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Text, 
  IconButton, 
  Button,
  useTheme,
  Portal,
  Modal,
  Surface,
  Icon
} from 'react-native-paper';
import { DatePill } from '@/components/DatePill';
import { DatePickerModal } from 'react-native-paper-dates';
import { formatDayShort } from '@/utils';
import { WorkDay, TimesheetStatus, DayStatus } from '@/types';

interface DayTimeCardProps {
  workDay: WorkDay;
  tasks: any[]; // Array de tareas del día
  onDateChange: (date: Date) => void;
  onStartTimesheet: () => void;
  onPauseTimesheet: () => void;
  onFinishTimesheet: () => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  currentTime: Date;
}

export const DayTimeCard: React.FC<DayTimeCardProps> = ({
  workDay,
  tasks,
  onDateChange,
  onStartTimesheet,
  onPauseTimesheet,
  onFinishTimesheet,
  onPreviousDay,
  onNextDay,
  currentTime
}) => {
  const theme = useTheme();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const { timesheet } = workDay;

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSessionDuration = (): number => {
    if (!timesheet.currentSessionStart) return 0;
    return Math.floor((currentTime.getTime() - timesheet.currentSessionStart.getTime()) / 1000);
  };

  // Calcular tiempo actual de tareas en ejecución
  const getTasksCurrentTime = (): number => {
    if (!tasks || tasks.length === 0) return 0;
    
    let totalTaskTime = 0;
    
    tasks.forEach(task => {
      if (task.timer) {
        // Sumar tiempo acumulado de la tarea
        totalTaskTime += task.timer.totalElapsed || 0;
        
        // Si la tarea está corriendo, agregar tiempo de sesión actual
        if (task.timer.isRunning && task.timer.currentSessionStart) {
          const sessionTime = Math.floor((currentTime.getTime() - task.timer.currentSessionStart.getTime()) / 1000);
          totalTaskTime += sessionTime;
        }
      }
    });
    
    return totalTaskTime;
  };

  // Obtener número de tareas con timer activo
  const getActiveTasksCount = (): number => {
    if (!tasks || tasks.length === 0) return 0;
    return tasks.filter(task => task.timer?.isRunning).length;
  };

  // Tiempo total ya calculado en la base de datos (work_day.actual_duration + tasks.timer_total_elapsed)
  const getTotalDisplayDuration = useMemo((): number => {
    const now = new Date(); // Usar tiempo exacto actual para todos los cálculos
    let totalTime = timesheet.totalDuration || 0; // Ya incluye día + tareas acumuladas desde DB
    
    // Solo sumar sesión actual del día si está corriendo
    if (timesheet.status === TimesheetStatus.IN_PROGRESS && timesheet.currentSessionStart) {
      const sessionTime = Math.floor((now.getTime() - timesheet.currentSessionStart.getTime()) / 1000);
      totalTime += sessionTime;
    }
    
    // Sumar sesiones actuales de tareas activas
    tasks?.forEach(task => {
      if (task.timer?.isRunning && task.timer.currentSessionStart) {
        const sessionTime = Math.floor((now.getTime() - task.timer.currentSessionStart.getTime()) / 1000);
        totalTime += sessionTime;
      }
    });
    
    return totalTime;
  }, [timesheet.totalDuration, timesheet.status, timesheet.currentSessionStart, currentTime, tasks]); // currentTime como dependencia para actualizar cada segundo

  // Solo tiempo del día independiente (para el desglose)
  const getDayOnlyDuration = 0; // Simplificado por ahora

  const formatDayOfWeek = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  const formatDate = (date: Date): string => {
    // Usar util para no incluir año
    return `${date.getDate()} de ${date.toLocaleString('es-ES', { month: 'long' })}`;
  };



  const today = new Date();
  const isToday = workDay.date.toDateString() === today.toDateString();
  const isCompleted = timesheet.status === TimesheetStatus.COMPLETED;
  
  // Usar la fecha actual real si es hoy, sino usar la fecha del workDay
  const displayDate = isToday ? today : workDay.date;

  const handleDateConfirm = (params: any) => {
    if (params.date) {
      onDateChange(params.date);
    }
    setDatePickerVisible(false);
  };

  const renderTimesheetControls = () => {
    if (isCompleted) {
      return (
        <View style={styles.completedContainer}>
          <View style={styles.completedRow}>
            <Icon source="check-circle" size={18} color="#4CAF50" />
            <Text variant="bodyMedium" style={styles.completedText}>
              Fichaje completado
            </Text>
          </View>
        </View>
      );
    }

    switch (timesheet.status) {
      case TimesheetStatus.NOT_STARTED:
        return (
          <Button
            mode="contained"
            onPress={onStartTimesheet}
            style={styles.startButton}
            icon="play"
          >
            Iniciar Fichaje
          </Button>
        );

      case TimesheetStatus.IN_PROGRESS:
        return (
          <Button
            mode="contained"
            onPress={onPauseTimesheet}
            style={styles.startButton}
            icon="pause"
          >
            Pausar
          </Button>
        );

      case TimesheetStatus.PAUSED:
        return (
          <Button
            mode="contained"
            onPress={onStartTimesheet}
            style={styles.startButton}
            icon="play"
          >
            Reanudar
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          {/* Selector de fecha (píldora) */}
          <DatePill
            label={`${formatDayShort(displayDate)}, ${formatDate(displayDate)}`}
            onPrev={onPreviousDay}
            onNext={onNextDay}
            onOpenPicker={() => setDatePickerVisible(true)}
          />

          {/* Cronómetro */}
          <View style={[styles.timerSection, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.timerContainer}>
              <Text variant="displayMedium" style={[styles.timerDisplay, { color: theme.colors.primary }]}>
                {formatDuration(getTotalDisplayDuration)}
              </Text>
              {(timesheet.status === TimesheetStatus.IN_PROGRESS || getActiveTasksCount() > 0) && (
                <View style={styles.runningIndicator}>
                  <Icon source="play-circle" size={16} color={theme.colors.primary} />
                  <Text variant="bodySmall" style={[styles.runningText, { color: theme.colors.primary }]}>
                    {timesheet.status === TimesheetStatus.IN_PROGRESS && getActiveTasksCount() > 0 
                      ? `Día + ${getActiveTasksCount()} tarea${getActiveTasksCount() > 1 ? 's' : ''} activa${getActiveTasksCount() > 1 ? 's' : ''}`
                      : timesheet.status === TimesheetStatus.IN_PROGRESS 
                      ? 'Timer del día activo'
                      : `${getActiveTasksCount()} tarea${getActiveTasksCount() > 1 ? 's' : ''} activa${getActiveTasksCount() > 1 ? 's' : ''}`
                    }
                  </Text>
                </View>
              )}
            </View>
            
            {/* Desglose de tiempo */}
            {(getDayOnlyDuration > 0 || getTasksCurrentTime() > 0) && (
              <View style={styles.timeBreakdown}>
                {getDayOnlyDuration > 0 && (
                  <View style={styles.breakdownItem}>
                    <Icon source="calendar-today" size={12} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={styles.breakdownText}>
                      Día: {formatDuration(getDayOnlyDuration)}
                    </Text>
                    {timesheet.status === TimesheetStatus.IN_PROGRESS && (
                      <Icon source="play" size={10} color={theme.colors.primary} />
                    )}
                  </View>
                )}
                {getTasksCurrentTime() > 0 && (
                  <View style={styles.breakdownItem}>
                    <Icon source="clipboard-text" size={12} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={styles.breakdownText}>
                      Tareas: {formatDuration(getTasksCurrentTime())}
                    </Text>
                    {getActiveTasksCount() > 0 && (
                      <Icon source="play" size={10} color={theme.colors.primary} />
                    )}
                  </View>
                )}
              </View>
            )}
            
            <Text variant="bodySmall" style={[styles.timerLabel, { color: theme.colors.onSurfaceVariant }]}>
              Tiempo total trabajado
            </Text>
          </View>

          {/* Controles de fichaje */}
          <View style={styles.controlsSection}>
            {renderTimesheetControls()}
          </View>
        </Card.Content>
      </Card>

      {/* DatePicker Modal */}
      <Portal>
        <DatePickerModal
          locale="es"
          mode="single"
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          date={workDay.date}
          onConfirm={handleDateConfirm}
          label="Seleccionar fecha"
          saveLabel="Confirmar"
        />
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  content: {
    paddingVertical: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateInfoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeek: {
    textTransform: 'capitalize',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dateText: {
    opacity: 0.7,
  },
  navButton: {
    margin: 0,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerDisplay: {
    fontWeight: '700',
    textAlign: 'center',
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  runningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timerLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  controlsSection: {
    alignItems: 'center',
  },
  startButton: {
    minWidth: 200,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  timeBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownText: {
    fontSize: 12,
    color: '#666',
  },
}); 
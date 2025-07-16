import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Card, 
  Text, 
  IconButton, 
  Button,
  useTheme,
  Portal,
  Modal,
  Surface,
  Chip,
  Icon
} from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { WorkDay, TimesheetStatus, DayStatus } from '@/types';

interface DayTimeCardProps {
  workDay: WorkDay;
  onDateChange: (date: Date) => void;
  onStartTimesheet: () => void;
  onPauseTimesheet: () => void;
  onFinishTimesheet: () => void;
  currentTime: Date;
}

export const DayTimeCard: React.FC<DayTimeCardProps> = ({
  workDay,
  onDateChange,
  onStartTimesheet,
  onPauseTimesheet,
  onFinishTimesheet,
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

  const getTotalDisplayDuration = (): number => {
    // Si hay una sesión activa, sumar el tiempo de la sesión actual al tiempo total
    const currentSessionDuration = timesheet.status === TimesheetStatus.IN_PROGRESS ? getCurrentSessionDuration() : 0;
    const totalDuration = timesheet.totalDuration + currentSessionDuration;
    
    // Debug: log the calculation
    if (timesheet.status === TimesheetStatus.IN_PROGRESS) {
      console.log('⏰ Timer calculation:', {
        totalDuration: timesheet.totalDuration,
        currentSessionDuration,
        finalTotal: totalDuration,
        sessionStart: timesheet.currentSessionStart?.toLocaleTimeString(),
        currentTime: currentTime.toLocaleTimeString()
      });
    }
    
    return totalDuration;
  };

  const formatDayOfWeek = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDayStatusLabel = (): string => {
    return workDay.status === DayStatus.COMPLETED ? 'Finalizado' : '';
  };

  const getDayStatusColor = (): string => {
    return workDay.status === DayStatus.COMPLETED ? '#4CAF50' : '#2196F3';
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
          <View style={styles.controlButtons}>
            <Button
              mode="outlined"
              onPress={onPauseTimesheet}
              style={styles.actionButton}
              icon="pause"
            >
              Pausar
            </Button>
            <Button
              mode="contained"
              onPress={onFinishTimesheet}
              style={styles.actionButton}
              icon="check"
            >
              Finalizar
            </Button>
          </View>
        );

      case TimesheetStatus.PAUSED:
        return (
          <View style={styles.controlButtons}>
            <Button
              mode="contained"
              onPress={onStartTimesheet}
              style={styles.actionButton}
              icon="play"
            >
              Reanudar
            </Button>
            <Button
              mode="outlined"
              onPress={onFinishTimesheet}
              style={styles.actionButton}
              icon="check"
            >
              Finalizar
            </Button>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card style={styles.container}>
        <Card.Content style={styles.content}>
          {/* Selector de fecha y tag de estado */}
          <View style={styles.dateSelector}>
            <View style={styles.dateInfo}>
              <Text variant="headlineSmall" style={styles.dayOfWeek}>
                {formatDayOfWeek(displayDate)}
              </Text>
              <Text variant="titleMedium" style={styles.dateText}>
                {formatDate(displayDate)}
              </Text>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getDayStatusColor() + '20' }]}
                textStyle={[styles.statusChipText, { color: getDayStatusColor() }]}
                compact
              >
                {getDayStatusLabel()}
              </Chip>
            </View>
            
            <IconButton
              icon="calendar"
              size={24}
              onPress={() => setDatePickerVisible(true)}
              style={styles.calendarButton}
            />
          </View>

          {/* Cronómetro */}
          <View style={styles.timerSection}>
            <View style={styles.timerContainer}>
              <Text variant="displayMedium" style={[styles.timerDisplay, { color: theme.colors.primary }]}>
                {formatDuration(getTotalDisplayDuration())}
              </Text>
              {timesheet.status === TimesheetStatus.IN_PROGRESS && (
                <View style={styles.runningIndicator}>
                  <Icon source="play-circle" size={16} color={theme.colors.primary} />
                  <Text variant="bodySmall" style={[styles.runningText, { color: theme.colors.primary }]}>
                    En marcha
                  </Text>
                </View>
              )}
            </View>
            <Text variant="bodySmall" style={styles.timerLabel}>
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
    paddingVertical: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dateInfo: {
    flex: 1,
  },
  dayOfWeek: {
    textTransform: 'capitalize',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    opacity: 0.7,
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarButton: {
    margin: 0,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
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
}); 
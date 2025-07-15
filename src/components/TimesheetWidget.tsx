import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme, Icon } from 'react-native-paper';
import { WorkDay, TimesheetStatus } from '@/types';

interface TimesheetWidgetProps {
  workDay: WorkDay;
  onTimesheetUpdate: (updates: Partial<WorkDay['timesheet']>) => void;
}

export const TimesheetWidget: React.FC<TimesheetWidgetProps> = ({ 
  workDay, 
  onTimesheetUpdate 
}) => {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { timesheet } = workDay;

  // Actualizar tiempo actual cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getCurrentSessionDuration = (): number => {
    if (!timesheet.currentSessionStart) return 0;
    return Math.floor((currentTime.getTime() - timesheet.currentSessionStart.getTime()) / 1000);
  };

  const getTotalDisplayDuration = (): number => {
    const currentSessionDuration = timesheet.status === TimesheetStatus.IN_PROGRESS ? getCurrentSessionDuration() : 0;
    return timesheet.totalDuration + currentSessionDuration;
  };

  const handleStartTimesheet = () => {
    const now = new Date();
    onTimesheetUpdate({
      status: TimesheetStatus.IN_PROGRESS,
      currentSessionStart: now,
    });
  };

  const handlePauseTimesheet = () => {
    if (!timesheet.currentSessionStart) return;
    
    const now = new Date();
    const sessionDuration = Math.floor((now.getTime() - timesheet.currentSessionStart.getTime()) / 1000);
    
    const newSession = {
      id: `session-${Date.now()}`,
      startTime: timesheet.currentSessionStart,
      endTime: now,
      duration: sessionDuration,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
      },
    };

    onTimesheetUpdate({
      status: TimesheetStatus.PAUSED,
      totalDuration: timesheet.totalDuration + sessionDuration,
      currentSessionStart: undefined,
      sessions: [...timesheet.sessions, newSession],
    });
  };

  const handleCompleteTimesheet = () => {
    if (timesheet.currentSessionStart) {
      // Si hay una sesión activa, primero pausarla
      handlePauseTimesheet();
    }
    
    onTimesheetUpdate({
      status: TimesheetStatus.COMPLETED,
    });
  };

  const getStatusColor = () => {
    switch (timesheet.status) {
      case TimesheetStatus.IN_PROGRESS:
        return theme.colors.primary;
      case TimesheetStatus.PAUSED:
        return theme.colors.secondary;
      case TimesheetStatus.COMPLETED:
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = () => {
    switch (timesheet.status) {
      case TimesheetStatus.IN_PROGRESS:
        return 'En progreso';
      case TimesheetStatus.PAUSED:
        return 'Pausado';
      case TimesheetStatus.COMPLETED:
        return 'Completado';
      default:
        return 'Sin iniciar';
    }
  };

  const getStatusIcon = () => {
    switch (timesheet.status) {
      case TimesheetStatus.IN_PROGRESS:
        return 'play-circle';
      case TimesheetStatus.PAUSED:
        return 'pause-circle';
      case TimesheetStatus.COMPLETED:
        return 'check-circle';
      default:
        return 'clock-outline';
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.statusRow}>
            <Icon 
              source={getStatusIcon()} 
              size={24} 
              color={getStatusColor()} 
            />
            <Text variant="titleMedium" style={[styles.statusText, { color: getStatusColor() }]}>
              Fichaje - {getStatusText()}
            </Text>
          </View>
          
          <Text variant="headlineMedium" style={styles.timeText}>
            {formatDuration(getTotalDisplayDuration())}
          </Text>
        </View>

        {timesheet.status === TimesheetStatus.IN_PROGRESS && (
          <Text variant="bodySmall" style={styles.sessionText}>
            Sesión actual: {formatDuration(getCurrentSessionDuration())}
          </Text>
        )}

        <View style={styles.buttonRow}>
          {timesheet.status === TimesheetStatus.NOT_STARTED && (
            <Button 
              mode="contained" 
              onPress={handleStartTimesheet}
              icon="play"
              style={styles.button}
            >
              Iniciar fichaje
            </Button>
          )}

          {timesheet.status === TimesheetStatus.IN_PROGRESS && (
            <>
              <Button 
                mode="contained-tonal" 
                onPress={handlePauseTimesheet}
                icon="pause"
                style={styles.button}
              >
                Pausar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleCompleteTimesheet}
                icon="check"
                style={styles.button}
              >
                Finalizar
              </Button>
            </>
          )}

          {timesheet.status === TimesheetStatus.PAUSED && (
            <>
              <Button 
                mode="contained" 
                onPress={handleStartTimesheet}
                icon="play"
                style={styles.button}
              >
                Reanudar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleCompleteTimesheet}
                icon="check"
                style={styles.button}
              >
                Finalizar
              </Button>
            </>
          )}

          {timesheet.status === TimesheetStatus.COMPLETED && (
            <Text variant="bodyMedium" style={styles.completedText}>
              Fichaje completado
            </Text>
          )}
        </View>

        {timesheet.notes && (
          <Text variant="bodySmall" style={styles.notesText}>
            {timesheet.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  timeText: {
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  sessionText: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  completedText: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  notesText: {
    marginTop: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});

export default TimesheetWidget; 
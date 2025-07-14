import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, useTheme } from 'react-native-paper';
import { WorkDay } from '@/types';

interface DayHeaderProps {
  workDay: WorkDay;
}

export const DayHeader: React.FC<DayHeaderProps> = ({ workDay }) => {
  const theme = useTheme();
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        {/* Fecha y Estado */}
        <View style={styles.dateRow}>
          <Text variant="headlineSmall" style={styles.dateText}>
            {formatDate(workDay.date)}
          </Text>
          <Icon
            source={workDay.status === 'active' ? 'play-circle' : 'check-circle'}
            size={24}
            color={workDay.status === 'active' ? theme.colors.primary : theme.colors.tertiary}
          />
        </View>

        {/* Información del sitio */}
        <View style={styles.infoRow}>
          <Icon 
            source="map-marker" 
            size={20} 
            color={theme.colors.onSurfaceVariant} 
          />
          <Text variant="bodyLarge" style={styles.siteText}>
            {workDay.site}
          </Text>
        </View>

        {/* Hora de inicio */}
        <View style={styles.infoRow}>
          <Icon 
            source="clock-outline" 
            size={20} 
            color={theme.colors.onSurfaceVariant} 
          />
          <Text variant="bodyMedium" style={styles.timeText}>
            Inicio: {formatTime(workDay.startTime)}
            {workDay.endTime && ` • Fin: ${formatTime(workDay.endTime)}`}
          </Text>
        </View>

        {/* Proyecto actual */}
        {workDay.projectName && (
          <View style={styles.infoRow}>
            <Icon 
              source="folder-outline" 
              size={20} 
              color={theme.colors.onSurfaceVariant} 
            />
            <Text variant="bodyMedium" style={styles.projectText}>
              {workDay.projectName}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  content: {
    paddingVertical: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  siteText: {
    marginLeft: 12,
    fontWeight: '500',
  },
  timeText: {
    marginLeft: 12,
    opacity: 0.8,
  },
  projectText: {
    marginLeft: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});

export default DayHeader; 
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, useTheme } from 'react-native-paper';
import { Task, TaskStatus } from '@/types';
import { CircularProgress } from './CircularProgress';
import { SuggestionChip } from '@/components';

export interface TaskCardProps {
  task: Task;
  isReadOnly: boolean;
  onPress: (taskId: string) => void;
}

// Helpers eliminados (no usados en el nuevo diseño)

export const TaskCard: React.FC<TaskCardProps> = ({ task, isReadOnly, onPress }) => {
  const theme = useTheme();
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s: any) => s.isCompleted).length || 0;
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0;
  const assigneesCount = Array.isArray(task.assignedTo) ? task.assignedTo.length : 0;
  const priorityRaw = task.priority || 'low';
  const priorityLabel = priorityRaw.replace(/\b\w/g, c => c.toUpperCase());
  const priorityIcon = priorityRaw === 'high' ? 'bookmark' : 'bookmark-outline';

  const formatHMS = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };
  // Fondo y borde según diseño base (sin elevación)
  const isNotStarted = task.status === TaskStatus.NOT_STARTED;
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInProgress = task.status === TaskStatus.IN_PROGRESS;
  const borderColor = isNotStarted ? theme.colors.surfaceVariant : theme.colors.primary;
  const progressLabelColor = isNotStarted ? theme.colors.onSurfaceVariant : undefined;
  const progressStrokeColor = isNotStarted ? theme.colors.onSurfaceVariant : undefined;
  const progressTrackColor = isNotStarted ? theme.colors.outlineVariant : undefined;

  return (
    <Card 
      key={task.id}
      style={[
        styles.taskCard,
        { backgroundColor: isCompleted ? theme.colors.secondaryContainer : theme.colors.surface, borderColor },
        isReadOnly && styles.taskCardReadOnly,
      ]}
      onPress={() => onPress(task.id)}
    >
      <Card.Content>
        <View style={styles.titleRow}>
          <CircularProgress 
            size={48}
            strokeWidth={4}
            value={progress} 
            label={isCompleted ? undefined : `${completedSubtasks}/${totalSubtasks}`}
            labelVariant="labelMedium"
            labelColor={progressLabelColor}
            progressColor={progressStrokeColor}
            trackColor={progressTrackColor}
            centerIcon={isCompleted ? 'check' : undefined}
            centerIconSize={24}
            centerIconColor={theme.colors.onSurface}
          />
          <View style={styles.titleTextWrap}>
            <Text variant="titleLarge" numberOfLines={2} style={styles.taskTitle}>
              {task.title}
            </Text>
          </View>
        </View>

        {!isCompleted && (
          <Text variant="bodyMedium" numberOfLines={2} style={styles.taskDescription}>
            {task.description}
          </Text>
        )}

        {!isCompleted && (
        <View style={styles.taskInfoGrid}>
          <View style={styles.infoRowTop}>
            <View style={styles.infoItemLeft}>
              <Icon source="map-marker" size={24} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}> 
                {task.location}
              </Text>
            </View>
            <View style={styles.infoItemRight}>
              <Icon source="account-group-outline" size={24} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                {assigneesCount}
              </Text>
            </View>
          </View>

          <View style={styles.infoRowBottom}>
            <View style={styles.infoItemLeft}>
              <Icon source="play" size={24} color={isInProgress ? theme.colors.primary : theme.colors.outlineVariant} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: isInProgress ? theme.colors.primary : theme.colors.outlineVariant }]}>
                {formatHMS(task.timer?.totalElapsed || 0)}
              </Text>
            </View>
            <View style={styles.priorityWrap}>
              <SuggestionChip icon={priorityIcon} label={priorityLabel} />
            </View>
          </View>
        </View>
        )}

        {/* Se elimina barra y texto de progreso según nuevo diseño */}

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
  );
};

const styles = StyleSheet.create({
  taskCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 0,
    borderWidth: 2,
    borderRadius: 16,
    // iOS shadow off
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  taskCardReadOnly: {
    opacity: 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  titleTextWrap: {
    flex: 1,
  },
  taskTitle: {
    marginBottom: 0,
    fontWeight: '500',
    lineHeight: 28,
  },
  taskDescription: {
    marginTop: 10,
    marginBottom: 8,
    opacity: 0.7,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    marginTop: 8,
  },
  // meta eliminada en nuevo diseño
  taskInfoGrid: {
    flexDirection: 'column',
    marginTop: 10,
    gap: 10,
  },
  infoRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityWrap: {
    alignSelf: 'auto',
  },
  priorityChip: {
    height: 32,
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 0,
    paddingLeft: 8,
    paddingRight: 16,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontWeight: '400',
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
});

export default TaskCard;



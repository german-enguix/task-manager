import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { Task } from '@/types';
import { TaskCard } from '@/components';

export interface TasksSectionProps {
  tasks: Task[];
  isReadOnly: boolean;
  onTaskPress: (taskId: string) => void;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  isReadOnly,
  onTaskPress,
  title = 'Tareas del día',
  subtitle,
  loading,
}) => {
  const computedSubtitle = subtitle ?? `${tasks.length} tareas asignadas`;
  const theme = useTheme();

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {computedSubtitle}
        </Text>
      </View>

      {loading ? (
        <Card style={styles.taskCard}><Card.Content><Text>Cargando tareas...</Text></Card.Content></Card>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.id} task={task} isReadOnly={isReadOnly} onPress={onTaskPress} />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionTitle: {
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  sectionSubtitle: {
    opacity: 0.9,
  },
  taskCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 1,
  },
});

export default TasksSection;



import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Alert 
} from 'react-native';
import { 
  Text, 
  Surface, 
  Card, 
  IconButton, 
  Button, 
  Chip, 
  List, 
  Checkbox, 
  FAB, 
  Divider,
  ProgressBar,
  useTheme 
} from 'react-native-paper';
import { Task, TaskStatus, EvidenceType, CommentType } from '@/types';
import { getTaskById, updateTask } from '@/utils/mockData';

interface TaskDetailScreenProps {
  taskId: string;
  onGoBack: () => void;
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({ 
  taskId, 
  onGoBack 
}) => {
  const theme = useTheme();
  const [task, setTask] = useState<Task | null>(null);
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');

  useEffect(() => {
    const taskData = getTaskById(taskId);
    if (taskData) {
      setTask(taskData);
      updateTimerDisplay(taskData.timer.totalElapsed);
    }
  }, [taskId]);

  const updateTimerDisplay = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    setTimerDisplay(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return theme.colors.outline;
      case TaskStatus.IN_PROGRESS:
        return theme.colors.primary;
      case TaskStatus.PAUSED:
        return theme.colors.secondary;
      case TaskStatus.COMPLETED:
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.secondary;
      case 'low':
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    if (!task) return;
    
    const updatedSubtasks = task.subtasks.map(subtask => {
      if (subtask.id === subtaskId) {
        return {
          ...subtask,
          isCompleted: !subtask.isCompleted,
          completedAt: !subtask.isCompleted ? new Date() : undefined,
        };
      }
      return subtask;
    });
    
    const updatedTask = { ...task, subtasks: updatedSubtasks };
    setTask(updatedTask);
    updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const toggleTimer = () => {
    if (!task) return;
    
    const newTimer = { ...task.timer };
    
    if (newTimer.isRunning) {
      // Pausar timer
      if (newTimer.currentSessionStart) {
        const sessionDuration = Math.floor((new Date().getTime() - newTimer.currentSessionStart.getTime()) / 1000);
        newTimer.sessions.push({
          startTime: newTimer.currentSessionStart,
          endTime: new Date(),
          duration: sessionDuration,
        });
        newTimer.totalElapsed += sessionDuration;
        newTimer.currentSessionStart = undefined;
      }
      newTimer.isRunning = false;
    } else {
      // Iniciar timer
      newTimer.isRunning = true;
      newTimer.currentSessionStart = new Date();
    }
    
    const updatedTask = { ...task, timer: newTimer };
    setTask(updatedTask);
    updateTask(taskId, { timer: newTimer });
  };

  const addEvidence = (type: EvidenceType) => {
    Alert.alert(
      'Agregar Evidencia',
      `¿Deseas agregar evidencia de tipo ${type}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Agregar', onPress: () => {
          // Aquí se implementaría la lógica para agregar evidencia
          console.log(`Adding evidence of type: ${type}`);
        }},
      ]
    );
  };

  const addComment = (type: CommentType) => {
    Alert.alert(
      'Agregar Comentario',
      `¿Deseas agregar un comentario de ${type === CommentType.TEXT ? 'texto' : 'voz'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Agregar', onPress: () => {
          // Aquí se implementaría la lógica para agregar comentario
          console.log(`Adding comment of type: ${type}`);
        }},
      ]
    );
  };

  const reportProblem = () => {
    Alert.alert(
      'Reportar Problema',
      '¿Deseas reportar un problema con esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reportar', onPress: () => {
          // Aquí se implementaría la lógica para reportar problema
          console.log('Reporting problem');
        }},
      ]
    );
  };

  if (!task) {
    return (
      <Surface style={styles.container}>
        <Text variant="headlineSmall">Tarea no encontrada</Text>
      </Surface>
    );
  }

  const completedSubtasks = task.subtasks.filter(subtask => subtask.isCompleted).length;
  const totalSubtasks = task.subtasks.length;
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0;

  return (
    <Surface style={styles.container}>
      {/* Header with back button */}
      <Surface elevation={2} style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={onGoBack}
          />
          <View style={styles.headerText}>
            <Text variant="headlineSmall" numberOfLines={1}>
              {task.title}
            </Text>
            <View style={styles.statusContainer}>
              <Chip 
                mode="outlined" 
                style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
                textStyle={{ color: getStatusColor(task.status) }}
              >
                {getStatusText(task.status)}
              </Chip>
              <Chip 
                mode="outlined"
                style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority) }]}
                textStyle={{ color: getPriorityColor(task.priority) }}
              >
                {task.priority.toUpperCase()}
              </Chip>
            </View>
          </View>
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {/* Descripción */}
        <Card style={styles.card}>
          <Card.Title title="Descripción" />
          <Card.Content>
            <Text variant="bodyMedium">{task.description}</Text>
            {task.dueDate && (
              <Text variant="bodySmall" style={styles.dueDate}>
                Fecha límite: {task.dueDate.toLocaleDateString('es-ES')}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Cronómetro */}
        <Card style={styles.card}>
          <Card.Title title="Cronómetro" />
          <Card.Content>
            <View style={styles.timerContainer}>
              <Text variant="displaySmall" style={styles.timerText}>
                {timerDisplay}
              </Text>
              <Button 
                mode={task.timer.isRunning ? "outlined" : "contained"}
                onPress={toggleTimer}
                icon={task.timer.isRunning ? "pause" : "play"}
                style={styles.timerButton}
              >
                {task.timer.isRunning ? 'Pausar' : 'Iniciar'}
              </Button>
            </View>
            <Text variant="bodySmall" style={styles.timerInfo}>
              {task.timer.sessions.length} sesiones registradas
            </Text>
          </Card.Content>
        </Card>

        {/* Subtareas */}
        <Card style={styles.card}>
          <Card.Title title="Subtareas" />
          <Card.Content>
            <View style={styles.progressContainer}>
              <Text variant="bodyMedium">
                {completedSubtasks} de {totalSubtasks} completadas
              </Text>
              <ProgressBar progress={progress} style={styles.progressBar} />
            </View>
            
            {task.subtasks.map((subtask) => (
              <List.Item
                key={subtask.id}
                title={subtask.title}
                description={subtask.description}
                left={() => (
                  <Checkbox
                    status={subtask.isCompleted ? 'checked' : 'unchecked'}
                    onPress={() => toggleSubtask(subtask.id)}
                  />
                )}
                style={subtask.isCompleted ? styles.completedSubtask : styles.subtask}
              />
            ))}
          </Card.Content>
        </Card>

        {/* Evidencias */}
        <Card style={styles.card}>
          <Card.Title title="Evidencias" />
          <Card.Content>
            {task.evidences.length > 0 ? (
              task.evidences.map((evidence) => (
                <List.Item
                  key={evidence.id}
                  title={evidence.title}
                  description={evidence.description}
                  left={() => (
                    <List.Icon 
                      icon={
                        evidence.type === EvidenceType.PHOTO ? 'camera' :
                        evidence.type === EvidenceType.AUDIO ? 'microphone' :
                        evidence.type === EvidenceType.SIGNATURE ? 'pen' :
                        'map-marker'
                      }
                    />
                  )}
                  style={styles.evidenceItem}
                />
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No hay evidencias registradas
              </Text>
            )}
            
            <View style={styles.evidenceButtons}>
              <Button 
                mode="outlined" 
                icon="camera" 
                onPress={() => addEvidence(EvidenceType.PHOTO)}
                style={styles.evidenceButton}
              >
                Foto
              </Button>
              <Button 
                mode="outlined" 
                icon="microphone" 
                onPress={() => addEvidence(EvidenceType.AUDIO)}
                style={styles.evidenceButton}
              >
                Audio
              </Button>
              <Button 
                mode="outlined" 
                icon="pen" 
                onPress={() => addEvidence(EvidenceType.SIGNATURE)}
                style={styles.evidenceButton}
              >
                Firma
              </Button>
              <Button 
                mode="outlined" 
                icon="map-marker" 
                onPress={() => addEvidence(EvidenceType.LOCATION)}
                style={styles.evidenceButton}
              >
                Ubicación
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Comentarios */}
        <Card style={styles.card}>
          <Card.Title title="Comentarios" />
          <Card.Content>
            {task.comments.length > 0 ? (
              task.comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text variant="bodySmall" style={styles.commentAuthor}>
                      {comment.author}
                    </Text>
                    <Text variant="bodySmall" style={styles.commentDate}>
                      {comment.createdAt.toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                  <Text variant="bodyMedium">{comment.content}</Text>
                  {comment.type === CommentType.VOICE && (
                    <Chip icon="microphone" mode="outlined" style={styles.voiceChip}>
                      Nota de voz
                    </Chip>
                  )}
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No hay comentarios registrados
              </Text>
            )}
            
            <View style={styles.commentButtons}>
              <Button 
                mode="outlined" 
                icon="text" 
                onPress={() => addComment(CommentType.TEXT)}
                style={styles.commentButton}
              >
                Texto
              </Button>
              <Button 
                mode="outlined" 
                icon="microphone" 
                onPress={() => addComment(CommentType.VOICE)}
                style={styles.commentButton}
              >
                Voz
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Problemas reportados */}
        {task.problemReports.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Problemas Reportados" />
            <Card.Content>
              {task.problemReports.map((problem) => (
                <View key={problem.id} style={styles.problemItem}>
                  <Text variant="titleMedium">{problem.title}</Text>
                  <Text variant="bodyMedium">{problem.description}</Text>
                  <Chip 
                    mode="outlined" 
                    style={[styles.severityChip, { 
                      borderColor: problem.severity === 'critical' ? theme.colors.error :
                                   problem.severity === 'high' ? theme.colors.secondary :
                                   theme.colors.outline
                    }]}
                  >
                    {problem.severity.toUpperCase()}
                  </Chip>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB para reportar problema */}
      <FAB
        icon="alert"
        label="Reportar Problema"
        style={styles.fab}
        onPress={reportProblem}
      />
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
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  dueDate: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timerText: {
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  timerButton: {
    minWidth: 120,
  },
  timerInfo: {
    textAlign: 'center',
    marginTop: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    marginTop: 8,
  },
  subtask: {
    paddingVertical: 4,
  },
  completedSubtask: {
    paddingVertical: 4,
    opacity: 0.6,
  },
  evidenceItem: {
    paddingVertical: 4,
  },
  evidenceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  evidenceButton: {
    flex: 1,
    minWidth: 80,
  },
  commentItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: 'bold',
  },
  commentDate: {
    opacity: 0.6,
  },
  voiceChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  commentButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  commentButton: {
    flex: 1,
  },
  problemItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255,0,0,0.05)',
    borderRadius: 8,
  },
  severityChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginVertical: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
}); 
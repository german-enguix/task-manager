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
  useTheme,
  Icon
} from 'react-native-paper';
import { Task, TaskStatus, EvidenceType, CommentType, RequiredEvidence, TaskSubtask, SubtaskEvidenceRequirement } from '@/types';
import { getTaskById, updateTask, completeRequiredEvidence } from '@/utils/mockData';

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
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;
    
    // Verificar si la subtarea requiere evidencia obligatoria
    if (subtask.evidenceRequirement?.isRequired && !subtask.evidence && !subtask.isCompleted) {
      Alert.alert(
        'Evidencia Requerida',
        `Esta subtarea requiere evidencia antes de poder marcarla como completada: ${subtask.evidenceRequirement.title}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Proporcionar Evidencia', onPress: () => handleSubtaskEvidence(subtask) }
        ]
      );
      return;
    }
    
    const updatedSubtasks = task.subtasks.map(s => {
      if (s.id === subtaskId) {
        return {
          ...s,
          isCompleted: !s.isCompleted,
          completedAt: !s.isCompleted ? new Date() : undefined,
        };
      }
      return s;
    });
    
    const updatedTask = { ...task, subtasks: updatedSubtasks };
    setTask(updatedTask);
    updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const handleSubtaskEvidence = (subtask: TaskSubtask) => {
    if (!subtask.evidenceRequirement) return;
    
    const actionText = getSubtaskEvidenceActionText(subtask.evidenceRequirement);
    Alert.alert(
      'Proporcionar Evidencia',
      `${subtask.evidenceRequirement.description}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: actionText, onPress: () => simulateEvidenceCapture(subtask) }
      ]
    );
  };

  const simulateEvidenceCapture = (subtask: TaskSubtask) => {
    if (!task || !subtask.evidenceRequirement) return;
    
    // Simulación de captura de evidencia
    Alert.alert(
      'Evidencia Capturada',
      `Se ha simulado la captura de evidencia de tipo ${getEvidenceTypeName(subtask.evidenceRequirement.type)}`,
      [
        { text: 'OK', onPress: () => {
          // Actualizar subtarea con evidencia completada
          const updatedSubtasks = task.subtasks.map(s => {
            if (s.id === subtask.id) {
              return {
                ...s,
                evidence: {
                  id: `subtask-evidence-${Date.now()}`,
                  subtaskId: subtask.id,
                  type: subtask.evidenceRequirement!.type,
                  title: `${subtask.evidenceRequirement!.title} - Completada`,
                  description: 'Evidencia simulada capturada correctamente',
                  createdAt: new Date(),
                  completedBy: 'Usuario Actual',
                },
              };
            }
            return s;
          });
          
          const updatedTask = { ...task, subtasks: updatedSubtasks };
          setTask(updatedTask);
          updateTask(taskId, { subtasks: updatedSubtasks });
        }}
      ]
    );
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

  const handleCompleteEvidence = (requiredEvidence: RequiredEvidence) => {
    if (!task) return;
    
    const actionText = getEvidenceActionText(requiredEvidence);
    
    Alert.alert(
      'Completar Evidencia',
      `¿Deseas ${actionText.toLowerCase()} para "${requiredEvidence.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Completar', onPress: () => {
          // Aquí se implementaría la lógica específica para cada tipo de evidencia
          console.log(`Completing evidence: ${requiredEvidence.id}`);
          
          // Simular completar la evidencia
          const success = completeRequiredEvidence(taskId, requiredEvidence.id, {
            type: requiredEvidence.type,
            title: `${requiredEvidence.title} - Completada`,
            description: 'Evidencia completada por el usuario',
            createdAt: new Date(),
            completedBy: task.assignedTo || 'Usuario',
          });
          
          if (success) {
            // Actualizar el estado local
            const updatedTask = getTaskById(taskId);
            if (updatedTask) {
              setTask(updatedTask);
            }
          }
        }},
      ]
    );
  };

  const getEvidenceIcon = (type: EvidenceType, config?: RequiredEvidence['config']) => {
    switch (type) {
      case EvidenceType.PHOTO_VIDEO:
        if (config?.allowPhoto && config?.allowVideo) return 'camera-plus';
        if (config?.allowVideo) return 'video';
        return 'camera';
      case EvidenceType.AUDIO:
        return 'microphone';
      case EvidenceType.SIGNATURE:
        return 'pen';
      case EvidenceType.LOCATION:
        return 'map-marker';
      case EvidenceType.NFC:
        return 'nfc';
      default:
        return 'file';
    }
  };

  const getEvidenceActionText = (evidence: RequiredEvidence) => {
    switch (evidence.type) {
      case EvidenceType.PHOTO_VIDEO:
        if (evidence.config?.allowPhoto && evidence.config?.allowVideo) return 'Capturar foto o video';
        if (evidence.config?.allowVideo) return 'Grabar video';
        return 'Tomar foto';
      case EvidenceType.AUDIO:
        return 'Grabar audio';
      case EvidenceType.SIGNATURE:
        return 'Firmar';
      case EvidenceType.LOCATION:
        return 'Obtener ubicación';
      case EvidenceType.NFC:
        return 'Escanear NFC';
      default:
        return 'Completar';
    }
  };

  const getSubtaskEvidenceActionText = (evidenceReq: SubtaskEvidenceRequirement) => {
    switch (evidenceReq.type) {
      case EvidenceType.PHOTO_VIDEO:
        if (evidenceReq.config?.allowPhoto && evidenceReq.config?.allowVideo) return 'Capturar foto o video';
        if (evidenceReq.config?.allowVideo) return 'Grabar video';
        return 'Tomar foto';
      case EvidenceType.AUDIO:
        return 'Grabar audio';
      case EvidenceType.SIGNATURE:
        return 'Firmar';
      case EvidenceType.LOCATION:
        return 'Obtener ubicación';
      case EvidenceType.NFC:
        return 'Escanear NFC';
      default:
        return 'Completar';
    }
  };

  const getEvidenceTypeName = (type: EvidenceType) => {
    switch (type) {
      case EvidenceType.PHOTO_VIDEO:
        return 'Foto/Video';
      case EvidenceType.AUDIO:
        return 'Audio';
      case EvidenceType.SIGNATURE:
        return 'Firma';
      case EvidenceType.LOCATION:
        return 'GPS';
      case EvidenceType.NFC:
        return 'NFC';
      default:
        return 'Evidencia';
    }
  };

  const getSubtaskCheckboxStatus = (subtask: TaskSubtask) => {
    // Si está completada, siempre checked
    if (subtask.isCompleted) return 'checked';
    
    // Si requiere evidencia obligatoria y no la tiene, bloqueado
    if (subtask.evidenceRequirement?.isRequired && !subtask.evidence) {
      return 'unchecked'; // Mantener unchecked pero cambiaremos el icono
    }
    
    // En cualquier otro caso, normal
    return 'unchecked';
  };

  const isSubtaskBlocked = (subtask: TaskSubtask) => {
    return subtask.evidenceRequirement?.isRequired && !subtask.evidence && !subtask.isCompleted;
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

  const completedEvidences = task.requiredEvidences.filter(evidence => evidence.isCompleted).length;
  const totalEvidences = task.requiredEvidences.length;
  const evidenceProgress = totalEvidences > 0 ? completedEvidences / totalEvidences : 0;

  return (
    <Surface style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header integrado */}
        <View style={styles.header}>
          {/* Fila superior: botón atrás y badges */}
          <View style={styles.headerTop}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={onGoBack}
              style={styles.backButton}
            />
            <View style={styles.statusContainer}>
              <Chip 
                mode="outlined"
                style={[styles.priorityBadge, { borderColor: getPriorityColor(task.priority) }]}
                textStyle={{ color: getPriorityColor(task.priority), fontSize: 11 }}
                compact
              >
                {task.priority.toUpperCase()}
              </Chip>
              <Chip 
                mode="outlined" 
                style={[styles.statusBadge, { borderColor: getStatusColor(task.status) }]}
                textStyle={{ color: getStatusColor(task.status), fontSize: 11 }}
                compact
              >
                {getStatusText(task.status)}
              </Chip>
            </View>
          </View>
          
          {/* Título ocupando todo el ancho */}
          <View style={styles.headerTitle}>
            <Text variant="headlineMedium">
              {task.title}
            </Text>
          </View>
        </View>

        {/* Información de la tarea */}
        <View style={styles.taskInfo}>
          <Text variant="bodyMedium" style={styles.taskDescription}>
            {task.description}
          </Text>
          
          {/* Información del proyecto y ubicación */}
          <View style={styles.taskMeta}>
            <View style={styles.taskMetaRow}>
              <Icon source="folder" size={16} color="#2196F3" />
              <Text variant="bodySmall" style={styles.taskProject}>
                Proyecto: {task.projectName}
              </Text>
            </View>
            <View style={styles.taskMetaRow}>
              <Icon source="map-marker" size={16} color="#4CAF50" />
              <Text variant="bodySmall" style={styles.taskLocation}>
                Ubicación: {task.location}
              </Text>
            </View>
            {task.dueDate && (
              <View style={styles.taskMetaRow}>
                <Icon source="calendar" size={16} color="#666" />
                <Text variant="bodySmall" style={styles.taskDueDate}>
                  {task.dueDate.toLocaleDateString('es-ES')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Temporizador */}
        <Card style={styles.card}>
          <Card.Content>
            {/* Temporizador principal */}
            <View style={styles.timerSection}>
              <Text variant="bodySmall" style={styles.timerLabel}>
                {task.timer.sessions.length} sesiones registradas
              </Text>
              <Text variant="displayMedium" style={[styles.timerDisplay, { color: theme.colors.primary }]}>
                {timerDisplay}
              </Text>
            </View>
            
            {/* Controles del temporizador */}
            <View style={styles.timerControls}>
              <Button 
                mode={task.timer.isRunning ? "outlined" : "contained"}
                onPress={toggleTimer}
                icon={task.timer.isRunning ? "pause" : "play"}
                style={styles.timerButton}
              >
                {task.timer.isRunning ? 'Pausar' : 'Iniciar temporizador'}
              </Button>
            </View>
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
              <View key={subtask.id} style={styles.subtaskContainer}>
                <List.Item
                  title={subtask.title}
                  description={subtask.description}
                  left={() => (
                    <View style={styles.subtaskCheckContainer}>
                      {isSubtaskBlocked(subtask) ? (
                        <Icon 
                          source="lock" 
                          size={24} 
                          color={theme.colors.outline}
                        />
                      ) : (
                        <Checkbox
                          status={getSubtaskCheckboxStatus(subtask)}
                          onPress={() => toggleSubtask(subtask.id)}
                        />
                      )}
                    </View>
                  )}
                  style={[
                    styles.subtask,
                    subtask.isCompleted && styles.completedSubtask,
                    isSubtaskBlocked(subtask) && styles.blockedSubtask
                  ]}
                />
                
                {/* Información de evidencia requerida */}
                {subtask.evidenceRequirement && (
                  <View style={styles.evidenceInfo}>
                    <View style={styles.evidenceHeader}>
                      <Icon 
                        source={getEvidenceIcon(subtask.evidenceRequirement.type, subtask.evidenceRequirement.config)} 
                        size={16} 
                        color={subtask.evidence ? theme.colors.tertiary : (subtask.evidenceRequirement.isRequired ? theme.colors.error : theme.colors.outline)}
                      />
                      <Text variant="bodySmall" style={[
                        styles.evidenceTitle,
                        { color: subtask.evidence ? theme.colors.tertiary : (subtask.evidenceRequirement.isRequired ? theme.colors.error : theme.colors.outline) }
                      ]}>
                        {subtask.evidenceRequirement.title}
                        {subtask.evidenceRequirement.isRequired && ' (Obligatoria)'}
                        {!subtask.evidenceRequirement.isRequired && ' (Opcional)'}
                      </Text>
                    </View>
                    
                    <Text variant="bodySmall" style={styles.evidenceDescription}>
                      {subtask.evidenceRequirement.description}
                    </Text>
                    
                    {/* Estado de la evidencia */}
                    {subtask.evidence ? (
                      <View style={styles.evidenceCompleted}>
                        <Chip 
                          mode="flat"
                          icon="check-circle"
                          style={styles.evidenceCompletedChip}
                          textStyle={{ color: theme.colors.tertiary }}
                        >
                          Evidencia completada
                        </Chip>
                        <Text variant="bodySmall" style={styles.evidenceCompletedInfo}>
                          {subtask.evidence.title} - {subtask.evidence.createdAt.toLocaleDateString('es-ES')}
                        </Text>
                      </View>
                    ) : (
                      <Button 
                        mode={subtask.evidenceRequirement.isRequired ? "contained" : "outlined"}
                        icon={getEvidenceIcon(subtask.evidenceRequirement.type, subtask.evidenceRequirement.config)}
                        onPress={() => handleSubtaskEvidence(subtask)}
                        style={styles.evidenceActionButton}
                        buttonColor={subtask.evidenceRequirement.isRequired ? theme.colors.error : undefined}
                      >
                        {getSubtaskEvidenceActionText(subtask.evidenceRequirement)}
                      </Button>
                    )}
                  </View>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Evidencias Requeridas */}
        <Card style={styles.card}>
          <Card.Title title="Evidencias Requeridas" />
          <Card.Content>
            <View style={styles.progressContainer}>
              <Text variant="bodyMedium">
                {completedEvidences} de {totalEvidences} completadas
              </Text>
              <ProgressBar progress={evidenceProgress} style={styles.progressBar} />
            </View>
            
            {task.requiredEvidences.map((requiredEvidence) => (
              <View key={requiredEvidence.id} style={styles.evidenceRequirement}>
                <List.Item
                  title={requiredEvidence.title}
                  description={requiredEvidence.description}
                  left={() => (
                    <List.Icon 
                      icon={getEvidenceIcon(requiredEvidence.type, requiredEvidence.config)}
                      color={requiredEvidence.isCompleted ? theme.colors.tertiary : theme.colors.outline}
                    />
                  )}
                  right={() => (
                    requiredEvidence.isCompleted ? (
                      <Chip 
                        mode="flat"
                        style={styles.completedChip}
                        textStyle={{ color: theme.colors.tertiary }}
                      >
                        Completada
                      </Chip>
                    ) : (
                      <Button 
                        mode="outlined"
                        onPress={() => handleCompleteEvidence(requiredEvidence)}
                        style={styles.evidenceActionButton}
                      >
                        {getEvidenceActionText(requiredEvidence)}
                      </Button>
                    )
                  )}
                  style={requiredEvidence.isCompleted ? styles.completedEvidence : styles.pendingEvidence}
                />
                
                {/* Mostrar evidencias completadas para este requerimiento */}
                {task.evidences
                  .filter(evidence => evidence.requiredEvidenceId === requiredEvidence.id)
                  .map((evidence) => (
                    <View key={evidence.id} style={styles.completedEvidenceItem}>
                      <List.Item
                        title={evidence.title}
                        description={`Completada por ${evidence.completedBy} - ${evidence.createdAt.toLocaleDateString('es-ES')}`}
                        left={() => <List.Icon icon="check-circle" color={theme.colors.tertiary} />}
                        style={styles.completedEvidenceSubitem}
                      />
                    </View>
                  ))}
              </View>
            ))}
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    alignItems: 'flex-start',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  timerButton: {
    minWidth: 120,
  },
  timerInfo: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 12,
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
    opacity: 0.7,
  },
  blockedSubtask: {
    paddingVertical: 4,
    opacity: 0.6,
  },
  evidenceRequirement: {
    marginBottom: 16,
  },
  completedEvidence: {
    opacity: 0.7,
  },
  pendingEvidence: {
    // Estilo normal
  },
  completedChip: {
    alignSelf: 'center',
  },
  evidenceActionButton: {
    alignSelf: 'center',
  },
  completedEvidenceItem: {
    marginLeft: 16,
    marginTop: 8,
  },
  completedEvidenceSubitem: {
    paddingLeft: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
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
  taskInfo: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  taskDescription: {
    marginBottom: 12,
  },
  taskMeta: {
    gap: 8,
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
  taskDueDate: {
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  backButton: {
    marginRight: 8,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  timerDisplay: {
    fontWeight: '700',
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtaskContainer: {
    marginBottom: 12,
  },
  subtaskCheckContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  evidenceInfo: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  evidenceTitle: {
    marginLeft: 8,
    fontWeight: '500',
  },
  evidenceDescription: {
    color: '#666',
    marginBottom: 8,
  },
  evidenceCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  evidenceCompletedChip: {
    marginRight: 8,
  },
  evidenceCompletedInfo: {
    color: '#666',
    fontSize: 12,
  },
}); 
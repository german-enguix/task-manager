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
  Divider,
  ProgressBar,
  useTheme,
  Icon
} from 'react-native-paper';
import { Task, TaskStatus, EvidenceType, CommentType, TaskSubtask, SubtaskEvidenceRequirement, Tag } from '@/types';
import { supabaseService } from '@/services/supabaseService';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [fallbackMessageShown, setFallbackMessageShown] = useState(false);

  useEffect(() => {
    loadUserAndTask();
  }, [taskId]);

  // Efecto para actualizar el timer en tiempo real cuando está corriendo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (task?.timer.isRunning && task.timer.currentSessionStart) {
      interval = setInterval(() => {
        const now = new Date();
        const currentSessionDuration = Math.floor((now.getTime() - task.timer.currentSessionStart!.getTime()) / 1000);
        const totalElapsed = task.timer.totalElapsed + currentSessionDuration;
        updateTimerDisplay(totalElapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [task?.timer.isRunning, task?.timer.currentSessionStart, task?.timer.totalElapsed]);

  const loadUserAndTask = async () => {
    try {
      // Cargar usuario actual
      const user = await supabaseService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      
      // Cargar tarea
      await loadTask();
    } catch (error) {
      console.error('Error loading user and task:', error);
    }
  };

  const loadTask = async () => {
    try {
      const taskData = await supabaseService.getTaskById(taskId);
      if (taskData) {
        setTask(taskData);
        updateTimerDisplay(taskData.timer.totalElapsed);
      }
    } catch (error) {
      console.error('Error loading task:', error);
    }
  };

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

  const toggleSubtask = async (subtaskId: string) => {
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
    
    try {
      const newCompletedState = !subtask.isCompleted;
      const completedAt = newCompletedState ? new Date() : undefined;
      
      // Actualizar en Supabase
      await supabaseService.updateSubtask(subtaskId, {
        isCompleted: newCompletedState,
        completedAt: completedAt
      });
      
      // Actualizar estado local
      const updatedSubtasks = task.subtasks.map(s => {
        if (s.id === subtaskId) {
          return {
            ...s,
            isCompleted: newCompletedState,
            completedAt: completedAt,
          };
        }
        return s;
      });
      
      const updatedTask = { ...task, subtasks: updatedSubtasks };
      setTask(updatedTask);
      
      console.log('✅ Subtask toggled successfully');
      
      // Opcional: Recargar la tarea completa para sincronizar con la base de datos
      // await loadTask();
    } catch (error) {
      console.error('❌ Error updating subtask:', error);
      Alert.alert('Error', 'No se pudo actualizar la subtarea. Inténtalo de nuevo.');
    }
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
        }}
      ]
    );
  };

  const toggleTimer = async () => {
    console.log('🔄 toggleTimer called - task:', !!task, 'currentUserId:', currentUserId);
    
    if (!task || !currentUserId) {
      console.log('❌ Missing task or currentUserId');
      Alert.alert('Error', 'No se pudo identificar la tarea o el usuario. Recarga la pantalla.');
      return;
    }
    
    try {
      console.log('🎯 Timer state before toggle:', task.timer.isRunning);
      
      if (task.timer.isRunning) {
        console.log('⏸️ Trying to stop timer...');
        
        try {
          // Intentar usar la función de base de datos
          const totalElapsed = await supabaseService.stopTaskTimer(taskId, currentUserId);
          console.log('✅ Timer stopped via DB, total elapsed:', totalElapsed);
          
          // Actualizar estado local
          setTask(prevTask => prevTask ? {
            ...prevTask,
            timer: {
              ...prevTask.timer,
              isRunning: false,
              currentSessionStart: undefined,
              totalElapsed: totalElapsed,
            }
          } : null);
          
          updateTimerDisplay(totalElapsed);
        } catch (dbError) {
          console.warn('⚠️ DB functions not available yet. Using local mode.');
          console.log('💡 To enable full persistence, execute: scripts/add_timer_fields_to_tasks.sql');
          
          // Fallback local completo - funciona sin base de datos
          const sessionDuration = task.timer.currentSessionStart 
            ? Math.floor((new Date().getTime() - task.timer.currentSessionStart.getTime()) / 1000)
            : 0;
          const totalElapsed = task.timer.totalElapsed + sessionDuration;
          
          setTask(prevTask => prevTask ? {
            ...prevTask,
            timer: {
              ...prevTask.timer,
              isRunning: false,
              currentSessionStart: undefined,
              totalElapsed: totalElapsed,
            }
          } : null);
          
          updateTimerDisplay(totalElapsed);
          console.log('✅ Timer stopped via local fallback, total elapsed:', totalElapsed);
        }
      } else {
        console.log('▶️ Trying to start timer...');
        
        try {
          // Intentar usar la función de base de datos
          await supabaseService.startTaskTimer(taskId, currentUserId);
          console.log('✅ Timer started via DB');
          
          const now = new Date();
          setTask(prevTask => prevTask ? {
            ...prevTask,
            timer: {
              ...prevTask.timer,
              isRunning: true,
              currentSessionStart: now,
            }
          } : null);
        } catch (dbError) {
          console.warn('⚠️ DB functions not available yet. Using local mode.');
          console.log('💡 To enable full persistence, execute: scripts/add_timer_fields_to_tasks.sql');
          
          // Fallback local completo - funciona sin base de datos
          const now = new Date();
          setTask(prevTask => prevTask ? {
            ...prevTask,
            timer: {
              ...prevTask.timer,
              isRunning: true,
              currentSessionStart: now,
            }
          } : null);
          console.log('✅ Timer started via local fallback');
          
          // Mostrar mensaje informativo solo la primera vez
          if (!fallbackMessageShown) {
            setFallbackMessageShown(true);
            Alert.alert(
              'Modo Local Activado',
              'El temporizador funciona en modo local. Para persistencia completa, ejecuta el script: scripts/add_timer_fields_to_tasks.sql en Supabase.',
              [{ text: 'Entendido' }]
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Critical error in toggleTimer:', error);
      Alert.alert('Error', 'No se pudo actualizar el temporizador. Inténtalo de nuevo.');
    }
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
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {task.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  mode="flat"
                  style={[styles.tagChip, { backgroundColor: tag.color + '20' }]}
                  textStyle={[styles.tagText, { color: tag.color }]}
                  compact
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
          )}
          
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
                
                {/* CTA de evidencia */}
                {subtask.evidenceRequirement && (
                  <View style={styles.evidenceInfo}>
                    {subtask.evidence ? (
                      <Button 
                        mode="outlined"
                        icon={getEvidenceIcon(subtask.evidenceRequirement.type, subtask.evidenceRequirement.config)}
                        disabled={true}
                        style={styles.evidenceCompletedButton}
                        labelStyle={styles.evidenceCompletedButtonText}
                      >
                        Evidencia completada
                      </Button>
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
        <Card style={styles.card}>
          <Card.Title title="Problemas Reportados" />
          <Card.Content>
            {task.problemReports.length > 0 ? (
              task.problemReports.map((problem) => (
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
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No hay problemas reportados
              </Text>
            )}
            
            <Button 
              mode="outlined" 
              icon="alert" 
              onPress={reportProblem}
              style={styles.reportButton}
            >
              Reportar Problema
            </Button>
          </Card.Content>
        </Card>
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
  evidenceActionButton: {
    alignSelf: 'center',
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
  reportButton: {
    marginTop: 16,
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
  evidenceCompletedButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  evidenceCompletedButtonText: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  tagChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
}); 
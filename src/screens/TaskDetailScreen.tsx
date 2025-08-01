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
  Icon,
  TextInput,
  Portal,
  Dialog,
  Appbar
} from 'react-native-paper';
import { 
  Task, 
  TaskStatus, 
  EvidenceType, 
  CommentType, 
  TaskSubtask, 
  SubtaskEvidenceRequirement, 
  Tag, 
  TaskComment,
  ProblemReportType,
  ProblemSeverity,
  TaskProblemReport,
} from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { isDayReadOnly } from '@/utils/dateUtils';
import { formatDuration } from '@/utils';
import { ProblemReportDialog, NFCDialog, QRDialog, LocationDialog, LocationViewer, AudioDialog, AudioViewer, SignatureDialog, SignatureViewer, CameraDialog, MediaViewer } from '@/components';

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
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [fallbackMessageShown, setFallbackMessageShown] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showNFCDialog, setShowNFCDialog] = useState(false);
  const [currentNFCSubtask, setCurrentNFCSubtask] = useState<TaskSubtask | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [currentQRSubtask, setCurrentQRSubtask] = useState<TaskSubtask | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [currentSignatureSubtask, setCurrentSignatureSubtask] = useState<TaskSubtask | null>(null);
  const [showSignatureViewer, setShowSignatureViewer] = useState(false);
  const [currentSignatureData, setCurrentSignatureData] = useState<string>('');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [currentLocationSubtask, setCurrentLocationSubtask] = useState<TaskSubtask | null>(null);
  const [showLocationViewer, setShowLocationViewer] = useState(false);
  const [currentLocationData, setCurrentLocationData] = useState<any>(null);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [currentAudioSubtask, setCurrentAudioSubtask] = useState<TaskSubtask | null>(null);
  const [showAudioViewer, setShowAudioViewer] = useState(false);
  const [currentAudioData, setCurrentAudioData] = useState<any>(null);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [currentCameraSubtask, setCurrentCameraSubtask] = useState<TaskSubtask | null>(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [currentMediaData, setCurrentMediaData] = useState<any>(null);
  const [showDeleteReportDialog, setShowDeleteReportDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<TaskProblemReport | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

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
        // VALIDACIÓN DE CONSISTENCIA: Asegurar que evidencia y estado coincidan
        const consistentSubtasks = taskData.subtasks.map(subtask => {
          // Si hay evidencia pero no está marcada como completada, corregir
          if (subtask.evidence && !subtask.isCompleted) {
            console.log(`🔧 Corrigiendo inconsistencia: subtarea "${subtask.title}" tiene evidencia pero no está marcada como completada`);
            return {
              ...subtask,
              isCompleted: true,
              completedAt: subtask.completedAt || new Date()
            };
          }
          // Si está marcada como completada pero requiere evidencia y no la tiene, desmarcar
          if (subtask.isCompleted && subtask.evidenceRequirement?.isRequired && !subtask.evidence) {
            console.log(`🔧 Corrigiendo inconsistencia: subtarea "${subtask.title}" está marcada pero falta evidencia requerida`);
            return {
              ...subtask,
              isCompleted: false,
              completedAt: undefined
            };
          }
          return subtask;
        });

        // Calcular el estado correcto basándose en las subtareas corregidas y el timer
        const calculatedStatus = calculateTaskStatus(consistentSubtasks, taskData.timer);
        
        // Aplicar datos consistentes
        const finalTaskData = {
          ...taskData,
          subtasks: consistentSubtasks,
          status: calculatedStatus
        };
        
        setTask(finalTaskData);
        updateTimerDisplay(taskData.timer.totalElapsed);
        
        // Calcular si el día de la tarea es de solo lectura (día pasado)
        if (finalTaskData.dueDate) {
          const taskWorkDay = { date: finalTaskData.dueDate, status: 'active' };
          setIsReadOnly(isDayReadOnly(taskWorkDay as any));
        } else {
          // Si no hay fecha de vencimiento, asumir día actual (no readonly)
          setIsReadOnly(false);
        }
        
        // Actualizar en la base de datos si el estado cambió (sincronización inicial silenciosa)
        if (calculatedStatus !== taskData.status) {
          try {
            await supabaseService.updateTask(taskId, { status: calculatedStatus });
            console.log(`🔄 Estado sincronizado: ${getStatusText(calculatedStatus)}`);
          } catch (error) {
            console.error('❌ Error synchronizing task status:', error);
          }
        }
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

  const calculateTaskStatus = (subtasks: TaskSubtask[], timer?: any): TaskStatus => {
    const completedSubtasks = subtasks.filter(subtask => subtask.isCompleted).length;
    
    // Si todas las subtareas están completadas → COMPLETED
    if (subtasks.length > 0 && completedSubtasks === subtasks.length) {
      return TaskStatus.COMPLETED;
    }
    
    // Si el temporizador está corriendo O tiene tiempo registrado O hay subtareas completadas → IN_PROGRESS
    const hasTimerActivity = timer && (timer.isRunning || timer.totalElapsed > 0);
    const hasCompletedSubtasks = completedSubtasks > 0;
    
    if (hasTimerActivity || hasCompletedSubtasks) {
      return TaskStatus.IN_PROGRESS;
    }
    
    // En cualquier otro caso → NOT_STARTED
    return TaskStatus.NOT_STARTED;
  };

  const updateTaskStatusBasedOnTimer = async (updatedTask: any) => {
    if (!task) return;
    
    const newTaskStatus = calculateTaskStatus(updatedTask.subtasks, updatedTask.timer);
    
    if (newTaskStatus !== task.status) {
      try {
        await supabaseService.updateTask(taskId, { status: newTaskStatus });
        console.log('✅ Task status updated due to timer change:', newTaskStatus);
        
        // Log del cambio de estado
        const statusText = getStatusText(newTaskStatus);
        console.log(`🎯 Estado actualizado por timer: ${statusText}`);
        
        // Actualizar estado local de la tarea
        setTask(prevTask => prevTask ? { 
          ...prevTask, 
          status: newTaskStatus 
        } : null);
      } catch (error) {
        console.error('❌ Error updating task status:', error);
      }
    }
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
    
    if (isReadOnly) {
      console.log('❌ Subtask toggle blocked: read-only mode (past day)');
      Alert.alert('Acción no permitida', 'No puedes modificar tareas de días pasados.');
      return;
    }
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    // ÚNICA RESTRICCIÓN: Si la evidencia es requerida y no hay evidencia, mostrar diálogo para obtenerla
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

    // COMPORTAMIENTO DIRECTO: Permitir marcar/desmarcar libremente
    // Si se desmarca, automáticamente elimina la evidencia
    await forceToggleSubtask(subtaskId, !subtask.isCompleted);
  };

  const forceToggleSubtask = async (subtaskId: string, newState: boolean) => {
    if (!task) return;
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    try {
      const completedAt = newState ? new Date() : undefined;
      
      // Si se desmarca y hay evidencia, eliminarla de la base de datos
      if (!newState && subtask.evidence) {
        await supabaseService.removeSubtaskEvidence(subtaskId);
        console.log('🗑️ Evidencia eliminada de la base de datos');
      }
      
      // Actualizar en Supabase
      await supabaseService.updateSubtask(subtaskId, {
        isCompleted: newState,
        completedAt: completedAt
      });

      // Actualizar estado local
      const updatedSubtasks = task.subtasks.map(s => {
        if (s.id === subtaskId) {
          return {
            ...s,
            isCompleted: newState,
            completedAt: completedAt,
            // REGLA CRÍTICA: Si se desmarca, SIEMPRE eliminar evidencia
            evidence: newState ? s.evidence : undefined,
          };
        }
        return s;
      });
      
      // Calcular el nuevo estado de la tarea basándose en las subtareas y el timer
      const newTaskStatus = calculateTaskStatus(updatedSubtasks, task.timer);
      
      const updatedTask = { 
        ...task, 
        subtasks: updatedSubtasks,
        status: newTaskStatus
      };
      setTask(updatedTask);

      // Actualizar el estado de la tarea en la base de datos si cambió
      if (newTaskStatus !== task.status) {
        try {
          await supabaseService.updateTask(taskId, { status: newTaskStatus });
          console.log('✅ Task status updated to:', newTaskStatus);
          
          // Log del cambio de estado (visible en consola)
          const statusText = getStatusText(newTaskStatus);
          console.log(`🎯 Estado actualizado automáticamente: ${statusText}`);
        } catch (error) {
          console.error('❌ Error updating task status:', error);
          // No mostramos error al usuario para no interrumpir el flujo
        }
      }
      
      // Log específico para evidencia eliminada automáticamente
      if (!newState && subtask.evidence) {
        console.log(`🗑️ Evidencia eliminada automáticamente al desmarcar subtarea: ${subtask.evidence.type}`);
        console.log(`🔄 Botón CTA volverá a mostrar: "${getSubtaskEvidenceActionText(subtask.evidenceRequirement!)}"`);
      }
      
      console.log('✅ Subtask toggled successfully (direct mode)');
      
      // Opcional: Recargar la tarea completa para sincronizar con la base de datos
      // await loadTask();
    } catch (error) {
      console.error('❌ Error force updating subtask:', error);
      Alert.alert('Error', 'No se pudo actualizar la subtarea. Inténtalo de nuevo.');
    }
  };

  const handleSubtaskEvidence = (subtask: TaskSubtask) => {
    if (!subtask.evidenceRequirement) return;
    
    // Si es evidencia NFC, mostrar el diálogo específico
    if (subtask.evidenceRequirement.type === EvidenceType.NFC) {
      setCurrentNFCSubtask(subtask);
      setShowNFCDialog(true);
      return;
    }

    // Si es evidencia QR, mostrar el diálogo específico
    if (subtask.evidenceRequirement.type === EvidenceType.QR) {
      setCurrentQRSubtask(subtask);
      setShowQRDialog(true);
      return;
    }

    // Si es evidencia de firma, mostrar el diálogo específico
    if (subtask.evidenceRequirement.type === EvidenceType.SIGNATURE) {
      setCurrentSignatureSubtask(subtask);
      setShowSignatureDialog(true);
      return;
    }

    // Si es evidencia de ubicación, mostrar el diálogo específico
    if (subtask.evidenceRequirement.type === EvidenceType.LOCATION) {
      setCurrentLocationSubtask(subtask);
      setShowLocationDialog(true);
      return;
    }

    // Si es evidencia de audio, mostrar el diálogo específico
    if (subtask.evidenceRequirement.type === EvidenceType.AUDIO) {
      setCurrentAudioSubtask(subtask);
      setShowAudioDialog(true);
      return;
    }

    // Si es evidencia de foto/video, mostrar el diálogo específico
    if (subtask.evidenceRequirement.type === EvidenceType.PHOTO_VIDEO) {
      setCurrentCameraSubtask(subtask);
      setShowCameraDialog(true);
      return;
    }
    
    // Para otros tipos de evidencia, usar el flujo existente
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

  const handleNFCSuccess = (data: any) => {
    console.log('NFC Success:', data);
    setShowNFCDialog(false);
  };

  const handleNFCDismiss = () => {
    setShowNFCDialog(false);
    setCurrentNFCSubtask(null);
  };

  const handleQRSuccess = (data: any) => {
    console.log('QR Success:', data);
    setShowQRDialog(false);
  };

  const handleQRDismiss = () => {
    setShowQRDialog(false);
    setCurrentQRSubtask(null);
  };

  const handleSignatureSuccess = async (signatureData: string) => {
    if (!currentSignatureSubtask || !task) return;
    
    // Cerrar el diálogo de firma
    setShowSignatureDialog(false);
    
    try {
      // Simular la captura de evidencia de firma y marcar como completada
      await simulateSignatureEvidenceCapture(currentSignatureSubtask, signatureData);
      
      console.log('✅ Signature evidence captured and subtask completed');
    } catch (error) {
      console.error('❌ Error completing signature evidence:', error);
      Alert.alert('Error', 'No se pudo completar la evidencia de firma. Inténtalo de nuevo.');
    } finally {
      // Limpiar la subtarea actual
      setCurrentSignatureSubtask(null);
    }
  };

  const handleSignatureDismiss = () => {
    setShowSignatureDialog(false);
    setCurrentSignatureSubtask(null);
  };

  const handleViewSignature = (subtask: TaskSubtask) => {
    if (subtask.evidence && 
        subtask.evidence.data && 
        typeof subtask.evidence.data === 'string' && 
        subtask.evidence.data.trim() !== '') {
      setCurrentSignatureData(subtask.evidence.data);
      setShowSignatureViewer(true);
    } else {
      console.warn('No se puede mostrar la firma: datos inválidos o vacíos', subtask.evidence?.data);
      Alert.alert(
        'Error',
        'No se pueden mostrar los datos de la firma. Es posible que la firma esté corrupta o vacía.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSignatureViewerDismiss = () => {
    setShowSignatureViewer(false);
    setCurrentSignatureData('');
  };

  const handleLocationSuccess = async (locationData: any) => {
    if (!currentLocationSubtask || !task) return;
    
    // Cerrar el diálogo de ubicación
    setShowLocationDialog(false);
    
    try {
      // Capturar la evidencia de ubicación real y marcar como completada
      await captureRealLocationEvidence(currentLocationSubtask, locationData);
      
      console.log('✅ Real location evidence captured and subtask completed');
    } catch (error) {
      console.error('❌ Error completing location evidence:', error);
      Alert.alert('Error', 'No se pudo completar la evidencia de ubicación. Inténtalo de nuevo.');
    } finally {
      // Limpiar la subtarea actual
      setCurrentLocationSubtask(null);
    }
  };

  const handleLocationDismiss = () => {
    setShowLocationDialog(false);
    setCurrentLocationSubtask(null);
  };

  const handleViewLocation = (subtask: TaskSubtask) => {
    if (subtask.evidence && subtask.evidence.data) {
      setCurrentLocationData(subtask.evidence.data);
      setShowLocationViewer(true);
    } else {
      console.warn('No se puede mostrar la ubicación: datos inválidos o vacíos', subtask.evidence?.data);
      Alert.alert(
        'Error',
        'No se pueden mostrar los datos de ubicación. Es posible que la ubicación esté corrupta o vacía.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLocationViewerDismiss = () => {
    setShowLocationViewer(false);
    setCurrentLocationData(null);
  };

  const handleAudioSuccess = async (audioData: any) => {
    console.log('🎵 handleAudioSuccess called with audio from Supabase Storage');
    
    if (!currentAudioSubtask || !task) {
      console.error('❌ Missing required data in handleAudioSuccess');
      return;
    }
    
    // Cerrar el diálogo de audio
    setShowAudioDialog(false);
    
    try {
      console.log('🔄 Starting audio evidence capture process...');
      
      // Guardar la evidencia de audio (ya subida a Supabase Storage)
      await saveAudioEvidence(currentAudioSubtask, audioData);
      
      console.log('✅ Audio evidence saved successfully');
    } catch (error) {
      console.error('❌ Error saving audio evidence:', error);
      
      Alert.alert(
        'Error de Audio',
        'No se pudo guardar la evidencia de audio. Inténtalo de nuevo.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      // Limpiar la subtarea actual
      setCurrentAudioSubtask(null);
    }
  };

  const saveAudioEvidence = async (subtask: TaskSubtask, audioData: any) => {
    if (!task || !subtask.evidenceRequirement || !audioData) return;
    
    try {
      console.log('🎵 Guardando evidencia de audio desde Supabase Storage...');
      
      // Actualizar en Supabase: marcar subtarea como completada
      const completedAt = new Date();
      await supabaseService.updateSubtask(subtask.id, {
        isCompleted: true,
        completedAt: completedAt
      });

      // Guardar la evidencia en la base de datos
      await supabaseService.addSubtaskEvidence(
        subtask.id,
        subtask.evidenceRequirement.id,
        subtask.evidenceRequirement.type,
        `${subtask.evidenceRequirement.title} - Completada`,
        `Audio grabado: ${Math.floor(audioData.duration / 60)}:${(audioData.duration % 60).toString().padStart(2, '0')} de duración`,
        audioData.filePath, // Path en Supabase Storage
        audioData // Datos completos del audio
      );

      // Actualizar estado local
      if (task && setTask) {
        const updatedSubtasks = task.subtasks.map(s => 
          s.id === subtask.id 
            ? { 
                ...s, 
                isCompleted: true, 
                completedAt: completedAt,
                evidence: {
                  id: `evidence_${subtask.id}`,
                  subtaskId: subtask.id,
                  evidenceRequirementId: subtask.evidenceRequirement.id,
                  type: subtask.evidenceRequirement.type,
                  title: `${subtask.evidenceRequirement.title} - Completada`,
                  description: `Audio grabado: ${Math.floor(audioData.duration / 60)}:${(audioData.duration % 60).toString().padStart(2, '0')} de duración`,
                  filePath: audioData.filePath,
                  data: audioData,
                  createdAt: new Date(),
                }
              } 
            : s
        );

        const updatedTask = {
          ...task,
          subtasks: updatedSubtasks
        };

        setTask(updatedTask);
      }

      console.log(`🎤 Audio guardado exitosamente en Supabase Storage`);
    } catch (error) {
      console.error('❌ Error saving audio evidence:', error);
      throw error;
    }
  };

  const saveMediaEvidence = async (subtask: TaskSubtask, mediaData: any) => {
    if (!task || !subtask.evidenceRequirement || !mediaData) return;
    
    try {
      console.log('📸 Guardando evidencia de media desde Supabase Storage...');
      
      // Actualizar en Supabase: marcar subtarea como completada
      const completedAt = new Date();
      await supabaseService.updateSubtask(subtask.id, {
        isCompleted: true,
        completedAt: completedAt
      });

      // Crear descripción basada en el tipo de media
      const mediaTypeText = mediaData.type === 'video' ? 'Video' : 'Foto';
      const durationText = mediaData.type === 'video' && mediaData.duration 
        ? ` - Duración: ${Math.floor(mediaData.duration / 60)}:${(mediaData.duration % 60).toString().padStart(2, '0')}`
        : '';
      const description = `${mediaTypeText} capturada: ${mediaData.width}×${mediaData.height}${durationText}`;

      // Guardar la evidencia en la base de datos
      await supabaseService.addSubtaskEvidence(
        subtask.id,
        subtask.evidenceRequirement.id,
        subtask.evidenceRequirement.type,
        `${subtask.evidenceRequirement.title} - Completada`,
        description,
        mediaData.filePath, // Path en Supabase Storage
        mediaData // Datos completos del media
      );

      // Actualizar estado local
      if (task && setTask) {
        const updatedSubtasks = task.subtasks.map(s => 
          s.id === subtask.id 
            ? { 
                ...s, 
                isCompleted: true, 
                completedAt: completedAt,
                evidence: {
                  id: `evidence_${subtask.id}`,
                  subtaskId: subtask.id,
                  evidenceRequirementId: subtask.evidenceRequirement.id,
                  type: subtask.evidenceRequirement.type,
                  title: `${subtask.evidenceRequirement.title} - Completada`,
                  description,
                  filePath: mediaData.filePath,
                  data: mediaData,
                  createdAt: new Date(),
                }
              } 
            : s
        );

        const updatedTask = {
          ...task,
          subtasks: updatedSubtasks
        };

        setTask(updatedTask);
        
        // DEBUG: Confirmar que la subtarea ahora tiene evidencia
        const updatedSubtask = updatedSubtasks.find(s => s.id === subtask.id);
        console.log('🔍 Subtask después de actualizar:', {
          id: updatedSubtask?.id,
          isCompleted: updatedSubtask?.isCompleted,
          hasEvidence: !!updatedSubtask?.evidence,
          evidenceType: updatedSubtask?.evidence?.type,
          evidenceFilePath: updatedSubtask?.evidence?.filePath
        });
      }

      console.log(`📸 Media guardado exitosamente en Supabase Storage`);
    } catch (error) {
      console.error('❌ Error saving media evidence:', error);
      throw error;
    }
  };

  const handleAudioDismiss = () => {
    setShowAudioDialog(false);
    setCurrentAudioSubtask(null);
  };

  const handleViewAudio = (subtask: TaskSubtask) => {
    if (subtask.evidence && subtask.evidence.data) {
      setCurrentAudioData(subtask.evidence.data);
      setShowAudioViewer(true);
    } else {
      console.warn('No se puede mostrar el audio: datos inválidos o vacíos', subtask.evidence?.data);
      Alert.alert(
        'Error',
        'No se pueden mostrar los datos de audio. Es posible que el audio esté corrupto o vacío.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAudioViewerDismiss = () => {
    setShowAudioViewer(false);
    setCurrentAudioData(null);
  };

  const handleMediaSuccess = async (mediaData: any) => {
    console.log('📸 handleMediaSuccess called with media from Supabase Storage');

    if (!currentCameraSubtask || !task) {
      console.error('❌ Missing currentCameraSubtask or task for media evidence.');
      Alert.alert('Error', 'No se pudo procesar la evidencia de media. Faltan datos de la tarea.');
      return;
    }

    try {
      console.log('🔄 Starting media evidence capture process...');
      await saveMediaEvidence(currentCameraSubtask, mediaData);
      console.log('✅ Media evidence saved successfully');
      
      // Pequeño delay para asegurar que React procese la actualización del estado
      console.log('⏳ Esperando actualización de UI...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ Error saving media evidence:', error);
      Alert.alert(
        'Error de Media',
        'No se pudo guardar la evidencia de media. Inténtalo de nuevo.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setShowCameraDialog(false);
      setCurrentCameraSubtask(null);
      console.log('🎯 Camera dialog closed, UI should now show "Ver Media" button');
    }
  };

  const handleCameraDismiss = () => {
    setShowCameraDialog(false);
    setCurrentCameraSubtask(null);
  };

  const handleViewMedia = (subtask: TaskSubtask) => {
    if (subtask.evidence && subtask.evidence.data) {
      setCurrentMediaData(subtask.evidence.data);
      setShowMediaViewer(true);
    } else {
      console.warn('No se puede mostrar el media: datos inválidos o vacíos', subtask.evidence?.data);
      Alert.alert(
        'Error',
        'No se pueden mostrar los datos de media. Es posible que el archivo esté corrupto o vacío.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMediaViewerDismiss = () => {
    setShowMediaViewer(false);
    setCurrentMediaData(null);
  };

  const simulateNFCEvidenceCapture = async (subtask: TaskSubtask) => {
    if (!task || !subtask.evidenceRequirement) return;
    
    try {
      // Actualizar en Supabase: marcar subtarea como completada
      const completedAt = new Date();
      await supabaseService.updateSubtask(subtask.id, {
        isCompleted: true,
        completedAt: completedAt
      });

      // Simular datos NFC (en una implementación real, vendría del escáner NFC)
      const nfcData = {
        tagId: `NFC_${Date.now()}`,
        scannedAt: new Date().toISOString(),
        location: 'equipment_scanner'
      };

      // Guardar la evidencia en la base de datos
      await supabaseService.addSubtaskEvidence(
        subtask.id,
        subtask.evidenceRequirement.id,
        subtask.evidenceRequirement.type,
        `${subtask.evidenceRequirement.title} - Completada`,
        'Evidencia NFC capturada correctamente',
        undefined, // filePath
        nfcData // data
      );
      
      // Actualizar subtarea con evidencia completada Y marcada como completada
      const updatedSubtasks = task.subtasks.map(s => {
        if (s.id === subtask.id) {
          return {
            ...s,
            isCompleted: true,
            completedAt: completedAt,
            evidence: {
              id: `subtask-evidence-${Date.now()}`,
              subtaskId: subtask.id,
              type: subtask.evidenceRequirement!.type,
              title: `${subtask.evidenceRequirement!.title} - Completada`,
              description: 'Evidencia NFC capturada correctamente',
              createdAt: new Date(),
              completedBy: 'Usuario Actual',
              data: nfcData,
            },
          };
        }
        return s;
      });
      
      // Calcular el nuevo estado de la tarea basándose en las subtareas y el timer
      const newTaskStatus = calculateTaskStatus(updatedSubtasks, task.timer);
      
      const updatedTask = { 
        ...task, 
        subtasks: updatedSubtasks,
        status: newTaskStatus
      };
      setTask(updatedTask);

      // Actualizar el estado de la tarea en la base de datos si cambió
      if (newTaskStatus !== task.status) {
        try {
          await supabaseService.updateTask(taskId, { status: newTaskStatus });
          console.log('✅ Task status updated to:', newTaskStatus);
          
          // Log del cambio de estado (visible en consola)
          const statusText = getStatusText(newTaskStatus);
          console.log(`🎯 Estado actualizado automáticamente: ${statusText}`);
        } catch (error) {
          console.error('❌ Error updating task status:', error);
        }
      }

      console.log('✅ NFC evidence saved successfully to database');
    } catch (error) {
      console.error('❌ Error saving NFC evidence:', error);
      Alert.alert('Error', 'No se pudo guardar la evidencia NFC. Inténtalo de nuevo.');
    }
   };

  const simulateQREvidenceCapture = async (subtask: TaskSubtask) => {
    if (!task || !subtask.evidenceRequirement) return;
    
    try {
      // Actualizar en Supabase: marcar subtarea como completada
      const completedAt = new Date();
      await supabaseService.updateSubtask(subtask.id, {
        isCompleted: true,
        completedAt: completedAt
      });

      // Simular datos QR (en una implementación real, vendría del escáner QR)
      const qrData = {
        qrCode: `QR_${Date.now()}`,
        scannedAt: new Date().toISOString(),
        content: 'task_verification_code',
        format: 'QR_CODE'
      };

      // Guardar la evidencia en la base de datos
      await supabaseService.addSubtaskEvidence(
        subtask.id,
        subtask.evidenceRequirement.id,
        subtask.evidenceRequirement.type,
        `${subtask.evidenceRequirement.title} - Completada`,
        'Evidencia QR capturada correctamente',
        undefined, // filePath
        qrData // data
      );
      
      // Actualizar subtarea con evidencia completada Y marcada como completada
      const updatedSubtasks = task.subtasks.map(s => {
        if (s.id === subtask.id) {
          return {
            ...s,
            isCompleted: true,
            completedAt: completedAt,
            evidence: {
              id: `subtask-evidence-${Date.now()}`,
              subtaskId: subtask.id,
              type: subtask.evidenceRequirement!.type,
              title: `${subtask.evidenceRequirement!.title} - Completada`,
              description: 'Evidencia QR capturada correctamente',
              createdAt: new Date(),
              completedBy: 'Usuario Actual',
              data: qrData,
            },
          };
        }
        return s;
      });
      
      // Calcular el nuevo estado de la tarea basándose en las subtareas y el timer
      const newTaskStatus = calculateTaskStatus(updatedSubtasks, task.timer);
      
      const updatedTask = { 
        ...task, 
        subtasks: updatedSubtasks,
        status: newTaskStatus
      };
      setTask(updatedTask);

      // Actualizar el estado de la tarea en la base de datos si cambió
      if (newTaskStatus !== task.status) {
        try {
          await supabaseService.updateTask(taskId, { status: newTaskStatus });
          console.log('✅ Task status updated to:', newTaskStatus);
          
          // Log del cambio de estado (visible en consola)
          const statusText = getStatusText(newTaskStatus);
          console.log(`🎯 Estado actualizado automáticamente: ${statusText}`);
        } catch (error) {
          console.error('❌ Error updating task status:', error);
        }
      }

      console.log('✅ QR evidence saved successfully to database');
    } catch (error) {
      console.error('❌ Error saving QR evidence:', error);
      Alert.alert('Error', 'No se pudo guardar la evidencia QR. Inténtalo de nuevo.');
    }
   };

  const captureRealLocationEvidence = async (subtask: TaskSubtask, realLocationData: any) => {
    if (!task || !subtask.evidenceRequirement || !realLocationData) return;
    
    try {
      // Actualizar en Supabase: marcar subtarea como completada
      const completedAt = new Date();
      await supabaseService.updateSubtask(subtask.id, {
        isCompleted: true,
        completedAt: completedAt
      });

      // Usar datos reales de ubicación GPS del dispositivo
      const locationData = {
        latitude: realLocationData.latitude,
        longitude: realLocationData.longitude,
        accuracy: realLocationData.accuracy,
        altitude: realLocationData.altitude,
        timestamp: realLocationData.timestamp,
        address: realLocationData.address,
        provider: realLocationData.provider,
        speed: realLocationData.speed,
        heading: realLocationData.heading,
        capturedAt: new Date().toISOString(),
        deviceInfo: {
          platform: 'mobile',
          source: 'GPS real del dispositivo'
        }
      };

      // Guardar la evidencia en la base de datos
      await supabaseService.addSubtaskEvidence(
        subtask.id,
        subtask.evidenceRequirement.id,
        subtask.evidenceRequirement.type,
        `${subtask.evidenceRequirement.title} - Completada`,
        `Ubicación GPS capturada: ${locationData.address || 'Coordenadas verificadas'}`,
        undefined, // filePath
        locationData // data
      );
      
      // Actualizar subtarea con evidencia completada Y marcada como completada
      const updatedSubtasks = task.subtasks.map(s => {
        if (s.id === subtask.id) {
          return {
            ...s,
            isCompleted: true,
            completedAt: completedAt,
            evidence: {
              id: `subtask-evidence-${Date.now()}`,
              subtaskId: subtask.id,
              type: subtask.evidenceRequirement!.type,
              title: `${subtask.evidenceRequirement!.title} - Completada`,
              description: `Ubicación GPS capturada: ${locationData.address || 'Coordenadas verificadas'}`,
              createdAt: new Date(),
              completedBy: 'Usuario Actual',
              data: locationData,
            },
          };
        }
        return s;
      });
      
      // Calcular el nuevo estado de la tarea basándose en las subtareas y el timer
      const newTaskStatus = calculateTaskStatus(updatedSubtasks, task.timer);
      
      const updatedTask = { 
        ...task, 
        subtasks: updatedSubtasks,
        status: newTaskStatus
      };
      setTask(updatedTask);

      // Actualizar el estado de la tarea en la base de datos si cambió
      if (newTaskStatus !== task.status) {
        try {
          await supabaseService.updateTask(taskId, { status: newTaskStatus });
          console.log('✅ Task status updated to:', newTaskStatus);
          
          // Log del cambio de estado (visible en consola)
          const statusText = getStatusText(newTaskStatus);
          console.log(`🎯 Estado actualizado automáticamente: ${statusText}`);
        } catch (error) {
          console.error('❌ Error updating task status:', error);
        }
      }

      console.log('✅ Real GPS location evidence saved successfully to database');
      console.log(`📍 Location details: ${locationData.latitude}, ${locationData.longitude} (±${locationData.accuracy})`);
    } catch (error) {
      console.error('❌ Error saving real location evidence:', error);
      Alert.alert('Error', 'No se pudo guardar la evidencia de ubicación real. Inténtalo de nuevo.');
    }
   };



  const simulateSignatureEvidenceCapture = async (subtask: TaskSubtask, signatureData: string) => {
    if (!task || !subtask.evidenceRequirement) return;
    
    // Validar que los datos de firma sean válidos antes de guardar
    if (!signatureData || typeof signatureData !== 'string' || signatureData.trim() === '') {
      console.error('Error: datos de firma inválidos', signatureData);
      Alert.alert('Error', 'Los datos de la firma no son válidos. Inténtalo de nuevo.');
      return;
    }

    // Validar que los datos sean JSON válido
    try {
      JSON.parse(signatureData);
    } catch (error) {
      console.error('Error: datos de firma no son JSON válido', error, signatureData);
      Alert.alert('Error', 'Los datos de la firma están corruptos. Inténtalo de nuevo.');
      return;
    }
    
    try {
      // Actualizar en Supabase: marcar subtarea como completada
      const completedAt = new Date();
      await supabaseService.updateSubtask(subtask.id, {
        isCompleted: true,
        completedAt: completedAt
      });

      // Guardar la evidencia en la base de datos
      await supabaseService.addSubtaskEvidence(
        subtask.id,
        subtask.evidenceRequirement.id,
        subtask.evidenceRequirement.type,
        `${subtask.evidenceRequirement.title} - Completada`,
        'Evidencia de firma capturada correctamente',
        undefined, // filePath
        signatureData // data
      );
      
      // Actualizar subtarea con evidencia completada Y marcada como completada
      const updatedSubtasks = task.subtasks.map(s => {
        if (s.id === subtask.id) {
          return {
            ...s,
            isCompleted: true,
            completedAt: completedAt,
            evidence: {
              id: `subtask-evidence-${Date.now()}`,
              subtaskId: subtask.id,
              type: subtask.evidenceRequirement!.type,
              title: `${subtask.evidenceRequirement!.title} - Completada`,
              description: 'Evidencia de firma capturada correctamente',
              createdAt: new Date(),
              completedBy: 'Usuario Actual',
              // Guardar los datos de la firma para poder consultarla
              data: signatureData,
            },
          };
        }
        return s;
      });
      
      // Calcular el nuevo estado de la tarea basándose en las subtareas y el timer
      const newTaskStatus = calculateTaskStatus(updatedSubtasks, task.timer);
      
      const updatedTask = { 
        ...task, 
        subtasks: updatedSubtasks,
        status: newTaskStatus
      };
      setTask(updatedTask);

      // Actualizar el estado de la tarea en la base de datos si cambió
      if (newTaskStatus !== task.status) {
        try {
          await supabaseService.updateTask(taskId, { status: newTaskStatus });
          console.log('✅ Task status updated to:', newTaskStatus);
          
          // Log del cambio de estado (visible en consola)
          const statusText = getStatusText(newTaskStatus);
          console.log(`🎯 Estado actualizado automáticamente: ${statusText}`);
        } catch (error) {
          console.error('❌ Error updating task status:', error);
        }
      }

      console.log('✅ Signature evidence saved successfully to database');
    } catch (error) {
      console.error('❌ Error saving signature evidence:', error);
      Alert.alert('Error', 'No se pudo guardar la evidencia de firma. Inténtalo de nuevo.');
    }
  };

  const simulateEvidenceCapture = (subtask: TaskSubtask) => {
    if (!task || !subtask.evidenceRequirement) return;
    
    // Simulación de captura de evidencia
    Alert.alert(
      'Evidencia Capturada',
      `Se ha simulado la captura de evidencia de tipo ${getEvidenceTypeName(subtask.evidenceRequirement.type)}`,
      [
        { text: 'OK', onPress: () => {
          // Actualizar subtarea con evidencia completada (pero no marcar como completada automáticamente)
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
          
          // Calcular el nuevo estado de la tarea basándose en las subtareas y el timer
          const newTaskStatus = calculateTaskStatus(updatedSubtasks, task.timer);
          
          const updatedTask = { 
            ...task, 
            subtasks: updatedSubtasks,
            status: newTaskStatus
          };
          setTask(updatedTask);

          // Actualizar el estado de la tarea en la base de datos si cambió
          if (newTaskStatus !== task.status) {
            try {
              supabaseService.updateTask(taskId, { status: newTaskStatus });
              console.log('✅ Task status updated to:', newTaskStatus);
              
              // Log del cambio de estado (visible en consola)
              const statusText = getStatusText(newTaskStatus);
              console.log(`🎯 Estado actualizado automáticamente: ${statusText}`);
            } catch (error) {
              console.error('❌ Error updating task status:', error);
            }
          }
        }}
      ]
    );
  };

  const toggleTimer = async () => {
    console.log('🔄 toggleTimer called - task:', !!task, 'currentUserId:', currentUserId);
    
    if (isReadOnly) {
      console.log('❌ Timer blocked: read-only mode (past day)');
      Alert.alert('Acción no permitida', 'No puedes modificar tareas de días pasados.');
      return;
    }
    
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
          const updatedTask = {
            ...task,
            timer: {
              ...task.timer,
              isRunning: false,
              currentSessionStart: undefined,
              totalElapsed: totalElapsed,
            }
          };
          setTask(updatedTask);
          
          updateTimerDisplay(totalElapsed);
          
          // Actualizar estado de la tarea basándose en el timer
          await updateTaskStatusBasedOnTimer(updatedTask);
        } catch (dbError) {
          console.warn('⚠️ DB functions not available yet. Using local mode.');
          console.log('💡 To enable full persistence, execute: scripts/add_timer_fields_to_tasks.sql');
          
          // Fallback local completo - funciona sin base de datos
          const sessionDuration = task.timer.currentSessionStart 
            ? Math.floor((new Date().getTime() - task.timer.currentSessionStart.getTime()) / 1000)
            : 0;
          const totalElapsed = task.timer.totalElapsed + sessionDuration;
          
          const updatedTask = {
            ...task,
            timer: {
              ...task.timer,
              isRunning: false,
              currentSessionStart: undefined,
              totalElapsed: totalElapsed,
            }
          };
          setTask(updatedTask);
          
          updateTimerDisplay(totalElapsed);
          console.log('✅ Timer stopped via local fallback, total elapsed:', totalElapsed);
          
          // Actualizar estado de la tarea basándose en el timer
          await updateTaskStatusBasedOnTimer(updatedTask);
        }
      } else {
        console.log('▶️ Trying to start timer...');
        
        try {
          // Intentar usar la función de base de datos
          await supabaseService.startTaskTimer(taskId, currentUserId);
          console.log('✅ Timer started via DB');
          
          const now = new Date();
          const updatedTask = {
            ...task,
            timer: {
              ...task.timer,
              isRunning: true,
              currentSessionStart: now,
            }
          };
          setTask(updatedTask);
          
          // Actualizar estado de la tarea basándose en el timer
          await updateTaskStatusBasedOnTimer(updatedTask);
        } catch (dbError) {
          console.warn('⚠️ DB functions not available yet. Using local mode.');
          console.log('💡 To enable full persistence, execute: scripts/add_timer_fields_to_tasks.sql');
          
          // Fallback local completo - funciona sin base de datos
          const now = new Date();
          const updatedTask = {
            ...task,
            timer: {
              ...task.timer,
              isRunning: true,
              currentSessionStart: now,
            }
          };
          setTask(updatedTask);
          console.log('✅ Timer started via local fallback');
          
          // Actualizar estado de la tarea basándose en el timer
          await updateTaskStatusBasedOnTimer(updatedTask);
          
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



  const getEvidenceIcon = (type: EvidenceType, config?: any) => {
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
      case EvidenceType.QR:
        return 'qrcode';
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
      case EvidenceType.QR:
        return 'Escanear QR';
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
      case EvidenceType.QR:
        return 'QR';
      default:
        return 'Evidencia';
    }
  };

  const getSubtaskCheckboxStatus = (subtask: TaskSubtask) => {
    // Si está completada, siempre checked
    if (subtask.isCompleted) return 'checked';
    
    // REGLA CRÍTICA: Si hay evidencia, el check DEBE estar marcado
    if (subtask.evidence) return 'checked';
    
    // Si requiere evidencia obligatoria y no la tiene, bloqueado (se mostrará candado)
    if (subtask.evidenceRequirement?.isRequired && !subtask.evidence) {
      return 'unchecked'; // Mantener unchecked pero se mostrará candado
    }
    
      // En cualquier otro caso, normal
  return 'unchecked';
};

const addTextComment = async () => {
    console.log('🔄 addTextComment called');
    
    if (isReadOnly) {
      console.log('❌ Comment blocked: read-only mode (past day)');
      Alert.alert('Acción no permitida', 'No puedes agregar comentarios en días pasados.');
      return;
    }
    
    console.log('📝 Comment text:', commentText);
    console.log('📝 Comment text trimmed:', commentText.trim());
    console.log('📝 Comment text length:', commentText.trim().length);
    
    if (commentText.trim() === '') {
      console.log('❌ Comment text is empty, returning');
      return;
    }
    
    try {
      console.log('🚀 Adding text comment:', commentText);
      console.log('🎯 Task ID:', taskId);
      
      // Agregar comentario a la base de datos
      const newComment = await supabaseService.addTaskComment(
        taskId, 
        commentText.trim(), 
        CommentType.TEXT
      );
      
      console.log('✅ Comment added to DB:', newComment);
      
      // Actualizar estado local
      if (task) {
        const updatedTask = {
          ...task,
          comments: [...task.comments, newComment]
        };
        setTask(updatedTask);
        console.log('✅ Local state updated');
      } else {
        console.log('❌ No task in state to update');
      }
      
      // Limpiar el input después de enviar
      setCommentText('');
      console.log('✅ Input cleared');
      
      console.log('✅ Text comment added successfully');
      Alert.alert('Éxito', 'Comentario agregado correctamente');
    } catch (error) {
      console.error('❌ Error adding text comment:', error);
      Alert.alert('Error', `No se pudo agregar el comentario: ${error.message || error}`);
    }
  };

  const addVoiceComment = () => {
    if (isReadOnly) {
      console.log('❌ Voice comment blocked: read-only mode (past day)');
      Alert.alert('Acción no permitida', 'No puedes agregar comentarios en días pasados.');
      return;
    }
    
    Alert.alert(
      'Comentario de Voz',
      '¿Deseas grabar un comentario de voz?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Grabar', onPress: async () => {
          try {
            // TODO: Implementar grabación real de audio
            // Por ahora, simulamos con un comentario de texto que indica que es de voz
            const voiceCommentContent = `Nota de voz grabada el ${new Date().toLocaleString('es-ES')}`;
            
            console.log('Adding voice comment simulation');
            
            // Agregar comentario de voz simulado a la base de datos
            const newComment = await supabaseService.addTaskComment(
              taskId, 
              voiceCommentContent, 
              CommentType.VOICE
            );
            
            // Actualizar estado local
            if (task) {
              const updatedTask = {
                ...task,
                comments: [...task.comments, newComment]
              };
              setTask(updatedTask);
            }
            
            console.log('✅ Voice comment added successfully (simulated)');
            Alert.alert('Comentario de Voz', 'Se ha agregado tu nota de voz.');
          } catch (error) {
            console.error('❌ Error adding voice comment:', error);
            Alert.alert('Error', 'No se pudo agregar el comentario de voz. Inténtalo de nuevo.');
          }
        }},
      ]
    );
  };

  const deleteComment = async (commentId: string, commentContent: string) => {
    Alert.alert(
      'Borrar Comentario',
      `¿Estás seguro de que quieres borrar este comentario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: async () => {
          try {
            console.log('🗑️ Deleting comment:', commentId);
            
            // Borrar comentario de la base de datos
            await supabaseService.deleteTaskComment(commentId);
            
            // Actualizar estado local - remover el comentario borrado
            if (task) {
              const updatedTask = {
                ...task,
                comments: task.comments.filter(comment => comment.id !== commentId)
              };
              setTask(updatedTask);
            }
            
            console.log('✅ Comment deleted successfully');
            Alert.alert('Éxito', 'Comentario borrado correctamente');
          } catch (error) {
            console.error('❌ Error deleting comment:', error);
            Alert.alert('Error', `No se pudo borrar el comentario: ${error.message || error}`);
          }
        }},
      ]
    );
  };

  const isCommentAuthor = (comment: TaskComment): boolean => {
    if (!currentUserId) {
      console.log('⚠️ No current user ID available for comment ownership check');
      return false;
    }
    
    const isAuthor = comment.userId === currentUserId;
    console.log('🔍 Comment ownership check:', {
      commentId: comment.id,
      commentUserId: comment.userId,
      currentUserId: currentUserId,
      isAuthor: isAuthor,
      author: comment.author
    });
    
    return isAuthor;
  };

  const reportProblem = () => {
    if (isReadOnly) {
      console.log('❌ Problem report blocked: read-only mode (past day)');
      Alert.alert('Acción no permitida', 'No puedes reportar problemas en días pasados.');
      return;
    }
    
    setShowProblemDialog(true);
  };

  const handleSubmitProblemReport = async (
    reportType: ProblemReportType,
    severity: ProblemSeverity,
    title: string,
    description: string
  ) => {
    if (!task) return;

    setIsSubmittingReport(true);
    
    try {
      console.log('🔄 Submitting problem report:', {
        taskId,
        reportType,
        severity,
        title,
        description
      });
      
      // Agregar reporte a la base de datos
      const newReport = await supabaseService.addTaskProblemReport(
        taskId,
        reportType,
        severity,
        title,
        description
      );
      
      console.log('✅ Problem report added to DB:', newReport);
      
      // Actualizar estado local
      const updatedTask = {
        ...task,
        problemReports: [...task.problemReports, newReport]
      };
      setTask(updatedTask);
      
      console.log('✅ Local state updated');
      Alert.alert('Éxito', 'Problema reportado correctamente. El equipo será notificado.');
      
    } catch (error) {
      console.error('❌ Error submitting problem report:', error);
      Alert.alert('Error', `No se pudo reportar el problema: ${error.message || error}`);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeleteReport = (report: TaskProblemReport) => {
    if (isReadOnly) {
      console.log('❌ Delete report blocked: read-only mode (past day)');
      Alert.alert('Acción no permitida', 'No puedes eliminar reportes en días pasados.');
      return;
    }
    
    console.log('🗑️ Initiating delete for report:', report.title);
    setReportToDelete(report);
    setShowDeleteReportDialog(true);
  };

  const handleConfirmDeleteReport = async () => {
    if (!reportToDelete || !task) return;

    setIsDeletingReport(true);
    
    try {
      console.log('🗑️ Deleting problem report:', reportToDelete.id);
      
      // Eliminar el reporte en Supabase
      await supabaseService.deleteTaskProblemReport(reportToDelete.id);
      
      // Actualizar estado local - remover el reporte eliminado
      const updatedTask = {
        ...task,
        problemReports: task.problemReports.filter(report => report.id !== reportToDelete.id)
      };
      setTask(updatedTask);
      
      console.log('✅ Report deleted and local state updated');
      Alert.alert('Éxito', 'Reporte eliminado correctamente.');
      
    } catch (error) {
      console.error('❌ Error deleting problem report:', error);
      Alert.alert('Error', `No se pudo eliminar el reporte: ${error.message || error}`);
    } finally {
      setIsDeletingReport(false);
      setShowDeleteReportDialog(false);
      setReportToDelete(null);
    }
  };

  const handleCancelDeleteReport = () => {
    setShowDeleteReportDialog(false);
    setReportToDelete(null);
  };

  const canDeleteReport = (report: TaskProblemReport): boolean => {
    return currentUserId === report.userId;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return '#666';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      case 'low': return 'Bajo';
      default: return severity;
    }
  };

  const getReportTypeIcon = (reportType: string) => {
    switch (reportType) {
      case 'blocking_issue': return 'block-helper';
      case 'missing_tools': return 'toolbox-outline';
      case 'unsafe_conditions': return 'shield-alert-outline';
      case 'technical_issue': return 'tools';
      case 'access_denied': return 'lock-outline';
      case 'material_shortage': return 'package-variant';
      case 'weather_conditions': return 'weather-lightning-rainy';
      case 'other': return 'alert-circle-outline';
      default: return 'alert';
    }
  };

  // Helper functions for subtasks
  const getSubtaskStyle = (subtask: TaskSubtask) => {
    if (subtask.isCompleted) {
      return [styles.subtask, styles.completedSubtask];
    }
    if (isSubtaskBlocked(subtask)) {
      return [styles.subtask, styles.blockedSubtask];
    }
    return styles.subtask;
  };

  const getSubtaskRightElement = (subtask: TaskSubtask) => {
    if (isSubtaskBlocked(subtask)) {
      return (
        <Icon 
          source="lock" 
          size={20} 
          color={theme.colors.outline}
        />
      );
    }
    return null;
  };

  const isSubtaskBlocked = (subtask: TaskSubtask) => {
    return subtask.requiredEvidence?.some(evidence => evidence.isRequired) && 
           !subtask.evidence && 
           !subtask.isCompleted;
  };

  // Helper functions for evidence
  const getEvidenceColor = (evidence: any, subtask: TaskSubtask) => {
    return hasEvidence(evidence, subtask) ? '#4CAF50' : theme.colors.outline;
  };

  const getEvidenceTitle = (evidence: any) => {
    return evidence.title || evidence.description || 'Evidencia requerida';
  };

  const getEvidenceStatus = (evidence: any, subtask: TaskSubtask) => {
    return hasEvidence(evidence, subtask);
  };

  const hasEvidence = (evidence: any, subtask: TaskSubtask) => {
    return !!subtask.evidence && subtask.evidence.type === evidence.type;
  };

  const viewEvidence = (evidence: any, subtask: TaskSubtask) => {
    // Implementar visualización de evidencia
    console.log('Viewing evidence:', evidence, subtask);
  };

  const captureEvidence = (evidence: any, subtask: TaskSubtask) => {
    // Implementar captura de evidencia
    console.log('Capturing evidence:', evidence, subtask);
  };

  const getEvidenceCTA = (evidence: any) => {
    switch (evidence.type) {
      case 'photo': return 'Tomar foto';
      case 'video': return 'Grabar video';
      case 'signature': return 'Firmar';
      case 'location': return 'Obtener ubicación';
      case 'audio': return 'Grabar audio';
      case 'nfc': return 'Escanear NFC';
      case 'qr': return 'Escanear QR';
      default: return 'Capturar evidencia';
    }
  };

  const handleSignatureSave = (signature: string) => {
    console.log('Signature saved:', signature);
    setCurrentSignatureData(signature);
    setShowSignatureDialog(false);
  };

  const handleLocationSave = (location: any) => {
    console.log('Location saved:', location);
    setCurrentLocationData(location);
    setShowLocationDialog(false);
  };

  const handleAudioSave = (audio: any) => {
    console.log('Audio saved:', audio);
    setCurrentAudioData(audio);
    setShowAudioDialog(false);
  };

  const handleCameraCapture = (media: any) => {
    console.log('Camera capture:', media);
    setCurrentMediaData(media);
    setShowCameraDialog(false);
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
      {/* AppBar Sticky - Medium Flexible */}
      <Appbar.Header 
        mode="medium" 
        style={styles.appBar}
        statusBarHeight={0}
      >
        {/* Botón de volver */}
        <Appbar.BackAction onPress={onGoBack} />
        
        {/* Contenido del AppBar */}
        <View style={styles.appBarContent}>
          {/* Chips de estado en la parte superior derecha */}
          <View style={styles.appBarTop}>
            <View style={styles.statusContainer}>
              {isReadOnly && (
                <Chip 
                  mode="outlined"
                  style={[styles.priorityBadge, { borderColor: theme.colors.outline }]}
                  textStyle={{ color: theme.colors.outline, fontSize: 11 }}
                  compact
                  icon="lock"
                >
                  SOLO LECTURA
                </Chip>
              )}
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
          
          {/* Título */}
          <View style={styles.appBarTitle}>
            <Appbar.Content 
              title={task.title}
              titleStyle={styles.appBarTitleText}
            />
          </View>
        </View>
      </Appbar.Header>

      {/* Contenido Scrolleable */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información de la tarea */}
        <View style={styles.taskInfo}>
          <Text variant="bodyMedium" style={styles.description}>
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
          <Card.Title title="Temporizador de Trabajo" />
          <Card.Content>
            <View style={styles.timerContainer}>
              <Text variant="headlineSmall">{timerDisplay}</Text>
              <Button 
                mode="contained" 
                onPress={toggleTimer}
                style={styles.timerButton}
                disabled={isReadOnly}
              >
                {isReadOnly ? 'Timer - Solo lectura' : 
                 task.timer?.isRunning ? 'Pausar' : 'Iniciar'}
              </Button>
              <Text variant="bodySmall" style={styles.timerInfo}>
                {task.timer?.totalElapsed ? `Total acumulado: ${formatDuration(task.timer.totalElapsed)}` : 'No hay tiempo registrado'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Progreso de la tarea */}
        <Card style={styles.card}>
          <Card.Title title="Progreso de la Tarea" />
          <Card.Content>
            <View style={styles.progressContainer}>
              <Text variant="bodyLarge">
                {completedSubtasks} de {totalSubtasks} subtareas completadas
              </Text>
              <ProgressBar 
                progress={progress} 
                style={styles.progressBar}
                color={progress === 1 ? theme.colors.primary : theme.colors.secondary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Subtareas */}
        <Card style={styles.card}>
          <Card.Title title="Subtareas" />
          <Card.Content>
            {task.subtasks.map((subtask, index) => (
              <View key={subtask.id}>
                <List.Item
                  title={subtask.title}
                  description={subtask.description}
                  style={getSubtaskStyle(subtask)}
                  left={() => (
                    <Checkbox
                      status={subtask.isCompleted ? 'checked' : 'unchecked'}
                      onPress={() => toggleSubtask(subtask.id)}
                      disabled={isReadOnly}
                    />
                  )}
                  right={() => getSubtaskRightElement(subtask)}
                />
                
                {/* Evidencia requerida */}
                {subtask.evidenceRequirement && (
                  <View style={styles.evidenceRequirement}>
                    <View style={styles.evidenceHeader}>
                      <Icon 
                        source={getEvidenceIcon(subtask.evidenceRequirement.type, subtask.evidenceRequirement.config)} 
                        size={16} 
                        color={subtask.evidence ? '#4CAF50' : theme.colors.outline}
                      />
                      <Text variant="bodySmall" style={styles.evidenceTitle}>
                        {subtask.evidenceRequirement.title || getEvidenceTypeName(subtask.evidenceRequirement.type)}
                      </Text>
                      {subtask.evidence && (
                        <Icon 
                          source="check-circle" 
                          size={16} 
                          color="#4CAF50" 
                        />
                      )}
                    </View>
                    
                    <Text variant="bodySmall" style={styles.evidenceDescription}>
                      {subtask.evidenceRequirement.description}
                    </Text>
                    
                    {subtask.evidence ? (
                      <View style={styles.evidenceActions}>
                        <Button 
                          mode="outlined" 
                          onPress={() => {
                            // Usar las funciones originales de visualización
                            if (subtask.evidenceRequirement!.type === EvidenceType.SIGNATURE) {
                              setCurrentSignatureData(subtask.evidence.data);
                              setShowSignatureViewer(true);
                            } else if (subtask.evidenceRequirement!.type === EvidenceType.LOCATION) {
                              setCurrentLocationData(subtask.evidence.data);
                              setShowLocationViewer(true);
                            } else if (subtask.evidenceRequirement!.type === EvidenceType.AUDIO) {
                              setCurrentAudioData(subtask.evidence.data);
                              setShowAudioViewer(true);
                            } else if (subtask.evidenceRequirement!.type === EvidenceType.PHOTO_VIDEO) {
                              setCurrentMediaData(subtask.evidence.data);
                              setShowMediaViewer(true);
                            }
                          }}
                          style={styles.evidenceActionButton}
                          compact
                        >
                          Ver evidencia
                        </Button>
                      </View>
                    ) : (
                      <View style={styles.evidenceActions}>
                        <Button 
                          mode="contained" 
                          onPress={() => handleSubtaskEvidence(subtask)}
                          style={styles.evidenceActionButton}
                          compact
                          disabled={isReadOnly}
                        >
                          {isReadOnly ? 'Solo lectura' : getSubtaskEvidenceActionText(subtask.evidenceRequirement)}
                        </Button>
                      </View>
                    )}
                  </View>
                )}
                
                {index < task.subtasks.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Comentarios */}
        <Card style={styles.card}>
          <Card.Title title="Comentarios" />
          <Card.Content>
            {task.comments && task.comments.length > 0 ? (
              task.comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentHeaderLeft}>
                      <Text variant="bodyMedium" style={styles.commentAuthor}>
                        {comment.authorName}
                      </Text>
                      <Text variant="bodySmall" style={styles.commentDate}>
                        {comment.createdAt ? 
                          `${comment.createdAt.toLocaleDateString('es-ES')} ${comment.createdAt.toLocaleTimeString('es-ES')}` : 
                          'Fecha no disponible'
                        }
                      </Text>
                    </View>
                    {comment.userId === currentUserId && (
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => deleteComment(comment.id, comment.content)}
                        style={styles.deleteButton}
                        disabled={isDeletingComment || isReadOnly}
                      />
                    )}
                  </View>
                  
                  {comment.type === 'text' ? (
                    <Text variant="bodyMedium">{comment.content}</Text>
                  ) : (
                    <View>
                      <Chip 
                        mode="outlined" 
                        style={styles.voiceChip}
                        icon="microphone"
                        onPress={() => playVoiceComment(comment.content)}
                      >
                        Mensaje de voz
                      </Chip>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.emptyState}>
                No hay comentarios aún
              </Text>
            )}
            
            {/* Input para nuevos comentarios */}
            <View style={styles.commentInputContainer}>
              <TextInput
                mode="outlined"
                placeholder={isReadOnly ? "Solo lectura - No puedes comentar" : "Escribe un comentario..."}
                value={commentText}
                onChangeText={setCommentText}
                style={styles.commentInput}
                multiline
                numberOfLines={2}
                disabled={isReadOnly}
              />
              <IconButton
                icon="send"
                size={24}
                onPress={addTextComment}
                style={styles.sendButton}
                disabled={isReadOnly || commentText.trim() === ''}
              />
              <IconButton
                icon="microphone"
                size={24}
                onPress={addVoiceComment}
                style={styles.microphoneButton}
                disabled={isReadOnly}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Reportes de problemas */}
        <Card style={styles.card}>
          <Card.Title title="Reportes de Problemas" />
          <Card.Content>
            {task.problemReports && task.problemReports.length > 0 ? (
              task.problemReports.map((report) => (
                <View key={report.id} style={styles.problemItem}>
                  <View style={styles.problemHeader}>
                    <View style={styles.problemHeaderLeft}>
                      <Chip 
                        mode="outlined" 
                        style={[styles.severityChip, { borderColor: getSeverityColor(report.severity) }]}
                        textStyle={{ color: getSeverityColor(report.severity), fontSize: 10 }}
                        compact
                      >
                        {getSeverityText(report.severity)}
                      </Chip>
                      <Text variant="bodySmall" style={styles.problemDate}>
                        {report.createdAt ? 
                          `${report.createdAt.toLocaleDateString('es-ES')} - ${report.reporterName}` : 
                          `Sin fecha - ${report.reporterName}`
                        }
                      </Text>
                    </View>
                    {report.userId === currentUserId && (
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDeleteReport(report)}
                        style={styles.deleteButton}
                        disabled={isDeletingReport || isReadOnly}
                      />
                    )}
                  </View>
                  
                  <Text variant="bodyMedium" style={styles.problemDescription}>
                    {report.description}
                  </Text>
                  
                  {report.status && (
                    <Chip 
                      mode="flat" 
                      style={styles.statusChip}
                      textStyle={styles.statusText}
                      compact
                    >
                      Estado: {report.status}
                    </Chip>
                  )}
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.emptyState}>
                No hay reportes de problemas
              </Text>
            )}
            
            {isReadOnly && (
              <Text variant="bodySmall" style={styles.readOnlyMessage}>
                Solo lectura - No puedes modificar reportes de días pasados
              </Text>
            )}
            
            <Button 
              mode="contained" 
              onPress={() => setShowProblemDialog(true)}
              style={styles.reportButton}
              disabled={isSubmittingReport || isReadOnly}
            >
              {isReadOnly ? 'Solo lectura' : 'Reportar Problema'}
            </Button>
          </Card.Content>
        </Card>

        {/* Espacio adicional al final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Dialogs */}
      <ProblemReportDialog
        visible={showProblemDialog}
        onDismiss={() => setShowProblemDialog(false)}
        onSubmit={reportProblem}
        isSubmitting={isSubmittingReport}
      />

      <NFCDialog
        visible={showNFCDialog}
        onDismiss={() => setShowNFCDialog(false)}
        onSuccess={handleNFCSuccess}
      />

      <QRDialog
        visible={showQRDialog}
        onDismiss={() => setShowQRDialog(false)}
        onSuccess={handleQRSuccess}
      />

      <SignatureDialog
        visible={showSignatureDialog}
        onDismiss={() => setShowSignatureDialog(false)}
        onSave={handleSignatureSave}
      />

      <Portal>
        <Dialog visible={showSignatureViewer} onDismiss={() => setShowSignatureViewer(false)}>
          <Dialog.Title>Firma</Dialog.Title>
          <Dialog.Content>
            <SignatureViewer signature={currentSignatureData} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSignatureViewer(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <LocationDialog
        visible={showLocationDialog}
        onDismiss={() => setShowLocationDialog(false)}
        onSave={handleLocationSave}
      />

      <Portal>
        <Dialog visible={showLocationViewer} onDismiss={() => setShowLocationViewer(false)}>
          <Dialog.Title>Ubicación</Dialog.Title>
          <Dialog.Content>
            <LocationViewer location={currentLocationData} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLocationViewer(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <AudioDialog
        visible={showAudioDialog}
        onDismiss={() => setShowAudioDialog(false)}
        onSave={handleAudioSave}
      />

      <Portal>
        <Dialog visible={showAudioViewer} onDismiss={() => setShowAudioViewer(false)}>
          <Dialog.Title>Audio</Dialog.Title>
          <Dialog.Content>
            <AudioViewer audio={currentAudioData} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAudioViewer(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <CameraDialog
        visible={showCameraDialog}
        onDismiss={() => setShowCameraDialog(false)}
        onCapture={handleCameraCapture}
      />

      <Portal>
        <Dialog visible={showMediaViewer} onDismiss={() => setShowMediaViewer(false)}>
          <Dialog.Title>Media</Dialog.Title>
          <Dialog.Content>
            <MediaViewer 
              mediaType={currentMediaData?.type || 'image'}
              mediaUri={currentMediaData?.uri || ''}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowMediaViewer(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appBarContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  appBarTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  appBarTitle: {
    flex: 1,
  },
  appBarTitleText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  content: {
    flex: 1,
  },
  taskInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskMeta: {
    gap: 8,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskProject: {
    flex: 1,
  },
  taskLocation: {
    flex: 1,
  },
  taskDueDate: {
    flex: 1,
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  timerContainer: {
    alignItems: 'center',
    gap: 12,
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
    height: 8,
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
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  evidenceTitle: {
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
  evidenceDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  evidenceActions: {
    alignItems: 'flex-start',
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
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  commentHeaderLeft: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
  },
  commentDate: {
    opacity: 0.6,
  },
  deleteButton: {
    margin: 0,
    marginTop: -8,
    marginRight: -8,
  },
  voiceChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
  },
  sendButton: {
    marginBottom: 4,
  },
  microphoneButton: {
    marginBottom: 4,
  },
  problemItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  problemHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  problemDate: {
    opacity: 0.6,
  },
  problemDescription: {
    marginBottom: 8,
  },
  severityChip: {
    alignSelf: 'flex-start',
  },
  reportButton: {
    marginTop: 16,
  },
  emptyState: {
    textAlign: 'center',
    opacity: 0.6,
    marginVertical: 16,
  },
  readOnlyMessage: {
    textAlign: 'center',
    opacity: 0.6,
    marginVertical: 8,
    fontStyle: 'italic',
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
}); 
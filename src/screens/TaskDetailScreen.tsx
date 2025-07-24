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
  TextInput
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
import { ProblemReportDialog, NFCDialog, LocationDialog, LocationViewer, AudioDialog, AudioViewer, SignatureDialog, SignatureViewer } from '@/components';

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
  const [commentText, setCommentText] = useState('');
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showNFCDialog, setShowNFCDialog] = useState(false);
  const [currentNFCSubtask, setCurrentNFCSubtask] = useState<TaskSubtask | null>(null);
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

  const handleNFCSuccess = async () => {
    if (!currentNFCSubtask || !task) return;
    
    // Cerrar el diálogo NFC
    setShowNFCDialog(false);
    
    try {
      // Simular la captura de evidencia NFC y marcar como completada
      await simulateNFCEvidenceCapture(currentNFCSubtask);
      
      console.log('✅ NFC evidence captured and subtask completed');
    } catch (error) {
      console.error('❌ Error completing NFC evidence:', error);
      Alert.alert('Error', 'No se pudo completar la evidencia NFC. Inténtalo de nuevo.');
    } finally {
      // Limpiar la subtarea actual
      setCurrentNFCSubtask(null);
    }
  };

  const handleNFCDismiss = () => {
    setShowNFCDialog(false);
    setCurrentNFCSubtask(null);
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
    console.log('🎵 handleAudioSuccess called with:', {
      hasCurrentAudioSubtask: !!currentAudioSubtask,
      hasTask: !!task,
      audioData: audioData ? 'Present' : 'Missing',
      audioUri: audioData?.uri ? 'Present' : 'Missing'
    });
    
    if (!currentAudioSubtask || !task) {
      console.error('❌ Missing required data in handleAudioSuccess');
      return;
    }
    
    // Cerrar el diálogo de audio
    setShowAudioDialog(false);
    
    try {
      console.log('🔄 Starting audio evidence capture process...');
      
      // Capturar la evidencia de audio real y marcar como completada
      await captureRealAudioEvidence(currentAudioSubtask, audioData);
      
      console.log('✅ Real audio evidence captured and subtask completed');
    } catch (error) {
      console.error('❌ Error completing audio evidence:', error);
      
      // Determinar el tipo de error y dar mensaje específico
      let errorMessage = 'No se pudo completar la evidencia de audio.';
      
      if (error instanceof Error) {
        if (error.message.includes('storage') || error.message.includes('upload')) {
          errorMessage = 'Error al guardar el archivo de audio. Se guardará localmente.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Error de permisos. Verifica los permisos de la aplicación.';
        } else {
          errorMessage += ` (${error.message})`;
        }
      }
      
      Alert.alert(
        'Error de Audio',
        errorMessage + '\n\nInténtalo de nuevo.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Reintentar', onPress: () => {
            // Reintentar con los mismos datos
            if (realAudioData) {
              setTimeout(() => captureRealAudioEvidence(subtask, realAudioData), 500);
            }
          }}
        ]
      );
    } finally {
      // Limpiar la subtarea actual
      setCurrentAudioSubtask(null);
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

  const captureRealAudioEvidence = async (subtask: TaskSubtask, realAudioData: any) => {
    if (!task || !subtask.evidenceRequirement || !realAudioData) return;
    
    try {
      console.log('🎵 Procesando evidencia de audio real...');
      
      let audioData: any;
      let audioFilePath: string | undefined;

      // Intentar subir a Supabase Storage, con fallback a URI local
      try {
        const fileName = `audio_evidence_${subtask.id}_${Date.now()}.m4a`;
        console.log('📤 Intentando subir archivo de audio:', fileName);
        
        const { publicUrl, filePath } = await supabaseService.uploadAudioFile(
          realAudioData.uri, 
          fileName
        );
        
        console.log('✅ Audio subido exitosamente a Supabase Storage:', publicUrl);

        // Usar datos con URL persistente de Supabase
        audioData = {
          uri: publicUrl, // URI público de Supabase Storage
          localUri: realAudioData.uri, // URI local original (para referencia)
          filePath: filePath, // Path en Supabase Storage
          duration: realAudioData.duration,
          timestamp: realAudioData.timestamp,
          format: realAudioData.format,
          quality: realAudioData.quality,
          source: realAudioData.source,
          capturedAt: new Date().toISOString(),
          deviceInfo: {
            platform: 'mobile',
            source: 'Micrófono real del dispositivo',
            storage: 'Supabase Storage',
            persistent: true
          }
        };
        audioFilePath = filePath;

      } catch (storageError) {
        console.warn('⚠️ Error subiendo a Supabase Storage, usando URI local:', storageError);
        
        // Fallback: usar URI local (funcional pero no persistente tras refresh)
        audioData = {
          uri: realAudioData.uri, // URI local del dispositivo
          duration: realAudioData.duration,
          timestamp: realAudioData.timestamp,
          format: realAudioData.format,
          quality: realAudioData.quality,
          source: realAudioData.source,
          capturedAt: new Date().toISOString(),
          deviceInfo: {
            platform: 'mobile',
            source: 'Micrófono real del dispositivo',
            storage: 'Local (temporal)',
            persistent: false,
            note: 'Audio se perderá al refrescar - configurar Supabase Storage'
          }
        };
        audioFilePath = undefined;
      }

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
        audioFilePath, // filePath de Supabase Storage o undefined si falló
        audioData // data
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
              description: `Audio grabado: ${Math.floor(audioData.duration / 60)}:${(audioData.duration % 60).toString().padStart(2, '0')} de duración`,
              createdAt: new Date(),
              completedBy: 'Usuario Actual',
              data: audioData,
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

      console.log('✅ Real audio evidence saved successfully to database');
      console.log(`🎤 Audio details: ${Math.floor(audioData.duration / 60)}:${(audioData.duration % 60).toString().padStart(2, '0')} duration, ${audioData.quality} quality`);
    } catch (error) {
      console.error('❌ Error saving real audio evidence:', error);
      Alert.alert('Error', 'No se pudo guardar la evidencia de audio real. Inténtalo de nuevo.');
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
    
    // REGLA CRÍTICA: Si hay evidencia, el check DEBE estar marcado
    if (subtask.evidence) return 'checked';
    
    // Si requiere evidencia obligatoria y no la tiene, bloqueado (se mostrará candado)
    if (subtask.evidenceRequirement?.isRequired && !subtask.evidence) {
      return 'unchecked'; // Mantener unchecked pero se mostrará candado
    }
    
    // En cualquier otro caso, normal
    return 'unchecked';
  };

  const isSubtaskBlocked = (subtask: TaskSubtask) => {
    // Bloqueado solo si: evidencia requerida + no hay evidencia + no está completada
    return subtask.evidenceRequirement?.isRequired && !subtask.evidence && !subtask.isCompleted;
  };

  const addTextComment = async () => {
    console.log('🔄 addTextComment called');
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.colors.error;
      case 'high': return theme.colors.secondary;
      case 'medium': return theme.colors.primary;
      case 'low': return theme.colors.outline;
      default: return theme.colors.outline;
    }
  };

  const getSeverityLabel = (severity: string) => {
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
                        disabled={
                          (subtask.evidenceRequirement.type === EvidenceType.SIGNATURE && 
                           (!subtask.evidence.data || 
                            typeof subtask.evidence.data !== 'string' || 
                            subtask.evidence.data.trim() === '')) ||
                          (subtask.evidenceRequirement.type !== EvidenceType.SIGNATURE && 
                           subtask.evidenceRequirement.type !== EvidenceType.LOCATION &&
                           subtask.evidenceRequirement.type !== EvidenceType.AUDIO)
                        }
                        onPress={
                          subtask.evidenceRequirement.type === EvidenceType.SIGNATURE 
                            ? () => handleViewSignature(subtask)
                            : subtask.evidenceRequirement.type === EvidenceType.LOCATION
                            ? () => handleViewLocation(subtask)
                            : subtask.evidenceRequirement.type === EvidenceType.AUDIO
                            ? () => handleViewAudio(subtask)
                            : undefined
                        }
                        style={styles.evidenceCompletedButton}
                        labelStyle={styles.evidenceCompletedButtonText}
                      >
                        {subtask.evidenceRequirement.type === EvidenceType.SIGNATURE 
                          ? 'Ver Firma' 
                          : subtask.evidenceRequirement.type === EvidenceType.LOCATION
                          ? 'Ver Ubicación'
                          : subtask.evidenceRequirement.type === EvidenceType.AUDIO
                          ? 'Ver Audio'
                          : 'Evidencia completada'}
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
                    <View style={styles.commentHeaderLeft}>
                      <Text variant="bodySmall" style={styles.commentAuthor}>
                        {comment.author}
                      </Text>
                      <Text variant="bodySmall" style={styles.commentDate}>
                        {comment.createdAt.toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                    {isCommentAuthor(comment) && (
                      <IconButton
                        icon="delete"
                        size={18}
                        iconColor={theme.colors.error}
                        onPress={() => deleteComment(comment.id, comment.content)}
                        style={styles.deleteButton}
                      />
                    )}
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
            
            <View style={styles.commentInputContainer}>
              <TextInput
                mode="outlined"
                placeholder="Escribe un comentario..."
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={addTextComment}
                returnKeyType="send"
                style={styles.commentInput}
                dense
              />
              <IconButton
                icon="send"
                mode="contained"
                onPress={addTextComment}
                disabled={commentText.trim() === ''}
                style={styles.sendButton}
                size={20}
              />
              <IconButton
                icon="microphone"
                mode="contained"
                onPress={addVoiceComment}
                style={styles.microphoneButton}
                size={20}
              />
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
                  <View style={styles.problemHeader}>
                    <View style={styles.problemHeaderLeft}>
                      <Icon
                        source={getReportTypeIcon(problem.reportType)}
                        size={20}
                        color={getSeverityColor(problem.severity)}
                      />
                      <Text variant="titleMedium" style={styles.problemTitle}>
                        {problem.title}
                      </Text>
                    </View>
                    <Chip 
                      mode="outlined" 
                      style={[styles.severityChip, { 
                        borderColor: getSeverityColor(problem.severity)
                      }]}
                      textStyle={[styles.severityChipText, {
                        color: getSeverityColor(problem.severity)
                      }]}
                      compact
                    >
                      {getSeverityLabel(problem.severity)}
                    </Chip>
                  </View>
                  
                  <Text variant="bodyMedium" style={styles.problemDescription}>
                    {problem.description}
                  </Text>
                  
                  <View style={styles.problemFooter}>
                    <Text variant="bodySmall" style={styles.problemMeta}>
                      Reportado por {problem.author} • {problem.reportedAt.toLocaleDateString('es-ES')}
                    </Text>
                    
                    {problem.resolvedAt && (
                      <View style={styles.resolvedContainer}>
                        <Icon
                          source="check-circle"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text variant="bodySmall" style={styles.resolvedText}>
                          Resuelto el {problem.resolvedAt.toLocaleDateString('es-ES')}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {problem.resolution && (
                    <View style={styles.resolutionContainer}>
                      <Text variant="bodySmall" style={styles.resolutionLabel}>
                        Resolución:
                      </Text>
                      <Text variant="bodySmall" style={styles.resolutionText}>
                        {problem.resolution}
                      </Text>
                    </View>
                  )}
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
              disabled={isSubmittingReport}
            >
              Reportar Problema
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Problem Report Dialog */}
      <ProblemReportDialog
        visible={showProblemDialog}
        onDismiss={() => setShowProblemDialog(false)}
        onSubmit={handleSubmitProblemReport}
        isSubmitting={isSubmittingReport}
      />

      {/* NFC Dialog */}
      <NFCDialog
        visible={showNFCDialog}
        onDismiss={handleNFCDismiss}
        onSuccess={handleNFCSuccess}
        title={currentNFCSubtask?.evidenceRequirement?.title || 'Escanear NFC'}
        description={currentNFCSubtask?.evidenceRequirement?.description || 'Acerca tu dispositivo al tag NFC para registrar la evidencia'}
      />

      {/* Signature Dialog */}
      <SignatureDialog
        visible={showSignatureDialog}
        onDismiss={handleSignatureDismiss}
        onSuccess={handleSignatureSuccess}
        title={currentSignatureSubtask?.evidenceRequirement?.title || 'Firma Digital'}
        description={currentSignatureSubtask?.evidenceRequirement?.description || 'Dibuja tu firma en el cuadro de abajo'}
      />

      {/* Signature Viewer */}
      <SignatureViewer
        visible={showSignatureViewer}
        onDismiss={handleSignatureViewerDismiss}
        signatureData={currentSignatureData}
        title="Firma Digital Capturada"
      />

      {/* Location Dialog */}
      <LocationDialog
        visible={showLocationDialog}
        onDismiss={handleLocationDismiss}
        onSuccess={handleLocationSuccess}
        title={currentLocationSubtask?.evidenceRequirement?.title || 'Obtener Ubicación'}
        description={currentLocationSubtask?.evidenceRequirement?.description || 'Obteniendo tu ubicación actual mediante GPS'}
      />

      {/* Location Viewer */}
      <LocationViewer
        visible={showLocationViewer}
        onDismiss={handleLocationViewerDismiss}
        locationData={currentLocationData}
        title="Ubicación Registrada"
      />

      {/* Audio Dialog */}
      <AudioDialog
        visible={showAudioDialog}
        onDismiss={handleAudioDismiss}
        onSuccess={handleAudioSuccess}
        title={currentAudioSubtask?.evidenceRequirement?.title || 'Grabar Audio'}
        description={currentAudioSubtask?.evidenceRequirement?.description || 'Presiona grabar para capturar evidencia de audio'}
      />

      {/* Audio Viewer */}
      <AudioViewer
        visible={showAudioViewer}
        onDismiss={handleAudioViewerDismiss}
        audioData={currentAudioData}
        title="Audio Registrado"
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
    backgroundColor: 'rgba(255,0,0,0.05)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(255,0,0,0.3)',
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  problemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  problemTitle: {
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
  problemDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  problemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  problemMeta: {
    opacity: 0.7,
    flex: 1,
  },
  resolvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resolvedText: {
    marginLeft: 4,
    color: '#4CAF50',
    fontWeight: '500',
  },
  resolutionContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  resolutionLabel: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#4CAF50',
  },
  resolutionText: {
    lineHeight: 18,
  },
  severityChip: {
    alignSelf: 'flex-start',
  },
  severityChipText: {
    fontSize: 10,
    fontWeight: '600',
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
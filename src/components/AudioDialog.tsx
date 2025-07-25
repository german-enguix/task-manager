import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { View, StyleSheet, Animated, Easing, Alert } from 'react-native';
import { audioService } from '../services/audioService';

interface AudioDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: (audioData: any) => void;
  title?: string;
  description?: string;
}

export const AudioDialog: React.FC<AudioDialogProps> = ({
  visible,
  onDismiss,
  onSuccess,
  title = 'Grabar Audio',
  description = 'Presiona grabar para capturar evidencia de audio'
}) => {
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [micAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      resetState();
      initializeAudio();
    } else {
      cleanup();
    }
  }, [visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(async () => {
        const status = await audioService.getRecordingStatus();
        if (status) {
          setRecordingDuration(status.durationSeconds);
        }
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const resetState = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setIsAudioReady(false);
    setRecordingDuration(0);
    setCurrentStatus('');
    stopAnimations();
  };

  const cleanup = async () => {
    if (audioService.isCurrentlyRecording) {
      await audioService.cancelRecording();
    }
    resetState();
  };

  const initializeAudio = async () => {
    try {
      setCurrentStatus('Verificando permisos...');
      
      const hasPermissions = await audioService.requestPermissions();
      
      if (!hasPermissions) {
        setCurrentStatus('Permisos denegados');
        Alert.alert(
          'Permisos Necesarios',
          'Necesitamos acceso al micrófono para grabar evidencia de audio. Por favor, otorga los permisos en la configuración.',
          [{ text: 'OK', onPress: handleCancel }]
        );
        return;
      }

      setCurrentStatus('Listo para grabar');
    } catch (error) {
      console.error('Error initializing audio:', error);
      setCurrentStatus('Error de inicialización');
      Alert.alert(
        'Error',
        'No se pudo inicializar el sistema de audio. Inténtalo de nuevo.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: handleCancel },
          { text: 'Reintentar', onPress: initializeAudio }
        ]
      );
    }
  };

  const startRecording = async () => {
    try {
      setCurrentStatus('Iniciando grabación...');
      setIsRecording(true);
      setRecordingDuration(0);
      startAnimations();

      await audioService.startRecording({
        quality: 'high',
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000
      });
      
      setCurrentStatus('Grabando...');
      console.log('🎤 Grabación iniciada');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      stopAnimations();
      
      let errorMessage = 'No se pudo iniciar la grabación.';
      if (error instanceof Error) {
        if (error.message.includes('Permisos')) {
          errorMessage = 'Permisos de audio denegados. Verifica la configuración.';
        } else if (error.message.includes('en progreso')) {
          errorMessage = 'Ya hay una grabación en progreso.';
        }
      }
      
      Alert.alert('Error de Grabación', errorMessage, [{ text: 'OK' }]);
    }
  };

  const stopRecording = async () => {
    if (!audioService.isCurrentlyRecording) return;

    try {
      setCurrentStatus('Finalizando y subiendo...');
      setIsRecording(false);
      setIsProcessing(true);
      stopAnimations();

      // Detener grabación y subir a Supabase Storage
      const audioData = await audioService.stopRecording();
      
      setIsAudioReady(true);
      setIsProcessing(false);
      setCurrentStatus('Audio grabado y guardado');
      
      console.log('✅ Audio procesado exitosamente');
      
      // Pasar los datos del audio al componente padre
      setTimeout(() => {
        onSuccess(audioData);
        resetState();
      }, 500);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
      
      let errorMessage = 'No se pudo finalizar la grabación.';
      if (error instanceof Error) {
        if (error.message.includes('Storage') || error.message.includes('upload')) {
          errorMessage = 'Error subiendo el audio. Verifica tu conexión a internet.';
        } else if (error.message.includes('No hay grabación')) {
          errorMessage = 'No hay grabación activa para detener.';
        }
      }
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    }
  };

  const startAnimations = () => {
    // Animación de pulso para el micrófono
    const pulseAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Animación de escala para el ícono del micrófono
    const micAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(micAnimation, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(micAnimation, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimationLoop.start();
    micAnimationLoop.start();
  };

  const stopAnimations = () => {
    pulseAnimation.stopAnimation();
    micAnimation.stopAnimation();
    pulseAnimation.setValue(1);
    micAnimation.setValue(1);
  };

  const handleCancel = async () => {
    await cleanup();
    onDismiss();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isAudioReady) return '#4CAF50';
    if (isRecording) return '#FF5722';
    if (isProcessing) return '#2196F3';
    return theme.colors.primary;
  };

  const getStatusIcon = () => {
    if (isAudioReady) return '✓';
    if (isRecording) return '🎤';
    if (isProcessing) return '📤';
    return '🎤';
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={!isRecording && !isProcessing ? handleCancel : undefined} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        
        <Dialog.Content>
          <View style={styles.content}>
            {/* Área de animación */}
            <View style={styles.animationContainer}>
              {/* Círculos de pulso de fondo */}
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle1,
                  {
                    transform: [{ scale: isRecording ? pulseAnimation : 1 }],
                    backgroundColor: getStatusColor() + '20',
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle2,
                  {
                    transform: [{ scale: isRecording ? pulseAnimation : 1 }],
                    backgroundColor: getStatusColor() + '15',
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle3,
                  {
                    transform: [{ scale: isRecording ? pulseAnimation : 1 }],
                    backgroundColor: getStatusColor() + '10',
                  }
                ]}
              />
              
              {/* Ícono del micrófono central */}
              <Animated.View
                style={[
                  styles.micContainer,
                  {
                    backgroundColor: getStatusColor(),
                    transform: [{ scale: isRecording ? micAnimation : 1 }],
                  }
                ]}
              >
                <Text style={styles.micIcon}>
                  {getStatusIcon()}
                </Text>
              </Animated.View>
            </View>

            {/* Texto descriptivo */}
            <Text variant="bodyMedium" style={styles.description}>
              {isAudioReady ? '¡Audio guardado en Supabase!' : 
               isProcessing ? 'Subiendo audio...' : 
               description}
            </Text>

            {/* Información de grabación */}
            {(isRecording || isProcessing || isAudioReady) && (
              <View style={styles.recordingInfo}>
                <Text variant="titleSmall" style={styles.durationText}>
                  ⏱️ {formatDuration(recordingDuration)}
                </Text>
                {isAudioReady && (
                  <Text variant="bodySmall" style={styles.qualityText}>
                    ☁️ Guardado en Supabase Storage • Listo para usar
                  </Text>
                )}
                {isProcessing && (
                  <Text variant="bodySmall" style={styles.qualityText}>
                    📤 Subiendo a Supabase Storage...
                  </Text>
                )}
              </View>
            )}

            {/* Indicador de estado */}
            <View style={styles.statusContainer}>
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text variant="bodySmall" style={[styles.statusText, { color: '#2196F3' }]}>
                    {currentStatus}
                  </Text>
                </>
              ) : isAudioReady ? (
                <Text variant="bodySmall" style={[styles.statusText, { color: '#4CAF50', fontWeight: 'bold' }]}>
                  ✅ {currentStatus}
                </Text>
              ) : isRecording ? (
                <>
                  <ActivityIndicator size="small" color="#FF5722" />
                  <Text variant="bodySmall" style={[styles.statusText, { color: '#FF5722' }]}>
                    {currentStatus}
                  </Text>
                </>
              ) : (
                <Text variant="bodySmall" style={[styles.statusText, { color: theme.colors.primary }]}>
                  {currentStatus || 'Preparando...'}
                </Text>
              )}
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button 
            onPress={handleCancel} 
            disabled={isRecording || isProcessing}
            style={isRecording || isProcessing ? styles.disabledButton : undefined}
          >
            Cancelar
          </Button>
          
          {isRecording ? (
            <Button 
              mode="contained" 
              onPress={stopRecording}
              style={styles.stopButton}
              buttonColor="#FF5722"
            >
              Detener
            </Button>
          ) : !isAudioReady && !isProcessing ? (
            <Button 
              mode="contained" 
              onPress={startRecording}
              style={styles.recordButton}
              buttonColor="#FF5722"
              disabled={!currentStatus.includes('Listo')}
            >
              {currentStatus.includes('Listo') ? 'Grabar' : 'Preparando...'}
            </Button>
          ) : null}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  title: {
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  animationContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  pulseCircle1: {
    width: 120,
    height: 120,
  },
  pulseCircle2: {
    width: 140,
    height: 140,
  },
  pulseCircle3: {
    width: 160,
    height: 160,
  },
  micContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  micIcon: {
    fontSize: 32,
    color: 'white',
  },
  description: {
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  recordingInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    minWidth: '60%',
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  qualityText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.8,
  },
  recordButton: {
    minWidth: 100,
  },
  stopButton: {
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.6,
  },
}); 
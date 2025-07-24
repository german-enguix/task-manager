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
import { Audio } from 'expo-av';

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
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [micAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      resetState();
      requestAudioPermissions();
    } else {
      resetState();
    }
  }, [visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording && recording) {
      interval = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          setRecordingDuration(Math.floor(status.durationMillis / 1000));
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recording]);

  const resetState = () => {
    setIsRecording(false);
    setIsAudioReady(false);
    setButtonEnabled(false);
    setRecording(null);
    setAudioUri('');
    setRecordingDuration(0);
    setCurrentStatus('');
    stopAnimations();
  };

  const requestAudioPermissions = async () => {
    try {
      setCurrentStatus('Solicitando permisos...');
      
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        setCurrentStatus('Permisos denegados');
        Alert.alert(
          'Permisos Necesarios',
          'Necesitamos acceso al micrófono para grabar evidencia de audio. Por favor, otorga los permisos en la configuración.',
          [{ text: 'OK', onPress: handleCancel }]
        );
        return;
      }

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setCurrentStatus('Lista para grabar');
      setButtonEnabled(true);
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      setCurrentStatus('Error de permisos');
      Alert.alert(
        'Error de Permisos',
        'No se pudieron obtener los permisos de audio. Inténtalo de nuevo.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: handleCancel },
          { text: 'Reintentar', onPress: requestAudioPermissions }
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

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setCurrentStatus('Grabando...');
      console.log('🎤 Grabación iniciada');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      stopAnimations();
      Alert.alert(
        'Error de Grabación',
        'No se pudo iniciar la grabación. Verifica que el micrófono esté disponible.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setCurrentStatus('Finalizando grabación...');
      setIsRecording(false);
      stopAnimations();

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setAudioUri(uri);
        setIsAudioReady(true);
        setCurrentStatus('Audio grabado correctamente');
        console.log('✅ Grabación completada:', uri);
      } else {
        throw new Error('No se pudo obtener el URI del audio');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert(
        'Error',
        'No se pudo finalizar la grabación correctamente. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
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

  const handleCompletarEvidencia = () => {
    if (audioUri && isAudioReady) {
      const audioData = {
        uri: audioUri,
        duration: recordingDuration,
        timestamp: new Date().toISOString(),
        format: 'caf', // Core Audio Format (iOS) o webm (Android)
        quality: 'high',
        source: 'device_microphone'
      };
      
      onSuccess(audioData);
      resetState();
    }
  };

  const handleCancel = () => {
    resetState();
    onDismiss();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
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
                    backgroundColor: isAudioReady ? '#4CAF50' + '20' : theme.colors.primary + '20',
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle2,
                  {
                    transform: [{ scale: isRecording ? pulseAnimation : 1 }],
                    backgroundColor: isAudioReady ? '#4CAF50' + '15' : theme.colors.primary + '15',
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle3,
                  {
                    transform: [{ scale: isRecording ? pulseAnimation : 1 }],
                    backgroundColor: isAudioReady ? '#4CAF50' + '10' : theme.colors.primary + '10',
                  }
                ]}
              />
              
              {/* Ícono del micrófono central */}
              <Animated.View
                style={[
                  styles.micContainer,
                  {
                    backgroundColor: isAudioReady ? '#4CAF50' : theme.colors.primary,
                    transform: [{ scale: isRecording ? micAnimation : 1 }],
                  }
                ]}
              >
                <Text style={styles.micIcon}>
                  {isAudioReady ? '✓' : isRecording ? '🎤' : '🎤'}
                </Text>
              </Animated.View>
            </View>

            {/* Texto descriptivo */}
            <Text variant="bodyMedium" style={styles.description}>
              {isAudioReady ? '¡Audio grabado!' : description}
            </Text>

            {/* Información de grabación */}
            {(isRecording || isAudioReady) && (
              <View style={styles.recordingInfo}>
                <Text variant="titleSmall" style={styles.durationText}>
                  ⏱️ {formatDuration(recordingDuration)}
                </Text>
                {isAudioReady && (
                  <Text variant="bodySmall" style={styles.qualityText}>
                    🎵 Calidad alta • Listo para enviar
                  </Text>
                )}
              </View>
            )}

            {/* Indicador de estado */}
            <View style={styles.statusContainer}>
              {isAudioReady ? (
                <Text variant="bodySmall" style={[styles.statusText, { color: '#4CAF50', fontWeight: 'bold' }]}>
                  ✅ Audio grabado - Listo para completar evidencia
                </Text>
              ) : isRecording ? (
                <>
                  <ActivityIndicator size="small" color="#FF5722" />
                  <Text variant="bodySmall" style={[styles.statusText, { color: '#FF5722' }]}>
                    {currentStatus}
                  </Text>
                </>
              ) : buttonEnabled ? (
                <Text variant="bodySmall" style={[styles.statusText, { color: theme.colors.primary }]}>
                  {currentStatus}
                </Text>
              ) : (
                <Text variant="bodySmall" style={styles.statusText}>
                  {currentStatus || 'Preparando grabación...'}
                </Text>
              )}
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={isRecording}>
            Cancelar
          </Button>
          
          {isAudioReady ? (
            <Button 
              mode="contained" 
              onPress={handleCompletarEvidencia}
              style={styles.completeButton}
            >
              Completar Evidencia
            </Button>
          ) : isRecording ? (
            <Button 
              mode="contained" 
              onPress={stopRecording}
              style={[styles.stopButton]}
              buttonColor="#FF5722"
            >
              Detener
            </Button>
          ) : (
            <Button 
              mode="contained" 
              onPress={startRecording}
              style={[styles.recordButton, !buttonEnabled && styles.disabledButton]}
              disabled={!buttonEnabled}
              buttonColor="#FF5722"
            >
              {buttonEnabled ? 'Grabar' : 'Preparando...'}
            </Button>
          )}
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
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.7,
  },
  recordButton: {
    minWidth: 100,
  },
  stopButton: {
    minWidth: 100,
  },
  completeButton: {
    minWidth: 120,
  },
  disabledButton: {
    opacity: 0.6,
  },
}); 
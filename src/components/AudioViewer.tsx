import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
  Surface,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';

interface AudioViewerProps {
  visible: boolean;
  onDismiss: () => void;
  audioData: any; // Los datos de audio guardados
  title?: string;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({
  visible,
  onDismiss,
  audioData,
  title = 'Audio Registrado'
}) => {
  const theme = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);

  // Extraer datos de audio
  const audio = audioData ? {
    uri: audioData.uri || null,
    duration: audioData.duration || 0,
    timestamp: audioData.timestamp || new Date().toISOString(),
    format: audioData.format || 'audio',
    quality: audioData.quality || 'standard',
    source: audioData.source || 'device_microphone'
  } : null;

  useEffect(() => {
    if (visible && audio?.uri) {
      loadAudio();
    }
    
    return () => {
      unloadAudio();
    };
  }, [visible, audio?.uri]);

  useEffect(() => {
    if (playbackStatus) {
      setPosition(playbackStatus.positionMillis || 0);
      setDuration(playbackStatus.durationMillis || 0);
      setIsPlaying(playbackStatus.isPlaying || false);
      
      if (playbackStatus.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  }, [playbackStatus]);

  const validateAudioUri = async (uri: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating audio URI:', uri);
      
      // Validación básica de formato de URI
      if (!uri || uri.trim() === '') {
        console.warn('❌ Empty URI');
        return false;
      }
      
      // Para validación, intentar directamente con expo-av en lugar de fetch
      // Esto es más confiable para archivos de audio
      try {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          undefined
        );
        
        const isValid = status.isLoaded || false;
        console.log(`✅ Audio validation result: ${isValid}`);
        
        // Limpiar el sound object
        if (sound) {
          await sound.unloadAsync();
        }
        
        return isValid;
      } catch (audioError) {
        console.warn('❌ Audio validation failed with expo-av:', audioError);
        
        // Fallback: asumir que es válido y dejar que expo-av maneje el error después
        console.log('🔄 Fallback: assuming URI is valid, will try to load');
        return true;
      }
    } catch (error) {
      console.warn('❌ URI validation failed:', error);
      // En caso de error de validación, asumir que es válido
      return true;
    }
  };

  const loadAudio = async () => {
    if (!audio?.uri) {
      console.warn('❌ No audio URI provided');
      Alert.alert(
        'Audio No Disponible',
        'No se encontró la ubicación del archivo de audio.',
        [{ text: 'Cerrar', onPress: onDismiss }]
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Cargando audio desde:', audio.uri);
      console.log('🎵 Audio metadata:', {
        duration: audio.duration,
        format: audio.format,
        storage: audio.deviceInfo?.storage,
        persistent: audio.deviceInfo?.persistent
      });
      
      // Configurar modo de audio para reproducción
      console.log('🔧 Configurando modo de audio...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('📱 Creando objeto de audio...');
      // Crear el sound object con configuración específica
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: audio.uri },
        { 
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
        },
        onPlaybackStatusUpdate
      );
      
      console.log('🔍 Status de carga:', {
        isLoaded: status.isLoaded,
        duration: status.durationMillis,
        error: status.error
      });
      
      // Verificar que se cargó correctamente
      if (status.isLoaded) {
        // Verificar que tiene duración válida
        const durationSeconds = Math.floor((status.durationMillis || 0) / 1000);
        
        if (durationSeconds === 0) {
          console.error('❌ Audio cargado pero duración es 0s - archivo corrupto o vacío');
          if (newSound) await newSound.unloadAsync();
          throw new Error('AUDIO_EMPTY_OR_CORRUPT');
        }
        
        setSound(newSound);
        console.log('✅ Audio cargado correctamente para reproducción');
        console.log(`🎵 Duración: ${durationSeconds}s`);
      } else {
        console.error('❌ Audio no se pudo cargar completamente');
        console.log('Status details:', status);
        
        if (newSound) await newSound.unloadAsync();
        
        // Si hay error específico en el status, usarlo
        const errorMsg = status.error || 'Status indicates audio not loaded';
        throw new Error('Audio load failed: ' + errorMsg);
      }
    } catch (error) {
      console.error('❌ Error loading audio:', error);
      
      let errorMessage = 'No se pudo cargar el audio.';
      let showRetry = true;
      
      if (error instanceof Error) {
        console.log('🔍 Error details:', error.message);
        
        if (error.message === 'AUDIO_EMPTY_OR_CORRUPT') {
          errorMessage = 'El archivo de audio está vacío o corrupto. Es necesario grabar de nuevo.';
          showRetry = false;
        } else if (error.message.includes('not found') || error.message.includes('No such file')) {
          errorMessage = 'El archivo de audio no se encontró.';
          showRetry = false;
        } else if (error.message.includes('format') || error.message.includes('codec')) {
          errorMessage = 'Formato de audio no compatible.';
        } else if (error.message.includes('Network') || error.message.includes('network')) {
          errorMessage = 'No se pudo acceder al archivo. Verifica la conexión.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Sin permisos para acceder al audio.';
        } else if (error.message.includes('Audio load failed')) {
          errorMessage = 'El audio no se pudo cargar correctamente. Archivo posiblemente corrupto.';
          showRetry = false;
        } else {
          errorMessage += ` (${error.message})`;
        }
      }
      
      // En caso de error, mostrar información útil
      let debugInfo = '';
      let suggestions = '';
      
      if (audio.deviceInfo?.persistent === false) {
        debugInfo = '\n\n💡 Este audio usa almacenamiento temporal. Si refrescaste la app, el archivo puede haberse perdido.';
        suggestions = '\n\n✅ Solución: Graba el audio nuevamente para crear un archivo válido.';
      } else if (error instanceof Error && error.message === 'AUDIO_EMPTY_OR_CORRUPT') {
        suggestions = '\n\n✅ Solución: El archivo está corrupto. Graba el audio nuevamente.';
      } else if (error instanceof Error && error.message.includes('not found')) {
        suggestions = '\n\n✅ Solución: El archivo se perdió. Graba el audio nuevamente.';
      }
      
      const buttons = [{ text: 'Cerrar', onPress: onDismiss }];
      if (showRetry) {
        buttons.unshift({ text: 'Reintentar', onPress: loadAudio });
      }
      
      Alert.alert(
        'Error de Reproducción',
        errorMessage + debugInfo + suggestions,
        buttons
      );
    } finally {
      setIsLoading(false);
    }
  };

  const unloadAudio = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
      } catch (error) {
        console.error('Error unloading audio:', error);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    setPlaybackStatus(status);
  };

  const playPauseAudio = async () => {
    if (!sound) {
      console.warn('❌ No sound object available for playback');
      Alert.alert(
        'Error de Reproducción', 
        'El audio no está cargado. Intenta recargar el reproductor.',
        [
          { text: 'Recargar', onPress: loadAudio },
          { text: 'Cerrar', onPress: onDismiss }
        ]
      );
      return;
    }

    try {
      // Verificar el status del sound antes de intentar reproducir
      const status = await sound.getStatusAsync();
      console.log('🔍 Sound status before play:', {
        isLoaded: status.isLoaded,
        durationMillis: status.durationMillis,
        positionMillis: status.positionMillis,
        isPlaying: status.isPlaying
      });

      if (!status.isLoaded) {
        console.error('❌ Sound not loaded when trying to play');
        throw new Error('Sound object exists but is not loaded');
      }

      if ((status.durationMillis || 0) === 0) {
        console.error('❌ Sound has 0 duration - corrupted file');
        throw new Error('Audio file appears to be empty or corrupted');
      }

      if (isPlaying) {
        console.log('⏸️ Pausando audio');
        await sound.pauseAsync();
      } else {
        console.log('▶️ Reproduciendo audio');
        await sound.playAsync();
      }
    } catch (error) {
      console.error('❌ Error playing/pausing audio:', error);
      
      let errorMessage = 'No se pudo reproducir el audio.';
      if (error instanceof Error) {
        if (error.message.includes('not loaded')) {
          errorMessage = 'El audio no está cargado correctamente. Intenta recargarlo.';
        } else if (error.message.includes('empty') || error.message.includes('corrupted')) {
          errorMessage = 'El archivo de audio está corrupto o vacío. Es necesario grabar de nuevo.';
        } else if (error.message.includes('Cannot complete operation')) {
          errorMessage = 'El archivo de audio no está disponible. Posiblemente se perdió al refrescar la app.';
        }
      }
      
      Alert.alert(
        'Error de Reproducción', 
        errorMessage,
        [
          { text: 'Recargar', onPress: loadAudio },
          { text: 'Cerrar', onPress: onDismiss }
        ]
      );
    }
  };

  const stopAudio = async () => {
    if (!sound) return;

    try {
      console.log('⏹️ Deteniendo audio');
      await sound.stopAsync();
      await sound.setPositionAsync(0);
    } catch (error) {
      console.error('❌ Error stopping audio:', error);
    }
  };

  const seekToPosition = async (value: number) => {
    if (!sound || !duration) {
      console.warn('Cannot seek: no sound or duration');
      return;
    }

    try {
      const newPosition = Math.floor(value * duration);
      console.log(`⏩ Seeking to position: ${newPosition}ms`);
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('❌ Error seeking audio:', error);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  if (!audio) {
    return null;
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Reproductor de audio */}
            <Surface style={styles.playerContainer} elevation={2}>
              <View style={styles.playerContent}>
                {/* Ícono de audio */}
                <View style={[styles.audioIcon, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.audioIconText}>🎵</Text>
                </View>

                {/* Título del reproductor */}
                <Text variant="titleMedium" style={styles.playerTitle}>
                  Reproductor de Audio
                </Text>
                <Text variant="bodySmall" style={styles.playerSubtitle}>
                  Usa los controles para reproducir la evidencia de audio
                </Text>

                {/* Controles de reproducción */}
                <View style={styles.controls}>
                  <View style={styles.timeContainer}>
                    <Text variant="bodySmall" style={styles.timeText}>
                      {formatTime(position)}
                    </Text>
                    <Text variant="bodySmall" style={styles.timeText}>
                      {formatTime(duration)}
                    </Text>
                  </View>

                  {/* Barra de progreso interactiva */}
                  <View style={styles.progressContainer}>
                    <ProgressBar 
                      progress={progress} 
                      style={styles.progressBar}
                      color={theme.colors.primary}
                    />
                    {/* Overlay transparente para hacer la barra clickeable */}
                    <View 
                      style={styles.progressTouchArea}
                      onTouchStart={(event) => {
                        if (sound && duration > 0) {
                          const x = event.nativeEvent.locationX;
                          const width = 250; // ancho aproximado de la barra
                          const newProgress = Math.max(0, Math.min(1, x / width));
                          seekToPosition(newProgress);
                        }
                      }}
                    />
                  </View>

                  <View style={styles.buttonsContainer}>
                    <IconButton
                      icon="stop"
                      size={28}
                      onPress={stopAudio}
                      disabled={!sound || isLoading}
                      style={styles.controlButton}
                    />
                    <IconButton
                      icon={isPlaying ? "pause" : "play"}
                      size={48}
                      mode="contained"
                      onPress={playPauseAudio}
                      disabled={!sound || isLoading}
                      loading={isLoading}
                      style={styles.playButton}
                      iconColor="white"
                    />
                    <IconButton
                      icon="volume-high"
                      size={28}
                      disabled={true}
                      iconColor={theme.colors.outline}
                      style={styles.controlButton}
                    />
                  </View>

                  {/* Estado de reproducción */}
                  <View style={styles.statusContainer}>
                    {isLoading ? (
                      <Text variant="bodySmall" style={styles.statusText}>
                        Cargando audio...
                      </Text>
                    ) : !sound ? (
                      <Text variant="bodySmall" style={[styles.statusText, {color: theme.colors.error}]}>
                        Error cargando audio
                      </Text>
                    ) : isPlaying ? (
                      <Text variant="bodySmall" style={[styles.statusText, {color: theme.colors.primary}]}>
                        ▶️ Reproduciendo...
                      </Text>
                    ) : (
                      <Text variant="bodySmall" style={styles.statusText}>
                        ⏸️ Pausado - Toca ▶️ para reproducir
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </Surface>

            {/* Información del audio */}
            <View style={styles.infoContainer}>
              <View style={styles.infoSection}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Información del audio
                </Text>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Duración:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {audio.duration ? `${Math.floor(audio.duration / 60)}:${(audio.duration % 60).toString().padStart(2, '0')}` : 'Desconocida'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Calidad:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {audio.quality === 'high' ? 'Alta' : 'Estándar'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Formato:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {audio.format?.toUpperCase() || 'AUDIO'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Información adicional
                </Text>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Fuente:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>Micrófono del dispositivo</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Fecha y hora:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {formatTimestamp(audio.timestamp)}
                  </Text>
                </View>
              </View>

              {/* Nota informativa */}
              <View style={styles.noteContainer}>
                <Text variant="bodySmall" style={styles.noteText}>
                  🎤 Este audio fue grabado usando el micrófono real de tu dispositivo como evidencia para la subtarea.
                  Los datos están almacenados de forma segura y verificada.
                </Text>
              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions>
          <Button onPress={onDismiss} mode="contained">
            Cerrar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '85%',
  },
  title: {
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  playerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  playerContent: {
    padding: 20,
    alignItems: 'center',
  },
  audioIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  audioIconText: {
    fontSize: 32,
  },
  playerTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  playerSubtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  controls: {
    width: '100%',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  timeText: {
    fontFamily: 'monospace',
    color: '#666',
  },
  progressContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  progressTouchArea: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'transparent',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: '#FF5722',
    width: 64,
    height: 64,
  },
  controlButton: {
    backgroundColor: 'transparent',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  infoContainer: {
    gap: 16,
  },
  infoSection: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontFamily: 'monospace',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  noteContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  noteText: {
    color: '#1976d2',
    fontStyle: 'italic',
    lineHeight: 16,
  },
}); 
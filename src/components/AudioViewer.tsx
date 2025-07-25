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

  // Extraer datos de audio - simplificado para URLs de Supabase
  const audio = audioData ? {
    uri: audioData.uri || audioData.publicUrl || null,
    duration: audioData.duration || 0,
    timestamp: audioData.timestamp || new Date().toISOString(),
    format: audioData.format || 'm4a',
    fileSize: audioData.fileSize || 0,
    sampleRate: audioData.sampleRate || 44100,
    numberOfChannels: audioData.numberOfChannels || 2,
    bitRate: audioData.bitRate || 128000,
  } : null;

  useEffect(() => {
    if (visible && audio?.uri) {
      loadAudio();
    }
    
    return () => {
      unloadAudio();
    };
  }, [visible, audio?.uri]);

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
      console.log('🔄 Cargando audio desde Supabase Storage:', audio.uri);
      
      // Configurar modo de audio para reproducción
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Crear el sound object
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
        durationMillis: status.durationMillis,
        error: status.error
      });
      
      if (status.isLoaded) {
        setSound(newSound);
        setDuration(status.durationMillis || (audio.duration * 1000));
        console.log('✅ Audio cargado correctamente desde Supabase Storage');
      } else {
        console.error('❌ Error cargando audio:', status.error);
        if (newSound) await newSound.unloadAsync();
        throw new Error(status.error || 'No se pudo cargar el audio');
      }
    } catch (error) {
      console.error('❌ Error loading audio:', error);
      
      let errorMessage = 'No se pudo cargar el audio desde Supabase Storage.';
      let suggestions = '';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión al cargar el audio.';
          suggestions = '\n\nVerifica tu conexión a internet e inténtalo de nuevo.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = 'El archivo de audio no se encontró en Supabase Storage.';
          suggestions = '\n\nEl archivo puede haber sido eliminado o movido.';
        } else if (error.message.includes('format') || error.message.includes('codec')) {
          errorMessage = 'Formato de audio no compatible.';
          suggestions = '\n\nIntenta grabar el audio nuevamente.';
        }
      }
      
      Alert.alert(
        'Error de Reproducción',
        errorMessage + suggestions,
        [
          { text: 'Reintentar', onPress: loadAudio },
          { text: 'Cerrar', onPress: onDismiss }
        ]
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
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying || false);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
      
      // Actualizar duración si no la teníamos
      if (status.durationMillis && duration === 0) {
        setDuration(status.durationMillis);
      }
    }
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
      if (isPlaying) {
        console.log('⏸️ Pausando audio');
        await sound.pauseAsync();
      } else {
        console.log('▶️ Reproduciendo audio');
        await sound.playAsync();
      }
    } catch (error) {
      console.error('❌ Error playing/pausing audio:', error);
      
      Alert.alert(
        'Error de Reproducción', 
        'No se pudo reproducir el audio. Intenta recargarlo.',
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Desconocido';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                  Audio desde Supabase Storage
                </Text>
                <Text variant="bodySmall" style={styles.playerSubtitle}>
                  Audio almacenado de forma persistente en la nube
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
                        Cargando desde Supabase Storage...
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
                  Información del archivo
                </Text>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Duración:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {audio.duration ? `${Math.floor(audio.duration / 60)}:${(audio.duration % 60).toString().padStart(2, '0')}` : 'Calculando...'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Formato:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {audio.format?.toUpperCase() || 'M4A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Tamaño:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {formatFileSize(audio.fileSize)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Configuración de audio
                </Text>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Sample Rate:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>{audio.sampleRate} Hz</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Canales:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {audio.numberOfChannels === 2 ? 'Estéreo (2)' : `Mono (${audio.numberOfChannels})`}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Bitrate:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>{audio.bitRate / 1000} kbps</Text>
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
                  <Text variant="bodySmall" style={styles.infoLabel}>Almacenamiento:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>Supabase Storage</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Fecha:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {formatTimestamp(audio.timestamp)}
                  </Text>
                </View>
              </View>

              {/* Nota informativa */}
              <View style={styles.noteContainer}>
                <Text variant="bodySmall" style={styles.noteText}>
                  ☁️ Este audio está almacenado de forma persistente en Supabase Storage. 
                  Estará disponible incluso después de refrescar la aplicación y es accesible 
                  desde cualquier dispositivo con acceso autorizado.
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
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  noteText: {
    color: '#2e7d32',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

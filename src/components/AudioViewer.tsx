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

  const loadAudio = async () => {
    if (!audio?.uri) return;

    try {
      setIsLoading(true);
      
      // Configurar modo de audio para reproducción
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audio.uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      console.log('🎵 Audio cargado para reproducción');
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar el audio. Es posible que el archivo esté corrupto.',
        [{ text: 'OK' }]
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
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio.');
    }
  };

  const stopAudio = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const seekToPosition = async (value: number) => {
    if (!sound || !duration) return;

    try {
      const newPosition = value * duration;
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Error seeking audio:', error);
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

                  <ProgressBar 
                    progress={progress} 
                    style={styles.progressBar}
                    color={theme.colors.primary}
                  />

                  <View style={styles.buttonsContainer}>
                    <IconButton
                      icon="stop"
                      size={24}
                      onPress={stopAudio}
                      disabled={!sound || isLoading}
                    />
                    <IconButton
                      icon={isPlaying ? "pause" : "play"}
                      size={32}
                      mode="contained"
                      onPress={playPauseAudio}
                      disabled={!sound || isLoading}
                      loading={isLoading}
                    />
                    <IconButton
                      icon="volume-high"
                      size={24}
                      disabled={true}
                      iconColor={theme.colors.outline}
                    />
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
  progressBar: {
    width: '100%',
    height: 6,
    marginBottom: 20,
    borderRadius: 3,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
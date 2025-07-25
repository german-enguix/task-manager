import React, { useState, useEffect } from 'react';
import { View, Alert, Dimensions, StyleSheet } from 'react-native';
import { 
  Portal, 
  Dialog, 
  Text, 
  Button, 
  IconButton,
  Surface,
  useTheme,
  ProgressBar
} from 'react-native-paper';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { MediaData } from '../services/cameraService';

interface MediaViewerProps {
  visible: boolean;
  mediaData: MediaData | null;
  onDismiss: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MediaViewer: React.FC<MediaViewerProps> = ({
  visible,
  mediaData,
  onDismiss
}) => {
  const theme = useTheme();
  
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoRef, setVideoRef] = useState<Video | null>(null);

  // Efecto para resetear estado al cambiar media
  useEffect(() => {
    if (visible && mediaData) {
      resetState();
      loadMedia();
    }
  }, [visible, mediaData]);

  // Funciones de estado
  const resetState = () => {
    setIsLoading(false);
    setIsPlaying(false);
    setCurrentPosition(0);
    setDuration(0);
    if (videoRef) {
      videoRef.unloadAsync();
      setVideoRef(null);
    }
  };

  // Extracción de datos de media
  const media = mediaData ? {
    uri: mediaData.publicUrl || mediaData.uri,
    type: mediaData.type,
    width: mediaData.width || 0,
    height: mediaData.height || 0,
    duration: mediaData.duration || 0,
    timestamp: mediaData.timestamp || new Date().toISOString(),
    format: mediaData.format || (mediaData.type === 'video' ? 'mp4' : 'jpg'),
    fileSize: mediaData.fileSize || 0,
    thumbnail: mediaData.thumbnail
  } : null;

  const loadMedia = async () => {
    if (!media?.uri) {
      console.warn('❌ No media URI provided');
      Alert.alert(
        'Media No Disponible',
        'No se encontró la ubicación del archivo de media.',
        [{ text: 'Cerrar', onPress: onDismiss }]
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Cargando media desde Supabase Storage:', media.uri);

      if (media.type === 'video') {
        // Para videos, no necesitamos hacer nada especial aquí
        // El componente Video se encargará de la carga
        setDuration(media.duration * 1000); // Convertir a ms para el componente Video
      }

      console.log('✅ Media configurado para carga');
    } catch (error) {
      console.error('❌ Error loading media:', error);
      
      let errorMessage = 'No se pudo cargar el archivo desde Supabase Storage.';
      let suggestions = '';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión al cargar el archivo.';
          suggestions = '\n\nVerifica tu conexión a internet e inténtalo de nuevo.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = 'El archivo no se encontró en Supabase Storage.';
          suggestions = '\n\nEl archivo puede haber sido eliminado o movido.';
        }
      }
      
      Alert.alert(
        'Error de Carga',
        errorMessage + suggestions,
        [
          { text: 'Reintentar', onPress: loadMedia },
          { text: 'Cerrar', onPress: onDismiss }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones de control de video
  const playPauseVideo = async () => {
    if (!videoRef) return;

    try {
      const status = await videoRef.getStatusAsync();
      
      if (status.isLoaded) {
        if (isPlaying) {
          await videoRef.pauseAsync();
          setIsPlaying(false);
        } else {
          await videoRef.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('❌ Error playing/pausing video:', error);
      Alert.alert('Error', 'No se pudo reproducir el video.');
    }
  };

  const onVideoStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || duration);
      setIsPlaying(status.isPlaying);
    }
  };

  const onVideoLoad = (status: any) => {
    console.log('🎬 Video cargado:', status);
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
    }
  };

  const onVideoError = (error: string) => {
    console.error('❌ Error de video:', error);
    Alert.alert(
      'Error de Video',
      'No se pudo reproducir el video. Verifica tu conexión a internet.',
      [{ text: 'OK' }]
    );
  };

  // Funciones de utilidad
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular dimensiones para el contenedor
  const getMediaDimensions = () => {
    if (!media) return { width: 300, height: 200 };
    
    const maxWidth = screenWidth * 0.8;
    const maxHeight = screenHeight * 0.6;
    
    const aspectRatio = media.height > 0 ? media.width / media.height : 16 / 9;
    
    let containerWidth = Math.min(media.width, maxWidth);
    let containerHeight = containerWidth / aspectRatio;
    
    if (containerHeight > maxHeight) {
      containerHeight = maxHeight;
      containerWidth = containerHeight * aspectRatio;
    }
    
    return { width: containerWidth, height: containerHeight };
  };

  const mediaDimensions = getMediaDimensions();

  if (!media) {
    return null;
  }

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss}
        style={{ maxHeight: screenHeight * 0.9 }}
      >
        <Dialog.Title>
          {media.type === 'video' ? '🎬 Video Capturado' : '📸 Foto Capturada'}
        </Dialog.Title>
        
        <Dialog.Content>
          {/* Contenedor del media */}
          <Surface 
            style={[
              styles.mediaContainer,
              {
                width: mediaDimensions.width,
                height: mediaDimensions.height,
                backgroundColor: theme.colors.surfaceVariant
              }
            ]}
          >
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ProgressBar indeterminate />
                <Text variant="bodySmall" style={{ marginTop: 8 }}>
                  Cargando desde Supabase Storage...
                </Text>
              </View>
            )}

            {media.type === 'photo' ? (
              <Image
                source={{ uri: media.uri }}
                style={styles.image}
                contentFit="contain"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  onVideoError('Error cargando imagen');
                }}
              />
            ) : (
              <Video
                ref={setVideoRef}
                source={{ uri: media.uri }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping={false}
                onLoad={onVideoLoad}
                onPlaybackStatusUpdate={onVideoStatusUpdate}
                onError={onVideoError}
              />
            )}

            {/* Controles de video */}
            {media.type === 'video' && !isLoading && (
              <View style={styles.videoControls}>
                <IconButton
                  icon={isPlaying ? 'pause' : 'play'}
                  size={32}
                  onPress={playPauseVideo}
                  style={styles.playButton}
                  iconColor={theme.colors.onPrimary}
                />
                
                {duration > 0 && (
                  <View style={styles.timeDisplay}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onPrimary }}>
                      {formatTime(currentPosition)} / {formatTime(duration)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Surface>

          {/* Información del archivo */}
          <View style={styles.infoContainer}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              📁 Guardado en Supabase Storage
            </Text>
            
            <View style={styles.infoRow}>
              <Text variant="bodySmall">Tipo:</Text>
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                {media.type === 'video' ? 'Video' : 'Foto'} ({media.format.toUpperCase()})
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodySmall">Dimensiones:</Text>
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                {media.width} × {media.height}
              </Text>
            </View>

            {media.type === 'video' && media.duration > 0 && (
              <View style={styles.infoRow}>
                <Text variant="bodySmall">Duración:</Text>
                <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                  {formatTime(media.duration * 1000)}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text variant="bodySmall">Tamaño:</Text>
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                {formatFileSize(media.fileSize)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodySmall">Capturado:</Text>
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                {formatDate(media.timestamp)}
              </Text>
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Cerrar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  mediaContainer: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1
  },
  image: {
    width: '100%',
    height: '100%'
  },
  video: {
    width: '100%',
    height: '100%'
  },
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8
  },
  playButton: {
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  timeDisplay: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 8
  },
  infoContainer: {
    gap: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
}); 
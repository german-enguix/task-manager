import React, { useState, useRef, useEffect } from 'react';
import { View, Alert, StyleSheet, Dimensions } from 'react-native';
import { 
  Portal, 
  Dialog, 
  Text, 
  Button, 
  IconButton,
  Surface,
  useTheme
} from 'react-native-paper';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MediaData } from '../services/cameraService';
import { supabaseService } from '../services/supabaseService';

interface CameraViewDialogProps {
  visible: boolean;
  title: string;
  description: string;
  mediaType?: 'photo' | 'video' | 'both';
  onSuccess: (mediaData: MediaData) => void;
  onCancel: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const CameraViewDialog: React.FC<CameraViewDialogProps> = ({
  visible,
  title,
  description,
  mediaType = 'photo',
  onSuccess,
  onCancel
}) => {
  const theme = useTheme();
  
  // Estados principales
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMode, setCurrentMode] = useState<'photo' | 'video'>('photo');
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  
  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  // Resetear estado cuando se abre el diálogo
  useEffect(() => {
    if (visible) {
      console.log('📹 Abriendo CameraViewDialog');
      setIsCameraReady(false);
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [visible]);

  // Resetear estado de cámara cuando cambia facing
  useEffect(() => {
    console.log('📹 Cambio de cámara, reseteando estado ready');
    setIsCameraReady(false);
  }, [facing]);

  useEffect(() => {
    if (mediaType === 'photo') {
      setCurrentMode('photo');
    } else if (mediaType === 'video') {
      setCurrentMode('video');
    }
    // Para 'both', mantener el modo actual o defaultear a photo
  }, [mediaType]);

  const onCameraReady = () => {
    console.log('📹 Cámara lista para capturar');
    setIsCameraReady(true);
  };

  const takePicture = async () => {
    console.log('📸 Intentando tomar foto...');
    console.log('Camera ref:', !!cameraRef.current);
    console.log('Camera ready:', isCameraReady);
    console.log('Is processing:', isProcessing);

    if (!cameraRef.current) {
      console.error('❌ No hay referencia a la cámara');
      Alert.alert('Error', 'Cámara no disponible');
      return;
    }

    if (!isCameraReady) {
      console.error('❌ Cámara no está lista');
      Alert.alert('Error', 'La cámara aún no está lista. Espera un momento.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('📸 Tomando foto...');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      console.log('📸 Foto capturada exitosamente:', photo);

      if (photo && photo.uri) {
        await processAndUploadMedia(photo, 'photo');
      } else {
        console.error('❌ Foto capturada pero sin URI');
        Alert.alert('Error', 'No se pudo procesar la foto capturada.');
      }
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      Alert.alert('Error', `No se pudo tomar la foto: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    console.log('🎬 Intentando iniciar grabación...');
    console.log('Camera ref:', !!cameraRef.current);
    console.log('Camera ready:', isCameraReady);
    console.log('Is recording:', isRecording);

    if (!cameraRef.current) {
      console.error('❌ No hay referencia a la cámara');
      Alert.alert('Error', 'Cámara no disponible');
      return;
    }

    if (!isCameraReady) {
      console.error('❌ Cámara no está lista');
      Alert.alert('Error', 'La cámara aún no está lista. Espera un momento.');
      return;
    }

    try {
      setIsRecording(true);
      console.log('🎬 Iniciando grabación...');

      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // máximo 60 segundos
        quality: 'high',
      });

      console.log('🎬 Video grabado exitosamente:', video);

      if (video && video.uri) {
        await processAndUploadMedia(video, 'video');
      } else {
        console.error('❌ Video grabado pero sin URI');
        Alert.alert('Error', 'No se pudo procesar el video grabado.');
      }
    } catch (error) {
      console.error('❌ Error grabando video:', error);
      Alert.alert('Error', `No se pudo grabar el video: ${error.message || error}`);
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      console.log('🛑 Deteniendo grabación...');
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('❌ Error deteniendo grabación:', error);
    }
  };

  const processAndUploadMedia = async (media: any, type: 'photo' | 'video') => {
    try {
      setIsProcessing(true);
      console.log('🔄 Procesando y subiendo media...');

      // Determinar formato y extensión
      const isVideo = type === 'video';
      const format = isVideo ? 'mp4' : 'jpg';
      const fileName = `${isVideo ? 'video' : 'photo'}.${format}`;

      // Subir a Supabase
      const { publicUrl, filePath } = await supabaseService.uploadMediaFile(media.uri, fileName);

      // Crear objeto MediaData
      const mediaData: MediaData = {
        uri: media.uri,
        publicUrl,
        filePath,
        type: isVideo ? 'video' : 'photo',
        width: media.width || 1920,
        height: media.height || 1080,
        duration: isVideo ? (media.duration ? Math.round(media.duration / 1000) : undefined) : undefined,
        fileSize: 0, // expo-camera no proporciona fileSize
        timestamp: new Date().toISOString(),
        format,
      };

      console.log('✅ Media procesado exitosamente:', mediaData);
      
      onSuccess(mediaData);
    } catch (error) {
      console.error('❌ Error procesando media:', error);
      Alert.alert(
        'Error de Subida',
        'No se pudo subir el archivo a Supabase. Verifica tu conexión.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleMode = () => {
    if (mediaType === 'both') {
      setCurrentMode(current => current === 'photo' ? 'video' : 'photo');
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    setIsRecording(false);
    setIsProcessing(false);
    onCancel();
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={handleCancel}>
          <Dialog.Title>Permisos Necesarios</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Necesitamos acceso a la cámara para capturar evidencia.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancel}>Cancelar</Button>
            <Button mode="contained" onPress={requestPermission}>
              Otorgar Permisos
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={!isRecording && !isProcessing ? handleCancel : undefined}
        style={styles.dialog}
      >
        <Dialog.Title>{title}</Dialog.Title>
        
        <Dialog.Content style={styles.content}>
          <Text variant="bodyMedium" style={styles.description}>
            {description}
          </Text>

          {/* Vista de la cámara */}
          <Surface style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mode={currentMode}
              onCameraReady={onCameraReady}
            >
              {/* Controles superpuestos */}
              <View style={styles.overlay}>
                {/* Indicador de modo y estado */}
                <View style={styles.topControls}>
                  <Surface style={styles.modeIndicator}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onPrimary }}>
                      {currentMode === 'photo' ? '📸 FOTO' : '🎬 VIDEO'}
                    </Text>
                  </Surface>
                  {!isCameraReady && (
                    <Surface style={[styles.modeIndicator, { backgroundColor: 'rgba(255,165,0,0.8)', marginLeft: 8 }]}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onPrimary }}>
                        ⏳ PREPARANDO...
                      </Text>
                    </Surface>
                  )}
                  {isProcessing && (
                    <Surface style={[styles.modeIndicator, { backgroundColor: 'rgba(0,255,0,0.8)', marginLeft: 8 }]}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onPrimary }}>
                        📤 SUBIENDO...
                      </Text>
                    </Surface>
                  )}
                </View>

                {/* Controles inferiores */}
                <View style={styles.bottomControls}>
                  {/* Botón de cambiar cámara */}
                  <IconButton
                    icon="camera-switch"
                    size={24}
                    iconColor={!isCameraReady ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary}
                    style={[
                      styles.controlButton,
                      !isCameraReady && { backgroundColor: 'rgba(128,128,128,0.3)' }
                    ]}
                    onPress={() => {
                      console.log('🔄 Cambiando cámara');
                      toggleCameraFacing();
                    }}
                    disabled={isRecording || isProcessing || !isCameraReady}
                  />

                  {/* Botón principal de captura */}
                  <IconButton
                    icon={
                      isProcessing ? 'upload' : 
                      isRecording ? 'stop' : 
                      currentMode === 'video' ? 'record' : 'camera'
                    }
                    size={isRecording ? 40 : 50}
                    iconColor={
                      !isCameraReady ? theme.colors.onSurfaceDisabled :
                      isRecording ? theme.colors.error : 
                      isProcessing ? theme.colors.secondary :
                      theme.colors.onPrimary
                    }
                    style={[
                      styles.captureButton,
                      isRecording && styles.recordingButton,
                      !isCameraReady && { backgroundColor: 'rgba(128,128,128,0.5)' }
                    ]}
                    onPress={() => {
                      console.log('🔘 Botón de captura presionado');
                      console.log('Modo actual:', currentMode);
                      console.log('Está grabando:', isRecording);
                      console.log('Está procesando:', isProcessing);
                      console.log('Cámara lista:', isCameraReady);
                      
                      if (isRecording) {
                        console.log('🛑 Ejecutando stopRecording');
                        stopRecording();
                      } else if (currentMode === 'video') {
                        console.log('🎬 Ejecutando startRecording');
                        startRecording();
                      } else {
                        console.log('📸 Ejecutando takePicture');
                        takePicture();
                      }
                    }}
                    disabled={isProcessing || !isCameraReady}
                  />

                  {/* Botón de cambiar modo (solo si permite both) */}
                  {mediaType === 'both' ? (
                    <IconButton
                      icon={currentMode === 'photo' ? 'video' : 'camera'}
                      size={24}
                      iconColor={!isCameraReady ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary}
                      style={[
                        styles.controlButton,
                        !isCameraReady && { backgroundColor: 'rgba(128,128,128,0.3)' }
                      ]}
                      onPress={() => {
                        console.log('🔄 Cambiando modo a:', currentMode === 'photo' ? 'video' : 'photo');
                        toggleMode();
                      }}
                      disabled={isRecording || isProcessing || !isCameraReady}
                    />
                  ) : (
                    <View style={styles.controlButton} />
                  )}
                </View>
              </View>
            </CameraView>
          </Surface>

          {/* Estado de procesamiento y debug */}
          {(isProcessing || !isCameraReady) && (
            <View style={styles.processingContainer}>
              {isProcessing && (
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  🔄 Subiendo a Supabase Storage...
                </Text>
              )}
              {!isCameraReady && !isProcessing && (
                <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                  ⏳ Preparando cámara...
                </Text>
              )}
            </View>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button 
            onPress={handleCancel}
            disabled={isRecording}
          >
            Cancelar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: screenHeight * 0.9,
  },
  content: {
    padding: 16,
  },
  description: {
    marginBottom: 16,
    textAlign: 'center',
  },
  cameraContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: screenHeight * 0.5,
    maxHeight: 400,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  modeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 48,
    height: 48,
  },
  captureButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 70,
    height: 70,
  },
  recordingButton: {
    backgroundColor: 'rgba(255,0,0,0.8)',
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
}); 
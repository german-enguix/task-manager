import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, Animated, Dimensions } from 'react-native';
import { 
  Portal, 
  Dialog, 
  Text, 
  Button, 
  ProgressBar, 
  IconButton,
  Surface,
  useTheme
} from 'react-native-paper';
import { cameraService, CameraConfig, MediaData } from '../services/cameraService';
import { CameraViewDialog } from './CameraViewDialog';

interface CameraDialogProps {
  visible: boolean;
  title: string;
  description: string;
  config?: CameraConfig;
  onSuccess: (mediaData: MediaData) => void;
  onCancel: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const CameraDialog: React.FC<CameraDialogProps> = ({
  visible,
  title,
  description,
  config = {},
  onSuccess,
  onCancel
}) => {
  const theme = useTheme();
  
  // Estados principales
  const [currentStatus, setCurrentStatus] = useState<string>('Preparando cámara...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [showCameraView, setShowCameraView] = useState(false);
  
  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Efectos
  useEffect(() => {
    if (visible) {
      resetState();
      initializeCamera();
    }
  }, [visible]);

  useEffect(() => {
    if (isProcessing) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [isProcessing]);

  // Funciones de estado
  const resetState = () => {
    setCurrentStatus('Preparando cámara...');
    setIsProcessing(false);
    setIsMediaReady(false);
    setShowCameraView(false);
    pulseAnim.setValue(1);
    progressAnim.setValue(0);
  };

  const startAnimations = () => {
    // Animación de pulso para el icono
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de progreso
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    progressAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Funciones principales
  const initializeCamera = async () => {
    try {
      setCurrentStatus('Verificando permisos...');
      const hasPermissions = await cameraService.requestPermissions();
      
      if (!hasPermissions) {
        setCurrentStatus('Permisos denegados');
        Alert.alert(
          'Permisos Necesarios',
          'Necesitamos acceso a la cámara y galería para capturar evidencia. Por favor, otorga los permisos en la configuración.',
          [{ text: 'OK', onPress: handleCancel }]
        );
        return;
      }
      
      setCurrentStatus('Listo para capturar');
    } catch (error) {
      console.error('Error initializing camera:', error);
      setCurrentStatus('Error de inicialización');
      Alert.alert(
        'Error',
        'No se pudo inicializar el sistema de cámara. Inténtalo de nuevo.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: handleCancel },
          { text: 'Reintentar', onPress: initializeCamera }
        ]
      );
    }
  };

  const openCameraView = () => {
    setShowCameraView(true);
  };

  const handleCameraViewSuccess = (mediaData: MediaData) => {
    setShowCameraView(false);
    setIsMediaReady(true);
    setCurrentStatus('Media capturada y guardada');
    
    console.log('✅ Media procesada exitosamente desde cámara en tiempo real');
    
    setTimeout(() => {
      onSuccess(mediaData);
      resetState();
    }, 500);
  };

  const handleCameraViewCancel = () => {
    setShowCameraView(false);
  };

  const captureFromCamera = async () => {
    try {
      setCurrentStatus('Abriendo cámara...');
      setIsProcessing(true);
      
      const mediaData = await cameraService.openCamera(config);
      
      setIsMediaReady(true);
      setIsProcessing(false);
      setCurrentStatus('Media capturada y guardada');
      
      console.log('✅ Media procesada exitosamente');
      
      setTimeout(() => {
        onSuccess(mediaData);
        resetState();
      }, 500);
      
    } catch (error) {
      console.error('Error capturing from camera:', error);
      setIsProcessing(false);
      
      let errorMessage = 'No se pudo capturar desde la cámara.';
      if (error instanceof Error) {
        if (error.message.includes('Permisos')) {
          errorMessage = 'Permisos de cámara denegados. Verifica la configuración.';
        } else if (error.message.includes('cancelada')) {
          errorMessage = 'Captura cancelada.';
        } else if (error.message.includes('Storage') || error.message.includes('upload')) {
          errorMessage = 'Error subiendo el archivo. Verifica tu conexión a internet.';
        }
      }
      
      Alert.alert('Error de Captura', errorMessage, [{ text: 'OK' }]);
    }
  };

  const selectFromGallery = async () => {
    try {
      setCurrentStatus('Abriendo galería...');
      setIsProcessing(true);
      
      const mediaData = await cameraService.openGallery(config);
      
      setIsMediaReady(true);
      setIsProcessing(false);
      setCurrentStatus('Media seleccionada y guardada');
      
      console.log('✅ Media procesada exitosamente');
      
      setTimeout(() => {
        onSuccess(mediaData);
        resetState();
      }, 500);
      
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      setIsProcessing(false);
      
      let errorMessage = 'No se pudo seleccionar desde la galería.';
      if (error instanceof Error) {
        if (error.message.includes('Permisos')) {
          errorMessage = 'Permisos de galería denegados. Verifica la configuración.';
        } else if (error.message.includes('cancelada')) {
          errorMessage = 'Selección cancelada.';
        } else if (error.message.includes('Storage') || error.message.includes('upload')) {
          errorMessage = 'Error subiendo el archivo. Verifica tu conexión a internet.';
        }
      }
      
      Alert.alert('Error de Selección', errorMessage, [{ text: 'OK' }]);
    }
  };

  const handleCancel = async () => {
    if (cameraService.isCurrentlyCapturing) {
      await cameraService.cancelCapture();
    }
    if (showCameraView) {
      setShowCameraView(false);
      return;
    }
    resetState();
    onCancel();
  };

  // Funciones de UI
  const getStatusColor = () => {
    if (isMediaReady) return theme.colors.primary;
    if (isProcessing) return theme.colors.secondary;
    if (currentStatus.includes('Error') || currentStatus.includes('denegados')) {
      return theme.colors.error;
    }
    return theme.colors.onSurface;
  };

  const getStatusIcon = () => {
    if (isMediaReady) return 'check-circle';
    if (isProcessing) return 'cloud-upload';
    if (currentStatus.includes('Error') || currentStatus.includes('denegados')) {
      return 'alert-circle';
    }
    if (currentStatus.includes('Listo')) return 'camera';
    return 'camera-timer';
  };

  const getMediaTypeText = () => {
    const mediaTypes = config.mediaTypes || 'photo';
    switch (mediaTypes) {
      case 'photo':
        return 'foto';
      case 'video':
        return 'video';
      case 'both':
        return 'foto o video';
      default:
        return 'foto';
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={!isProcessing ? handleCancel : undefined}>
        <Dialog.Title>{title}</Dialog.Title>
        
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ marginBottom: 24 }}>
            {description}
          </Text>

          {/* Estado de la captura */}
          <Surface 
            style={{ 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 24,
              backgroundColor: theme.colors.surfaceVariant 
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <IconButton
                  icon={getStatusIcon()}
                  size={32}
                  iconColor={getStatusColor()}
                />
              </Animated.View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text 
                  variant="bodyLarge" 
                  style={{ 
                    color: getStatusColor(),
                    fontWeight: '600'
                  }}
                >
                  {currentStatus}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {isProcessing ? 'Procesando y subiendo a Supabase...' : `Capturar ${getMediaTypeText()}`}
                </Text>
              </View>
            </View>

            {/* Barra de progreso */}
            {isProcessing && (
              <Animated.View style={{ opacity: progressAnim }}>
                <ProgressBar 
                  indeterminate 
                  style={{ height: 4, borderRadius: 2 }}
                  color={theme.colors.primary}
                />
              </Animated.View>
            )}
          </Surface>

          {/* Configuración actual */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Configuración:
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              • Tipo: {getMediaTypeText()}
              {config.quality && (
                <>
                  {'\n'}• Calidad: {Math.round((config.quality || 0.8) * 100)}%
                </>
              )}
              {config.videoMaxDuration && (
                <>
                  {'\n'}• Duración máxima: {config.videoMaxDuration}s
                </>
              )}
            </Text>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button 
            onPress={handleCancel}
            disabled={isProcessing}
            style={{ marginRight: 8 }}
          >
            Cancelar
          </Button>
          
          <Button 
            mode="outlined"
            onPress={selectFromGallery}
            disabled={isProcessing || currentStatus.includes('Error') || currentStatus.includes('denegados')}
            icon="folder-image"
            style={{ marginRight: 8 }}
          >
            Galería
          </Button>
          
          <Button 
            mode="contained"
            onPress={openCameraView}
            disabled={isProcessing || currentStatus.includes('Error') || currentStatus.includes('denegados')}
            icon="camera"
          >
            Ver Cámara
          </Button>
        </Dialog.Actions>

        {/* Camera View Dialog */}
        <CameraViewDialog
          visible={showCameraView}
          title="Capturar Evidencia"
          description="Usa la cámara para tomar fotos o grabar videos"
          mediaType={config.mediaTypes || 'photo'}
          onSuccess={handleCameraViewSuccess}
          onCancel={handleCameraViewCancel}
        />
      </Dialog>
    </Portal>
  );
}; 
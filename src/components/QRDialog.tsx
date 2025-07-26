import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface QRDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const QRDialog: React.FC<QRDialogProps> = ({
  visible,
  onDismiss,
  onSuccess,
  title = 'Escanear QR',
  description = 'Apunta la cámara hacia el código QR para registrar la evidencia'
}) => {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [scanLineAnimation] = useState(new Animated.Value(0));
  const [cornerAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setIsScanning(true);
      setIsSuccess(false);
      startAnimations();
      // Solicitar permisos si no los tenemos
      if (!permission?.granted) {
        requestPermission();
      }
    } else {
      setIsScanning(false);
      setIsSuccess(false);
      stopAnimations();
    }
  }, [visible, permission]);

  const startAnimations = () => {
    // Animación de línea de escaneo que se mueve verticalmente
    const scanLineAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // Animación de las esquinas del marco
    const cornerAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnimation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    scanLineAnimationLoop.start();
    cornerAnimationLoop.start();
  };

  const stopAnimations = () => {
    scanLineAnimation.stopAnimation();
    cornerAnimation.stopAnimation();
    scanLineAnimation.setValue(0);
    cornerAnimation.setValue(0);
  };

  const handleSimulateSuccess = () => {
    setIsScanning(false);
    setIsSuccess(true);
    stopAnimations();
    
    // Mostrar estado de éxito por un momento antes de cerrar
    setTimeout(() => {
      onSuccess();
      // Reset para la próxima vez
      setIsSuccess(false);
    }, 1500);
  };

  const handleCancel = () => {
    setIsScanning(false);
    setIsSuccess(false);
    stopAnimations();
    onDismiss();
  };

  const scanLineTranslateY = scanLineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const cornerOpacity = cornerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  if (!permission) {
    return null;
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        
        <Dialog.Content>
          <View style={styles.content}>
            {/* Área de cámara y scanner */}
            <View style={styles.cameraContainer}>
              {permission.granted ? (
                <>
                  {/* Visor de cámara */}
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    mode="picture"
                  />
                  
                  {/* Overlay del scanner */}
                  <View style={styles.scannerOverlay}>
                    {/* Marco del scanner */}
                    <View style={styles.scannerFrame}>
                      {/* Esquinas del marco */}
                      <Animated.View style={[styles.corner, styles.topLeft, { opacity: cornerOpacity }]} />
                      <Animated.View style={[styles.corner, styles.topRight, { opacity: cornerOpacity }]} />
                      <Animated.View style={[styles.corner, styles.bottomLeft, { opacity: cornerOpacity }]} />
                      <Animated.View style={[styles.corner, styles.bottomRight, { opacity: cornerOpacity }]} />
                      
                      {/* Línea de escaneo */}
                      {isScanning && !isSuccess && (
                        <Animated.View
                          style={[
                            styles.scanLine,
                            {
                              transform: [{ translateY: scanLineTranslateY }],
                            }
                          ]}
                        />
                      )}
                      
                      {/* Indicador de éxito */}
                      {isSuccess && (
                        <View style={styles.successIndicator}>
                          <Text style={styles.successText}>✓</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Área oscurecida alrededor del marco */}
                    <View style={[styles.overlay, styles.overlayTop]} />
                    <View style={[styles.overlay, styles.overlayBottom]} />
                    <View style={[styles.overlay, styles.overlayLeft]} />
                    <View style={[styles.overlay, styles.overlayRight]} />
                  </View>
                </>
              ) : (
                <Surface style={styles.permissionPlaceholder}>
                  <Text variant="bodyMedium" style={styles.permissionText}>
                    📱 Permisos de cámara requeridos
                  </Text>
                  <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
                    Otorgar Permisos
                  </Button>
                </Surface>
              )}
            </View>

            {/* Texto descriptivo */}
            <Text variant="bodyMedium" style={styles.description}>
              {description}
            </Text>

            {/* Indicador de estado */}
            <View style={styles.statusContainer}>
              {isSuccess ? (
                <Text variant="bodySmall" style={[styles.statusText, { color: '#4CAF50', fontWeight: 'bold' }]}>
                  ✅ QR escaneado correctamente - Evidencia registrada
                </Text>
              ) : isScanning ? (
                <>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodySmall" style={[styles.statusText, { color: theme.colors.primary }]}>
                    Buscando código QR...
                  </Text>
                </>
              ) : (
                <Text variant="bodySmall" style={styles.statusText}>
                  Presiona "Simular Lectura" para continuar
                </Text>
              )}
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={isSuccess}>
            Cancelar
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSimulateSuccess}
            disabled={isSuccess}
          >
            {isSuccess ? 'Completado' : 'Simular Lectura'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.6;

const styles = StyleSheet.create({
  dialog: {
    marginHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  cameraContainer: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  permissionPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  permissionButton: {
    marginTop: 10,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: SCANNER_SIZE * 0.7,
    height: SCANNER_SIZE * 0.7,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  successIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -25,
    marginLeft: -25,
    width: 50,
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTop: {
    top: 0,
    left: 0,
    right: 0,
    height: (SCANNER_SIZE - SCANNER_SIZE * 0.7) / 2,
  },
  overlayBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: (SCANNER_SIZE - SCANNER_SIZE * 0.7) / 2,
  },
  overlayLeft: {
    top: (SCANNER_SIZE - SCANNER_SIZE * 0.7) / 2,
    bottom: (SCANNER_SIZE - SCANNER_SIZE * 0.7) / 2,
    left: 0,
    width: (SCANNER_SIZE - SCANNER_SIZE * 0.7) / 2,
  },
  overlayRight: {
    top: (SCANNER_SIZE - SCANNER_SIZE * 0.7) / 2,
    bottom: (SCANNER_SIZE - SCANNER_SIZE * 0.7) / 2,
    right: 0,
    width: (SCANNER_SIZE - SCANNER_SIZE * 0.7) / 2,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statusText: {
    marginLeft: 8,
    textAlign: 'center',
  },
}); 
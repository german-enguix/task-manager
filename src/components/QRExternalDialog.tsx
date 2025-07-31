import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
  Card,
  Divider,
} from 'react-native-paper';
import { View, StyleSheet, Animated } from 'react-native';
import { Task } from '@/types';

interface QRExternalDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onNavigateToTask: () => void;
  task?: Task;
  qrData?: {
    qrCode: string;
    scannedAt: Date;
    source: string;
  };
}

export const QRExternalDialog: React.FC<QRExternalDialogProps> = ({
  visible,
  onDismiss,
  onNavigateToTask,
  task,
  qrData
}) => {
  const theme = useTheme();
  const [checkAnimation] = useState(new Animated.Value(0));
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [qrAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      startSuccessAnimation();
    } else {
      checkAnimation.setValue(0);
      fadeAnimation.setValue(0);
      qrAnimation.setValue(0);
    }
  }, [visible]);

  const startSuccessAnimation = () => {
    // Animación del QR scan effect
    Animated.sequence([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(checkAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(qrAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleNavigate = () => {
    onNavigateToTask();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const checkScale = checkAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const qrOpacity = qrAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>
          📱 Código QR Escaneado
        </Dialog.Title>
        
        <Dialog.Content>
          <Animated.View 
            style={[
              styles.content,
              { opacity: fadeAnimation }
            ]}
          >
            {/* Icono de éxito y QR */}
            <View style={styles.successContainer}>
              <Animated.View 
                style={[
                  styles.qrIcon,
                  { 
                    backgroundColor: '#4CAF50',
                    opacity: qrOpacity
                  }
                ]}
              >
                <Text style={styles.qrText}>QR</Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.checkIcon,
                  { transform: [{ scale: checkScale }] }
                ]}
              >
                <Text style={styles.checkMark}>✓</Text>
              </Animated.View>
            </View>

            <Text variant="bodyLarge" style={styles.successText}>
              ¡Código QR leído correctamente!
            </Text>

            <Card style={styles.detailsCard}>
              <Card.Content>
                <Text variant="labelMedium" style={styles.sectionTitle}>
                  📊 Información del Escaneo
                </Text>
                
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.dataLabel}>Código:</Text>
                  <Text variant="bodySmall" style={styles.dataValue}>
                    {qrData?.qrCode || 'QR_TASK_001'}
                  </Text>
                </View>
                
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.dataLabel}>Fecha:</Text>
                  <Text variant="bodySmall" style={styles.dataValue}>
                    {formatDate(qrData?.scannedAt || new Date())}
                  </Text>
                </View>
                
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.dataLabel}>Hora:</Text>
                  <Text variant="bodySmall" style={styles.dataValue}>
                    {formatTime(qrData?.scannedAt || new Date())}
                  </Text>
                </View>
                
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.dataLabel}>Origen:</Text>
                  <Text variant="bodySmall" style={styles.dataValue}>
                    {qrData?.source || 'Cámara del dispositivo'}
                  </Text>
                </View>

                {task && (
                  <>
                    <Divider style={styles.divider} />
                    
                    <Text variant="labelMedium" style={styles.sectionTitle}>
                      🎯 Tarea Vinculada
                    </Text>
                    
                    <Text variant="bodySmall" style={styles.taskTitle}>
                      {task.title}
                    </Text>
                    
                    {task.description && (
                      <Text variant="bodySmall" style={styles.taskDescription}>
                        {task.description}
                      </Text>
                    )}
                    
                    <View style={styles.taskMetaRow}>
                      <Text variant="bodySmall" style={styles.taskMeta}>
                        📍 {task.location || 'Sin ubicación'}
                      </Text>
                      <Text variant="bodySmall" style={[styles.taskMeta, styles.priority]}>
                        🏷️ {task.priority || 'normal'}
                      </Text>
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>

            <Text variant="bodySmall" style={styles.instructionText}>
              El código QR ha sido detectado desde la cámara nativa. Serás redirigido a la tarea correspondiente.
            </Text>
          </Animated.View>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button onPress={onDismiss} textColor={theme.colors.outline}>
            Cerrar
          </Button>
          <Button 
            mode="contained" 
            onPress={handleNavigate}
            style={styles.navigateButton}
            icon="arrow-right"
          >
            Ir a Tarea
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
    fontSize: 18,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successContainer: {
    position: 'relative',
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
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
  qrText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkMark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
    color: '#4CAF50',
  },
  detailsCard: {
    width: '100%',
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dataLabel: {
    fontWeight: '500',
    flex: 1,
  },
  dataValue: {
    flex: 2,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  divider: {
    marginVertical: 12,
  },
  taskTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    opacity: 0.7,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  taskMeta: {
    fontSize: 11,
    opacity: 0.6,
  },
  priority: {
    textTransform: 'capitalize',
  },
  instructionText: {
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 10,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  navigateButton: {
    minWidth: 120,
  },
}); 
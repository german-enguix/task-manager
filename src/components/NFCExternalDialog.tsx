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
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { TaskSubtask } from '@/types';

interface NFCExternalDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onNavigateToSubtask: () => void;
  subtask?: TaskSubtask;
  nfcData?: {
    tagId: string;
    readAt: Date;
    location: string;
  };
}

export const NFCExternalDialog: React.FC<NFCExternalDialogProps> = ({
  visible,
  onDismiss,
  onNavigateToSubtask,
  subtask,
  nfcData
}) => {
  const theme = useTheme();
  const [checkAnimation] = useState(new Animated.Value(0));
  const [fadeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      startSuccessAnimation();
    } else {
      checkAnimation.setValue(0);
      fadeAnimation.setValue(0);
    }
  }, [visible]);

  const startSuccessAnimation = () => {
    // Animación del check mark
    Animated.sequence([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(checkAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNavigate = () => {
    onNavigateToSubtask();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const checkScale = checkAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>
          🎯 NFC Detectado
        </Dialog.Title>
        
        <Dialog.Content>
          <Animated.View 
            style={[
              styles.content,
              { opacity: fadeAnimation }
            ]}
          >
            {/* Icono de éxito */}
            <View style={styles.successContainer}>
              <View style={[styles.successIcon, { backgroundColor: '#4CAF50' }]}>
                <Animated.Text 
                  style={[
                    styles.checkMark,
                    { transform: [{ scale: checkScale }] }
                  ]}
                >
                  ✓
                </Animated.Text>
              </View>
            </View>

            <Text variant="bodyLarge" style={styles.successText}>
              ¡Lectura NFC exitosa!
            </Text>

            <Card style={styles.detailsCard}>
              <Card.Content>
                <Text variant="labelMedium" style={styles.sectionTitle}>
                  📡 Datos del Tag NFC
                </Text>
                
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.dataLabel}>ID:</Text>
                  <Text variant="bodySmall" style={styles.dataValue}>
                    {nfcData?.tagId || 'NFC_EXTERNAL_001'}
                  </Text>
                </View>
                
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.dataLabel}>Hora:</Text>
                  <Text variant="bodySmall" style={styles.dataValue}>
                    {formatTime(nfcData?.readAt || new Date())}
                  </Text>
                </View>
                
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.dataLabel}>Ubicación:</Text>
                  <Text variant="bodySmall" style={styles.dataValue}>
                    {nfcData?.location || 'Área de trabajo'}
                  </Text>
                </View>

                {subtask && (
                  <>
                    <Divider style={styles.divider} />
                    
                    <Text variant="labelMedium" style={styles.sectionTitle}>
                      📋 Subtarea Relacionada
                    </Text>
                    
                    <Text variant="bodySmall" style={styles.subtaskTitle}>
                      {subtask.title}
                    </Text>
                    
                    {subtask.description && (
                      <Text variant="bodySmall" style={styles.subtaskDescription}>
                        {subtask.description}
                      </Text>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>

            <Text variant="bodySmall" style={styles.instructionText}>
              El NFC ha sido detectado desde fuera de la aplicación. ¿Deseas ir a la subtarea correspondiente?
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
            Ir a Subtarea
          </Button>
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
    fontSize: 18,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successContainer: {
    marginBottom: 15,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  checkMark: {
    color: 'white',
    fontSize: 24,
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
  },
  divider: {
    marginVertical: 12,
  },
  subtaskTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subtaskDescription: {
    opacity: 0.7,
    fontStyle: 'italic',
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
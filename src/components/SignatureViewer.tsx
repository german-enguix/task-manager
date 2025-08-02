import React from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
} from 'react-native-paper';
import { View, StyleSheet, PanResponder } from 'react-native';
import { logger } from '@/utils/logger';

interface SignatureViewerProps {
  visible: boolean;
  onDismiss: () => void;
  signatureData: string;
  title?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  timestamp: number;
}

export const SignatureViewer: React.FC<SignatureViewerProps> = ({
  visible,
  onDismiss,
  signatureData,
  title = 'Firma Guardada'
}) => {
  const theme = useTheme();

  let parsedData = null;
  try {
    // Validar que signatureData no esté vacío y sea una cadena válida
    if (!signatureData || typeof signatureData !== 'string' || signatureData.trim() === '') {
      logger.warning('SignatureViewer: signatureData está vacío o no es válido:', signatureData);
      parsedData = null;
    } else {
      parsedData = JSON.parse(signatureData);
    }
  } catch (error) {
    logger.error('Error parsing signature data:', error, 'Data received:', signatureData);
    parsedData = null;
  }

  const renderStroke = (points: Point[], strokeIndex: number) => {
    return points.map((point, pointIndex) => {
      if (pointIndex === 0) return null;
      
      const prevPoint = points[pointIndex - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      );
      
      if (distance > 20) return null;
      
      const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);
      const length = distance;
      
      return (
        <View
          key={`${strokeIndex}-${pointIndex}`}
          style={[
            styles.strokeSegment,
            {
              position: 'absolute',
              left: prevPoint.x,
              top: prevPoint.y - 1,
              width: length,
              height: 2,
              backgroundColor: theme.colors.onSurface,
              transform: [{ rotate: `${angle}rad` }],
            },
          ]}
        />
      );
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        
        <Dialog.Content>
          <View style={styles.content}>
            <Text variant="bodyMedium" style={styles.description}>
              Firma capturada el {parsedData?.timestamp ? new Date(parsedData.timestamp).toLocaleString('es-ES') : 'fecha desconocida'}
            </Text>

            {/* Canvas con la firma */}
            <View style={[styles.canvasContainer, { borderColor: theme.colors.outline }]}>
              <View style={styles.canvas}>
                {parsedData?.strokes?.map((stroke: Stroke, index: number) => 
                  renderStroke(stroke.points, index)
                )}
                
                {!parsedData && (
                  <View style={styles.errorContainer}>
                    <Text variant="bodySmall" style={styles.errorText}>
                      {!signatureData || signatureData.trim() === '' 
                        ? 'No hay datos de firma disponibles'
                        : 'Error al cargar la firma. Los datos pueden estar corruptos.'
                      }
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button mode="contained" onPress={onDismiss}>
            Cerrar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '70%',
  },
  title: {
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    opacity: 0.7,
  },
  canvasContainer: {
    width: 320,
    height: 170,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  canvas: {
    width: 300,
    height: 150,
    position: 'relative',
    overflow: 'hidden',
  },
  strokeSegment: {
    borderRadius: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
    fontStyle: 'italic',
  },
}); 
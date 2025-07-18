import React, { useState, useRef } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
} from 'react-native-paper';
import { 
  View, 
  StyleSheet, 
  PanResponder,
  Dimensions
} from 'react-native';

interface SignatureDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: (signatureData: string) => void;
  title?: string;
  description?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  timestamp: number;
}

export const SignatureDialog: React.FC<SignatureDialogProps> = ({
  visible,
  onDismiss,
  onSuccess,
  title = 'Firma Digital',
  description = 'Dibuja tu firma en el cuadro de abajo'
}) => {
  const theme = useTheme();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasWidth = 300;
  const canvasHeight = 150;

  const clearSignature = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setIsDrawing(false);
  };

  const handleCancel = () => {
    clearSignature();
    onDismiss();
  };

  const handleAccept = () => {
    if (strokes.length === 0 && currentStroke.length === 0) {
      return; // No permitir aceptar sin firma
    }

    // Incluir el stroke actual si existe
    const allStrokes = currentStroke.length > 0 
      ? [...strokes, { points: currentStroke, timestamp: Date.now() }]
      : strokes;

    // Convertir los strokes a una representación de la firma
    const signatureData = JSON.stringify({
      strokes: allStrokes,
      width: canvasWidth,
      height: canvasHeight,
      timestamp: new Date().toISOString()
    });

    clearSignature();
    onSuccess(signatureData);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        setIsDrawing(true);
        const { locationX, locationY } = event.nativeEvent;
        setCurrentStroke([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (event) => {
        if (isDrawing) {
          const { locationX, locationY } = event.nativeEvent;
          setCurrentStroke(prev => [...prev, { x: locationX, y: locationY }]);
        }
      },
      onPanResponderRelease: () => {
        if (currentStroke.length > 1) {
          setStrokes(prev => [...prev, { points: currentStroke, timestamp: Date.now() }]);
        }
        setCurrentStroke([]);
        setIsDrawing(false);
      },
    })
  ).current;

  const hasSignature = strokes.length > 0 || currentStroke.length > 0;

  const renderStroke = (points: Point[], strokeIndex: number, isCurrentStroke = false) => {
    return points.map((point, pointIndex) => {
      if (pointIndex === 0) return null;
      
      const prevPoint = points[pointIndex - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      );
      
      // Solo renderizar si los puntos están lo suficientemente cerca para parecer una línea continua
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
              backgroundColor: isCurrentStroke ? theme.colors.primary : theme.colors.onSurface,
              transform: [{ rotate: `${angle}rad` }],
            },
          ]}
        />
      );
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        
        <Dialog.Content>
          <View style={styles.content}>
            {/* Descripción */}
            <Text variant="bodyMedium" style={styles.description}>
              {description}
            </Text>

            {/* Canvas de firma */}
            <View style={[styles.canvasContainer, { borderColor: theme.colors.outline }]}>
              <View 
                style={styles.canvas}
                {...panResponder.panHandlers}
              >
                {/* Strokes completados */}
                {strokes.map((stroke, index) => 
                  renderStroke(stroke.points, index, false)
                )}
                
                {/* Stroke actual siendo dibujado */}
                {currentStroke.length > 1 && 
                  renderStroke(currentStroke, -1, true)
                }
                
                {/* Texto de ayuda cuando está vacío */}
                {!hasSignature && (
                  <View style={styles.placeholderContainer}>
                    <Text variant="bodySmall" style={[styles.placeholder, { color: theme.colors.onSurfaceVariant }]}>
                      Toca y arrastra para firmar
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Botón para limpiar */}
            {hasSignature && (
              <Button 
                mode="outlined" 
                onPress={clearSignature}
                style={styles.clearButton}
                icon="eraser"
              >
                Limpiar
              </Button>
            )}
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={handleCancel}>
            Cancelar
          </Button>
          <Button 
            mode="contained" 
            onPress={handleAccept}
            disabled={!hasSignature}
            style={styles.acceptButton}
          >
            Aceptar Firma
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
  },
  content: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  canvasContainer: {
    width: 320,
    height: 170,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 10,
    backgroundColor: '#fafafa',
    marginBottom: 15,
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
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  placeholder: {
    fontSize: 16,
    opacity: 0.5,
  },
  clearButton: {
    marginTop: 10,
    minWidth: 120,
  },
  acceptButton: {
    minWidth: 120,
  },
}); 
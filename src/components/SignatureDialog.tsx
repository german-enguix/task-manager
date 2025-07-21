import React, { useState, useRef } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  IconButton,
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
  
  // Ref para el estado de dibujo (sincrónico)
  const isDrawingRef = useRef(false);

  const canvasWidth = 300;
  const canvasHeight = 150;

  const clearSignature = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setIsDrawing(false);
    isDrawingRef.current = false;
    console.log('🧹 Firma limpiada completamente');
  };

  const handleCancel = () => {
    clearSignature();
    onDismiss();
    console.log('❌ Diálogo cancelado');
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
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      
      onPanResponderGrant: (event, gestureState) => {
        console.log('🎨 Inicio de dibujo - onPanResponderGrant');
        const { locationX, locationY } = event.nativeEvent;
        console.log('📍 Punto inicial:', { x: locationX, y: locationY });
        
        // Validar que las coordenadas sean válidas
        if (locationX >= 0 && locationY >= 0 && locationX <= canvasWidth && locationY <= canvasHeight) {
          isDrawingRef.current = true;
          setIsDrawing(true);
          setCurrentStroke([{ x: locationX, y: locationY }]);
          console.log('✅ Dibujo iniciado correctamente (PanResponder)');
        } else {
          console.log('❌ Coordenadas fuera del canvas');
        }
      },
      
      onPanResponderMove: (event, gestureState) => {
        console.log('📱 onPanResponderMove - isDrawing:', isDrawing);
        
        const { locationX, locationY } = event.nativeEvent;
        console.log('📍 Movimiento:', { x: locationX, y: locationY });
        
        // Validar que las coordenadas sean válidas
        if (locationX >= 0 && locationY >= 0 && locationX <= canvasWidth && locationY <= canvasHeight) {
          console.log('✅ Coordenadas válidas, agregando punto');
          
          setCurrentStroke(prev => {
            console.log('📊 Puntos actuales antes de agregar:', prev.length);
            
            // Siempre agregar el punto (sin filtro de distancia por ahora)
            const newStroke = [...prev, { x: locationX, y: locationY }];
            console.log('📊 Puntos después de agregar:', newStroke.length);
            
            return newStroke;
          });
        } else {
          console.log('❌ Coordenadas fuera del canvas:', { x: locationX, y: locationY });
        }
      },
      
      onPanResponderRelease: (event, gestureState) => {
        console.log('🎨 Fin de dibujo - onPanResponderRelease');
        
        // Capturar el valor actual antes de limpiarlo
        setCurrentStroke(prevStroke => {
          console.log('🎨 Procesando trazo final con', prevStroke.length, 'puntos');
          
          if (prevStroke.length > 0) {
            console.log('✅ Guardando trazo con', prevStroke.length, 'puntos');
            setStrokes(prev => {
              const newStrokes = [...prev, { points: prevStroke, timestamp: Date.now() }];
              console.log('📚 Total de trazos guardados:', newStrokes.length);
              return newStrokes;
            });
          } else {
            console.log('❌ No hay puntos para guardar');
          }
          
          return []; // Limpiar el stroke actual
        });
        
        isDrawingRef.current = false;
        setIsDrawing(false);
        console.log('🔚 Dibujo terminado (PanResponder)');
      },
      
      onPanResponderTerminationRequest: (evt, gestureState) => false, // No permitir terminación prematura
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    })
  ).current;

  const hasSignature = strokes.length > 0 || currentStroke.length > 0;
  
  // Debug logging (solo cuando hay cambios significativos)
  if (strokes.length > 0 || currentStroke.length > 5) {
    console.log('🔍 Estado de firma:', {
      strokesCount: strokes.length,
      currentStrokeLength: currentStroke.length,
      hasSignature,
      isDrawing
    });
  }

  const renderStroke = (points: Point[], strokeIndex: number, isCurrentStroke = false) => {
    console.log(`🎨 Renderizando stroke ${strokeIndex} con ${points.length} puntos`, isCurrentStroke ? '(actual)' : '(guardado)');
    
    if (points.length === 0) return null;
    
    // Usar colores más contrastantes
    const strokeColor = isCurrentStroke ? '#2196F3' : '#000000'; // Azul para actual, negro para guardado
    
    // Renderizar cada punto como un círculo pequeño
    return points.map((point, pointIndex) => {
      return (
        <View
          key={`${strokeIndex}-${pointIndex}`}
                      style={[
            styles.strokePoint,
            {
              position: 'absolute',
              left: point.x - 3, // Centrar el punto
              top: point.y - 3,  // Centrar el punto
              width: 6,          // Puntos más grandes
              height: 6,         // Puntos más grandes
              backgroundColor: strokeColor,
              borderRadius: 3,   // Mantener círculos
              opacity: 0.8,      // Ligera transparencia para suavidad
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
              {/* Botón de limpiar en la esquina superior derecha */}
              {hasSignature && (
                <IconButton
                  icon="eraser"
                  mode="contained"
                  onPress={clearSignature}
                  style={styles.clearButtonOverlay}
                  size={20}
                />
              )}
              
              <View 
                style={styles.canvas}
                {...panResponder.panHandlers}
                onPointerDown={(event) => {
                  console.log('🖱️ onPointerDown disparado');
                  const { locationX, locationY } = event.nativeEvent;
                  console.log('📍 Pointer inicial:', { x: locationX, y: locationY });
                  
                  if (locationX >= 0 && locationY >= 0 && locationX <= canvasWidth && locationY <= canvasHeight) {
                    isDrawingRef.current = true;
                    setIsDrawing(true);
                    setCurrentStroke([{ x: locationX, y: locationY }]);
                    console.log('✅ Dibujo iniciado con pointer (ref y state)');
                  }
                }}
                onPointerMove={(event) => {
                  console.log('🖱️ onPointerMove disparado - isDrawingRef:', isDrawingRef.current, 'isDrawing state:', isDrawing);
                  
                  if (isDrawingRef.current) {
                    const { locationX, locationY } = event.nativeEvent;
                    console.log('📍 Pointer movimiento:', { x: locationX, y: locationY });
                    
                    if (locationX >= 0 && locationY >= 0 && locationX <= canvasWidth && locationY <= canvasHeight) {
                      setCurrentStroke(prev => {
                        // Capturar TODOS los puntos para máxima suavidad
                        const newStroke = [...prev, { x: locationX, y: locationY }];
                        console.log('📊 Agregando punto con pointer, total:', newStroke.length, 'coords:', { x: locationX, y: locationY });
                        return newStroke;
                      });
                    }
                  }
                }}
                onPointerUp={(event) => {
                  console.log('🖱️ onPointerUp disparado - isDrawingRef:', isDrawingRef.current);
                  
                  if (isDrawingRef.current) {
                    setCurrentStroke(prevStroke => {
                      console.log('🎨 Finalizando trazo con pointer, puntos:', prevStroke.length);
                      
                      if (prevStroke.length > 0) {
                        setStrokes(prev => [...prev, { points: prevStroke, timestamp: Date.now() }]);
                        console.log('✅ Trazo guardado con pointer');
                      }
                      
                      return [];
                    });
                    
                    isDrawingRef.current = false;
                    setIsDrawing(false);
                    console.log('🔚 Dibujo terminado (ref y state)');
                  }
                }}
              >
                {/* Strokes completados */}
                {strokes.map((stroke, index) => {
                  console.log(`🖌️ Renderizando stroke guardado ${index} con ${stroke.points.length} puntos`);
                  return renderStroke(stroke.points, index, false);
                })}
                
                {/* Stroke actual siendo dibujado */}
                {currentStroke.length > 0 && (
                  <>
                    {console.log(`✏️ Renderizando stroke actual con ${currentStroke.length} puntos`)}
                    {renderStroke(currentStroke, -1, true)}
                  </>
                )}
                
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
    backgroundColor: '#ffffff', // Fondo completamente blanco para mejor contraste
    marginBottom: 15,
    position: 'relative', // Para posicionar el botón limpiar
  },
  canvas: {
    width: 300,
    height: 150,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent', // Transparente para mostrar el fondo blanco
  },
  strokeSegment: {
    borderRadius: 1,
  },
  strokePoint: {
    // Puntos individuales de la firma
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
  clearButtonOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    margin: 0,
  },
  acceptButton: {
    minWidth: 120,
  },
}); 
import React from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
  Surface,
} from 'react-native-paper';
import { View, StyleSheet, ScrollView } from 'react-native';

interface LocationViewerProps {
  visible: boolean;
  onDismiss: () => void;
  locationData: any; // Los datos de ubicación guardados
  title?: string;
}

export const LocationViewer: React.FC<LocationViewerProps> = ({
  visible,
  onDismiss,
  locationData,
  title = 'Ubicación Registrada'
}) => {
  const theme = useTheme();

  // Extraer datos de ubicación
  const location = locationData ? {
    latitude: locationData.latitude || '41.3851',
    longitude: locationData.longitude || '2.1734',
    accuracy: locationData.accuracy || '5 metros',
    timestamp: locationData.timestamp || new Date().toISOString(),
    address: locationData.address || 'Barcelona, España'
  } : null;

  if (!location) {
    return null;
  }

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

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Mapa simulado */}
            <Surface style={styles.mapContainer} elevation={2}>
              <View style={styles.mapView}>
                {/* Cuadrícula del mapa */}
                <View style={styles.mapGrid}>
                  <View style={[styles.gridLine, styles.gridLineHorizontal1]} />
                  <View style={[styles.gridLine, styles.gridLineHorizontal2]} />
                  <View style={[styles.gridLine, styles.gridLineVertical1]} />
                  <View style={[styles.gridLine, styles.gridLineVertical2]} />
                  <View style={[styles.gridLine, styles.gridLineVertical3]} />
                </View>
                
                {/* Punto de ubicación central */}
                <View style={styles.locationMarker}>
                  <View style={styles.markerDot} />
                  <View style={styles.markerPulse} />
                </View>
                
                {/* Indicador de precisión */}
                <View style={[styles.accuracyCircle, { 
                  borderColor: theme.colors.primary + '40' 
                }]} />
                
                {/* Etiqueta del mapa */}
                <View style={styles.mapLabel}>
                  <Text variant="labelSmall" style={styles.mapLabelText}>
                    📍 Tu ubicación
                  </Text>
                </View>
              </View>
            </Surface>

            {/* Información de la ubicación */}
            <View style={styles.infoContainer}>
              <View style={styles.infoSection}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Coordenadas GPS
                </Text>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Latitud:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>{location.latitude}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Longitud:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>{location.longitude}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Precisión:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>{location.accuracy}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Información adicional
                </Text>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Dirección:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>{location.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Fecha y hora:</Text>
                  <Text variant="bodySmall" style={styles.infoValue}>
                    {formatTimestamp(location.timestamp)}
                  </Text>
                </View>
              </View>

              {/* Nota informativa */}
              <View style={styles.noteContainer}>
                <Text variant="bodySmall" style={styles.noteText}>
                  💡 Esta ubicación fue registrada como evidencia para la subtarea.
                  Los datos están almacenados de forma segura.
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
    maxHeight: '80%',
  },
  title: {
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapView: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#ddd',
  },
  gridLineHorizontal1: {
    width: '100%',
    height: 1,
    top: '33%',
  },
  gridLineHorizontal2: {
    width: '100%',
    height: 1,
    top: '66%',
  },
  gridLineVertical1: {
    width: 1,
    height: '100%',
    left: '20%',
  },
  gridLineVertical2: {
    width: 1,
    height: '100%',
    left: '50%',
  },
  gridLineVertical3: {
    width: 1,
    height: '100%',
    left: '80%',
  },
  locationMarker: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 2,
  },
  markerPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    opacity: 0.3,
    zIndex: 1,
  },
  accuracyCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  mapLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
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
    flex: 2,
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
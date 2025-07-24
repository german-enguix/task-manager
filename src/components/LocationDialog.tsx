import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { View, StyleSheet, Animated, Easing, Alert } from 'react-native';
import * as Location from 'expo-location';

interface LocationDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: (locationData: any) => void;
  title?: string;
  description?: string;
}

export const LocationDialog: React.FC<LocationDialogProps> = ({
  visible,
  onDismiss,
  onSuccess,
  title = 'Obtener Ubicación',
  description = 'Obteniendo tu ubicación actual mediante GPS'
}) => {
  const theme = useTheme();
  const [isSearching, setIsSearching] = useState(false);
  const [isLocationFound, setIsLocationFound] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [realLocationData, setRealLocationData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [gpsAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      resetState();
      requestLocationAndGet();
    } else {
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setIsSearching(false);
    setIsLocationFound(false);
    setButtonEnabled(false);
    setRealLocationData(null);
    setCurrentStatus('');
    stopAnimations();
  };

  const requestLocationAndGet = async () => {
    try {
      setIsSearching(true);
      setCurrentStatus('Solicitando permisos...');
      startAnimations();

      // 1. Verificar si la ubicación está habilitada
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setCurrentStatus('GPS desactivado');
        Alert.alert(
          'GPS Desactivado',
          'Por favor, activa la ubicación en tu dispositivo y vuelve a intentarlo.',
          [{ text: 'OK', onPress: handleCancel }]
        );
        return;
      }

      // 2. Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setCurrentStatus('Permisos denegados');
        Alert.alert(
          'Permisos Necesarios',
          'Necesitamos acceso a tu ubicación para registrar la evidencia. Por favor, otorga los permisos en la configuración.',
          [{ text: 'OK', onPress: handleCancel }]
        );
        return;
      }

      // 3. Obtener ubicación actual
      setCurrentStatus('Buscando señal GPS...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 0,
      });

      // 4. Obtener dirección aproximada (opcional)
      let address = 'Ubicación desconocida';
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          address = `${place.street || ''} ${place.streetNumber || ''}, ${place.city || place.subregion || ''}, ${place.region || place.country || ''}`.trim();
          // Limpiar espacios extra y comas
          address = address.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
        }
      } catch (geocodeError) {
        console.warn('Could not get address:', geocodeError);
        // No es crítico, continuamos sin dirección
      }

      // 5. Preparar datos de ubicación
      const locationData = {
        latitude: location.coords.latitude.toFixed(6),
        longitude: location.coords.longitude.toFixed(6),
        accuracy: `${Math.round(location.coords.accuracy || 0)} metros`,
        altitude: location.coords.altitude ? `${Math.round(location.coords.altitude)} metros` : 'No disponible',
        timestamp: new Date(location.timestamp).toISOString(),
        address: address,
        provider: 'GPS',
        speed: location.coords.speed ? `${Math.round(location.coords.speed * 3.6)} km/h` : null,
        heading: location.coords.heading ? `${Math.round(location.coords.heading)}°` : null
      };

      setRealLocationData(locationData);
      setIsSearching(false);
      setIsLocationFound(true);
      setButtonEnabled(true);
      setCurrentStatus('Ubicación encontrada');
      stopAnimations();

    } catch (error) {
      console.error('Error getting location:', error);
      setIsSearching(false);
      setCurrentStatus('Error de ubicación');
      
      let errorMessage = 'No se pudo obtener la ubicación. ';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage += 'Tiempo de espera agotado. Asegúrate de estar en un área con buena señal GPS.';
        } else if (error.message.includes('permission')) {
          errorMessage += 'Permisos de ubicación denegados.';
        } else {
          errorMessage += 'Inténtalo de nuevo.';
        }
      } else {
        errorMessage += 'Inténtalo de nuevo.';
      }

      Alert.alert(
        'Error de Ubicación',
        errorMessage,
        [
          { text: 'Cancelar', style: 'cancel', onPress: handleCancel },
          { text: 'Reintentar', onPress: requestLocationAndGet }
        ]
      );
    }
  };

  const startAnimations = () => {
    // Animación de rotación para el ícono GPS
    const rotateAnimation = Animated.loop(
      Animated.timing(gpsAnimation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Animación de pulso para el efecto de búsqueda
    const pulseAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    pulseAnimationLoop.start();
  };

  const stopAnimations = () => {
    gpsAnimation.stopAnimation();
    pulseAnimation.stopAnimation();
    gpsAnimation.setValue(0);
    pulseAnimation.setValue(1);
  };

  const handleFichaje = () => {
    if (realLocationData) {
      onSuccess(realLocationData);
      resetState();
    }
  };

  const handleCancel = () => {
    resetState();
    onDismiss();
  };

  const rotateInterpolate = gpsAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        
        <Dialog.Content>
          <View style={styles.content}>
            {/* Área de animación */}
            <View style={styles.animationContainer}>
              {/* Círculos de pulso de fondo */}
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle1,
                  {
                    transform: [{ scale: isSearching ? pulseAnimation : 1 }],
                    backgroundColor: isLocationFound ? '#4CAF50' + '20' : theme.colors.primary + '20',
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle2,
                  {
                    transform: [{ scale: isSearching ? pulseAnimation : 1 }],
                    backgroundColor: isLocationFound ? '#4CAF50' + '15' : theme.colors.primary + '15',
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle3,
                  {
                    transform: [{ scale: isSearching ? pulseAnimation : 1 }],
                    backgroundColor: isLocationFound ? '#4CAF50' + '10' : theme.colors.primary + '10',
                  }
                ]}
              />
              
              {/* Ícono GPS central con mini mapa */}
              <View
                style={[
                  styles.gpsContainer,
                  {
                    backgroundColor: isLocationFound ? '#4CAF50' : theme.colors.primary,
                  }
                ]}
              >
                {isLocationFound ? (
                  // Mini mapa con punto de ubicación
                  <View style={styles.miniMap}>
                    <View style={styles.mapGrid}>
                      {/* Cuadrícula del mapa */}
                      <View style={styles.gridLine} />
                      <View style={[styles.gridLine, styles.gridLineHorizontal]} />
                      <View style={[styles.gridLine, styles.gridLineVertical1]} />
                      <View style={[styles.gridLine, styles.gridLineVertical2]} />
                    </View>
                    {/* Punto de ubicación */}
                    <View style={styles.locationPin}>
                      <Text style={styles.locationPinText}>📍</Text>
                    </View>
                  </View>
                ) : (
                  // Ícono GPS girando
                  <Animated.Text
                    style={[
                      styles.gpsIcon,
                      {
                        transform: [{ rotate: rotateInterpolate }],
                      }
                    ]}
                  >
                    🌐
                  </Animated.Text>
                )}
              </View>
            </View>

            {/* Texto descriptivo */}
            <Text variant="bodyMedium" style={styles.description}>
              {isLocationFound ? '¡Ubicación encontrada!' : description}
            </Text>

            {/* Información de ubicación */}
            {isLocationFound && realLocationData && (
              <View style={styles.locationInfo}>
                <Text variant="bodySmall" style={styles.locationText}>
                  📍 Lat: {realLocationData.latitude}
                </Text>
                <Text variant="bodySmall" style={styles.locationText}>
                  📍 Lng: {realLocationData.longitude}
                </Text>
                <Text variant="bodySmall" style={styles.locationText}>
                  🎯 Precisión: {realLocationData.accuracy}
                </Text>
                {realLocationData.address && (
                  <Text variant="bodySmall" style={[styles.locationText, styles.addressText]}>
                    📍 {realLocationData.address}
                  </Text>
                )}
              </View>
            )}

            {/* Indicador de estado */}
            <View style={styles.statusContainer}>
              {isLocationFound ? (
                <Text variant="bodySmall" style={[styles.statusText, { color: '#4CAF50', fontWeight: 'bold' }]}>
                  ✅ Ubicación obtenida - Lista para fichaje
                </Text>
              ) : isSearching ? (
                <>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodySmall" style={[styles.statusText, { color: theme.colors.primary }]}>
                    {currentStatus}
                  </Text>
                </>
              ) : (
                <Text variant="bodySmall" style={styles.statusText}>
                  {currentStatus || 'Preparando ubicación...'}
                </Text>
              )}
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={false}>
            Cancelar
          </Button>
          <Button 
            mode="contained" 
            onPress={handleFichaje}
            style={[styles.fichajeButton, !buttonEnabled && styles.disabledButton]}
            disabled={!buttonEnabled}
          >
            {buttonEnabled ? 'Fichaje' : 'Buscando...'}
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
    paddingVertical: 20,
  },
  animationContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  pulseCircle1: {
    width: 120,
    height: 120,
  },
  pulseCircle2: {
    width: 140,
    height: 140,
  },
  pulseCircle3: {
    width: 160,
    height: 160,
  },
  gpsContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  gpsIcon: {
    fontSize: 24,
  },
  miniMap: {
    width: 70,
    height: 70,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
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
  gridLineHorizontal: {
    width: '100%',
    height: 1,
    top: '50%',
  },
  gridLineVertical1: {
    width: 1,
    height: '100%',
    left: '33%',
  },
  gridLineVertical2: {
    width: 1,
    height: '100%',
    left: '66%',
  },
  locationPin: {
    position: 'absolute',
    top: '30%',
    left: '40%',
  },
  locationPinText: {
    fontSize: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  locationInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    minWidth: '80%',
  },
  locationText: {
    fontSize: 11,
    marginVertical: 1,
    fontFamily: 'monospace',
    color: '#666',
  },
  addressText: {
    fontSize: 10,
    fontFamily: 'default',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 200,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.7,
  },
  fichajeButton: {
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.6,
  },
}); 
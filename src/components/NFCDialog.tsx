import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Portal,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface NFCDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const NFCDialog: React.FC<NFCDialogProps> = ({
  visible,
  onDismiss,
  onSuccess,
  title = 'Escanear NFC',
  description = 'Acerca tu dispositivo al tag NFC para registrar la evidencia'
}) => {
  const theme = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      setIsScanning(true);
      startAnimations();
    } else {
      setIsScanning(false);
      stopAnimations();
    }
  }, [visible]);

  const startAnimations = () => {
    // Animación de rotación para el ícono NFC
    const rotateAnimation = Animated.loop(
      Animated.timing(scanAnimation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Animación de pulso para el efecto de escaneo
    const pulseAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
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
    scanAnimation.stopAnimation();
    pulseAnimation.stopAnimation();
    scanAnimation.setValue(0);
    pulseAnimation.setValue(1);
  };

  const handleSimulateSuccess = () => {
    setIsScanning(false);
    stopAnimations();
    
    // Simular un pequeño delay para que se vea más realista
    setTimeout(() => {
      onSuccess();
    }, 500);
  };

  const handleCancel = () => {
    setIsScanning(false);
    stopAnimations();
    onDismiss();
  };

  const rotateInterpolate = scanAnimation.interpolate({
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
                    transform: [{ scale: pulseAnimation }],
                    backgroundColor: theme.colors.primary + '20',
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle2,
                  {
                    transform: [{ scale: pulseAnimation }],
                    backgroundColor: theme.colors.primary + '15',
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  styles.pulseCircle3,
                  {
                    transform: [{ scale: pulseAnimation }],
                    backgroundColor: theme.colors.primary + '10',
                  }
                ]}
              />
              
              {/* Ícono NFC central */}
              <Animated.View
                style={[
                  styles.nfcIcon,
                  {
                    transform: [{ rotate: rotateInterpolate }],
                    backgroundColor: theme.colors.primary,
                  }
                ]}
              >
                <Text style={styles.nfcText}>NFC</Text>
              </Animated.View>
            </View>

            {/* Texto descriptivo */}
            <Text variant="bodyMedium" style={styles.description}>
              {description}
            </Text>

            {/* Indicador de estado */}
            <View style={styles.statusContainer}>
              {isScanning ? (
                <>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodySmall" style={[styles.statusText, { color: theme.colors.primary }]}>
                    Buscando tag NFC...
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
          <Button onPress={handleCancel}>
            Cancelar
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSimulateSuccess}
            style={styles.simulateButton}
          >
            Simular Lectura
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
    paddingVertical: 20,
  },
  animationContainer: {
    width: 150,
    height: 150,
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
  nfcIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  nfcText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.7,
  },
  simulateButton: {
    minWidth: 120,
  },
}); 
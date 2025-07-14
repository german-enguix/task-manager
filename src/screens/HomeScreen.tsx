import React from 'react';
import { ScrollView, Alert, StyleSheet, View } from 'react-native';
import { Text, Surface, Button, Card, IconButton, Switch } from 'react-native-paper';
import { formatDate } from '@/utils';

interface HomeScreenProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  isDarkMode, 
  toggleTheme 
}) => {
  const handleFichar = () => {
    const currentTime = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    Alert.alert(
      'Fichaje registrado',
      `Has fichado correctamente a las ${currentTime}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <Surface style={styles.container}>
      {/* Header with Dark Mode Toggle */}
      <Surface elevation={2} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text variant="headlineMedium">
              Bienvenido
            </Text>
            <Text variant="bodyMedium">
              {formatDate(new Date())}
            </Text>
          </View>
          
          <View style={styles.themeToggle}>
            <IconButton
              icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
              size={24}
              onPress={toggleTheme}
            />
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </View>
      </Surface>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Hola Mundo Card */}
        <Card style={styles.card}>
          <Card.Title title="¡Hola Mundo!" subtitle="Tu aplicación está funcionando correctamente" />
          <Card.Content>
            <Text variant="bodyLarge">
              🎉 Bienvenido a Tasks Concept
            </Text>
            <Text variant="bodyMedium">
              Esta es tu página principal. Desde aquí podrás gestionar todas tus
              tareas y fichajes.
            </Text>
          </Card.Content>
        </Card>

        {/* Fichar Section */}
        <Card style={styles.card}>
          <Card.Title title="Sistema de Fichaje" />
          <Card.Content>
            <Text variant="bodyMedium">
              Registra tu entrada o salida con un simple clic
            </Text>

            <Button
              mode="contained"
              onPress={handleFichar}
              style={styles.button}>
              Fichar
            </Button>

            <Text variant="bodySmall">
              Hora actual: {new Date().toLocaleTimeString('es-ES')}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  button: {
    marginVertical: 8,
  },
});

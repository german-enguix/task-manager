import React from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { PaperCard, PaperButtonComponent } from '@/components';
import { formatDate } from '@/utils';
import { SPACING, LAYOUT } from '@/constants';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();

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
      {/* Header */}
      <Surface style={styles.header} elevation={4}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Bienvenido
        </Text>
        <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {formatDate(new Date())}
        </Text>
      </Surface>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hola Mundo Card */}
        <PaperCard
          title="¡Hola Mundo!"
          subtitle="Tu aplicación está funcionando correctamente"
          style={styles.card}
        >
          <Surface style={styles.cardContent}>
            <Text variant="bodyLarge" style={styles.welcomeText}>
              🎉 Bienvenido a Tasks Concept
            </Text>
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              Esta es tu página principal. Desde aquí podrás gestionar todas tus
              tareas y fichajes.
            </Text>
          </Surface>
        </PaperCard>

        {/* Fichar Section */}
        <PaperCard title="Sistema de Fichaje" style={styles.card}>
          <Surface style={styles.ficharSection}>
            <Text variant="bodyMedium" style={[styles.ficharDescription, { color: theme.colors.onSurfaceVariant }]}>
              Registra tu entrada o salida con un simple clic
            </Text>

            <Surface style={styles.buttonContainer}>
              <PaperButtonComponent
                title="Fichar"
                onPress={handleFichar}
                variant="contained"
                size="large"
                style={styles.ficharButton}
              />
            </Surface>

            <Text variant="bodySmall" style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
              Hora actual: {new Date().toLocaleTimeString('es-ES')}
            </Text>
          </Surface>
        </PaperCard>
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    ...LAYOUT.header,
    borderRadius: 0,
    borderBottomLeftRadius: SPACING.md,
    borderBottomRightRadius: SPACING.md,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    // Color aplicado dinámicamente con theme
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    ...LAYOUT.scrollContent,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  welcomeText: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  ficharSection: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  ficharDescription: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  buttonContainer: {
    marginBottom: SPACING.md,
  },
  ficharButton: {
    ...LAYOUT.button,
    minWidth: 120,
    paddingHorizontal: SPACING.xl,
  },
  timeText: {
    fontStyle: 'italic',
  },
});

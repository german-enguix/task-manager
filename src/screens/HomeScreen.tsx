import React from 'react';
import { ScrollView, Alert, StyleSheet, View } from 'react-native';
import { Text, Surface, Button, Card, IconButton, Switch, Chip } from 'react-native-paper';
import { formatDate } from '@/utils';
import { getAllTasks } from '@/utils/mockData';
import { TaskStatus } from '@/types';

interface HomeScreenProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onNavigateToTask: (taskId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  isDarkMode, 
  toggleTheme,
  onNavigateToTask
}) => {
  const tasks = getAllTasks();

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

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return '#9E9E9E';
      case TaskStatus.IN_PROGRESS:
        return '#2196F3';
      case TaskStatus.PAUSED:
        return '#FF9800';
      case TaskStatus.COMPLETED:
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'Sin empezar';
      case TaskStatus.IN_PROGRESS:
        return 'En progreso';
      case TaskStatus.PAUSED:
        return 'Pausada';
      case TaskStatus.COMPLETED:
        return 'Finalizada';
      default:
        return 'Desconocido';
    }
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

        {/* Tareas */}
        <Card style={styles.card}>
          <Card.Title title="Mis Tareas" subtitle="Tareas asignadas" />
          <Card.Content>
            {tasks.slice(0, 3).map((task) => (
              <Card 
                key={task.id} 
                style={styles.taskCard}
                onPress={() => onNavigateToTask(task.id)}
              >
                <Card.Content>
                  <View style={styles.taskHeader}>
                    <Text variant="titleMedium" numberOfLines={1} style={styles.taskTitle}>
                      {task.title}
                    </Text>
                    <Chip 
                      mode="outlined" 
                      style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
                      textStyle={{ color: getStatusColor(task.status), fontSize: 12 }}
                    >
                      {getStatusText(task.status)}
                    </Chip>
                  </View>
                  
                  <Text variant="bodySmall" numberOfLines={2} style={styles.taskDescription}>
                    {task.description}
                  </Text>
                  
                  <View style={styles.taskFooter}>
                    <Text variant="bodySmall" style={styles.taskAssignee}>
                      Asignado a: {task.assignedTo}
                    </Text>
                    {task.dueDate && (
                      <Text variant="bodySmall" style={styles.taskDueDate}>
                        Vence: {task.dueDate.toLocaleDateString('es-ES')}
                      </Text>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            {tasks.length > 3 && (
              <Button 
                mode="text" 
                onPress={() => {
                  // Aquí se podría navegar a una lista completa de tareas
                  Alert.alert('Info', 'Funcionalidad pendiente: Ver todas las tareas');
                }}
                style={styles.viewAllButton}
              >
                Ver todas las tareas ({tasks.length})
              </Button>
            )}
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
  taskCard: {
    marginBottom: 12,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  taskDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskAssignee: {
    fontWeight: '500',
  },
  taskDueDate: {
    opacity: 0.6,
  },
  viewAllButton: {
    marginTop: 8,
  },
  button: {
    marginVertical: 8,
  },
});
